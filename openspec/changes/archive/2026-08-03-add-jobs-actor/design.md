## Context

freehire serves ~4.4M normalised job postings from a free, unauthenticated API. The audience
that would use this data — developers, recruiters, AI teams — discovers tools on Apify Store,
and adopts what drops into their pipeline as a dataset rather than what requires writing a
client. This change adds a free actor whose purpose is reach, not revenue.

Constraints measured against production before designing:

- `/api/v1/jobs` parses no filters at all — only `limit` and `offset` over the whole
  catalogue. All facets live on `/api/v1/jobs/search`, backed by Meilisearch.
- The search endpoint caps page size at 100 no matter what `limit` asks for.
- `offset + limit > 10000` returns `400 {"error":"pagination too deep"}`.
- Unknown query parameters are ignored silently, not rejected.
- freehire's public list endpoints have **no rate limiter**; limiters exist only on auth,
  tracer links, mail-recall and photo upload.

The full design rationale lives in `docs/superpowers/specs/2026-08-02-freehire-apify-actor-design.md`.

## Goals / Non-Goals

**Goals:**

- Put the catalogue inside other people's pipelines, with a link back on every row.
- Stay trivially small: the deliverable that matters is the Store listing and its README.
- Bound traffic so a popular listing cannot become an incident on an unrated endpoint.
- Fail loudly on a mistyped filter, because the upstream fails silently.

**Non-Goals:**

- Revenue. The actor is free; no pricing tiers, no paid access.
- A company hiring-signal actor. Plausible as a second listing, deliberately deferred.
- Any change to freehire itself — no new endpoint, no schema change, no deployment.
- Authenticated access to larger pages, and anything that writes back to freehire.

## Decisions

**TypeScript on the Apify SDK, in a standalone repository.**
Considered a Go actor inside `hire` (shared `jobview` types, one language) and rejected it:
there is no official Apify Go SDK, so dataset/KV/INPUT handling would be hand-rolled, and the
build would be slower in exchange for nothing — the actor only forwards HTTP responses. It
would also join the `hire` release cycle. A separate public repository additionally serves as
the listing's shopfront.

**Source is `/api/v1/jobs/search`, never `/api/v1/jobs`.**
The latter cannot filter. This is written into the spec because it is the single most likely
implementation mistake, and it fails silently by returning an unfiltered catalogue.

**Eight filters exposed, not all twenty-four.**
The API supports 24 facets. Surfacing them all bloats the input form without widening the
audience. The eight chosen cover geography, skills, seniority, category, work mode,
recency, salary floor and free text.

**Validation against an allow-list, before the first request.**
This is the direct consequence of the upstream ignoring unknown keys: without it, `seniorty`
returns 1000 rows of unfiltered catalogue that look like a successful run. Failing closed at
input parsing is the only place this can be caught.

**A hard 1000-item ceiling, not a configurable one.**
`maxItems` is accepted but clamped. Ten requests per run at 100 per page, 250 ms apart. The
ceiling doubles as the distribution mechanism: hitting it prints an invitation to use the API
for the full catalogue.

**Output preserves upstream field names.**
Renaming fields would create a second schema to maintain, guaranteed to drift. The only
addition is `freehire_url`.

## Risks / Trade-offs

- **A popular actor generates real load on an endpoint with no rate limiter, against a host
  that has already seen I/O saturation with Postgres on defaults.** → The per-run ceiling and
  inter-page delay bound a single run to 10 requests. This is mitigation, not a guarantee:
  nothing stops many concurrent runs. If load becomes visible, the durable fix is a rate
  limiter on the freehire side, which this change deliberately does not add.
- **The dataset schema is coupled to the upstream wire shape.** → Accepted on purpose:
  one schema that can change is better than two schemas that must be kept in sync. A field
  rename upstream surfaces as a changed dataset column, which is the honest outcome.
- **`meta.total` on the search endpoint is a planner estimate, and observed values differed
  between calls (4,413,625 vs 3,405,664).** → Only used for the human-readable "collected N
  of M" line, never for control flow or pagination.
- **The 10000-item pagination window is far above our 1000 ceiling.** → No interaction today;
  noted so that raising the ceiling later is understood to have a hard upstream limit at
  10000.

## Migration Plan

Greenfield repository; nothing to migrate. Deployment is publishing the actor to Apify Store.
Rollback is unpublishing the listing — no state, no consumers inside freehire, nothing to
revert on the server.

## Open Questions

None blocking implementation. Deferred by choice: whether a second actor for company hiring
signal is worth building, decided after this one has usage data.
