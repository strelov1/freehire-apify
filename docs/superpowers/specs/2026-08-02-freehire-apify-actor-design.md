# freehire-jobs — Apify Actor

Design, 2026-08-02.

## Purpose

Distribution, not revenue. The actor is a shopfront on Apify Store that puts freehire's
catalogue inside other people's pipelines and sends them back here for anything beyond a
sample. Success is measured in runs and referrals, not in Apify payouts — the actor is
free.

## Why an actor at all

The public API is free and unauthenticated, so nobody buys access. What they buy is
*shape*: a dataset that lands directly in an Apify pipeline, exports to CSV/JSON/Sheets,
and composes with the rest of their scrapers without anyone writing a client. That is the
whole product.

Corollary that drives every decision below: the real deliverable is the Store listing and
its README. The code exists to make the listing honest. Keep the code near zero.

## Approach

A thin TypeScript actor on the Apify SDK, in a new public repository (`freehire-apify`).
Rejected alternatives:

- **Go actor inside `hire`.** No official Apify Go SDK, so dataset/KV/INPUT handling is all
  hand-rolled, and the build is slower — in exchange for nothing, since the actor only
  forwards HTTP responses. It would also join the `hire` release cycle, which has enough
  hazards already.
- **A standalone ATS scraper.** Duplicates `cmd/ingest`, costs a week instead of a day, and
  defeats the purpose: such an actor never mentions freehire.

## Data source

`GET https://freehire.me/api/v1/jobs/search`

**Not `/api/v1/jobs`.** That endpoint takes only `limit`/`offset` and paginates the whole
catalogue; it parses no filters at all. Every facet lives on the search endpoint, backed by
Meilisearch.

Verified against production: `?countries=DE&skills=go&limit=2&sort=posted_at&order=desc`
returns 153 matches with correct facets.

Known server-side limits, both of which the actor must respect:

- page size is capped at 100 regardless of the requested `limit`
- `offset + limit > 10000` returns `400 {"error":"pagination too deep"}`

## Input schema

Eight facets plus a text query. The API exposes 24; surfacing all of them would bloat the
form without widening the audience.

| field | type | maps to | example |
|---|---|---|---|
| `query` | string | `q` | `senior backend` |
| `countries` | string[] | `countries` | `["de","pl"]` |
| `skills` | string[] | `skills` | `["go","kubernetes"]` |
| `seniority` | string[] | `seniority` | `["senior","lead"]` |
| `category` | string[] | `category` | `["backend"]` |
| `workMode` | string[] | `work_mode` | `["remote"]` |
| `postedWithinDays` | integer | `posted_within_days` | `7` |
| `salaryMin` | integer | `salary_min` | `80000` |
| `maxItems` | integer | — | `1000` |

### Validation is load-bearing

The search endpoint silently ignores unknown filter names. A typo (`seniorty=senior`) does
not error — it widens the query to the entire catalogue and the user gets 1000 irrelevant
rows believing they are filtered. The actor therefore validates every key and value against
its own allow-list and fails with a named error **before the first network call**.

## Output

One Dataset item per job, in the `jobview` wire shape, field names unchanged, so the schema
cannot drift from the API: `public_slug`, `title`, `company`, `company_slug`, `url`,
`source`, `countries`, `cities`, `regions`, `skills`, `posted_at`, `created_at`,
`enrichment`, `is_tech`, `collections`.

One computed addition: `freehire_url` — `https://freehire.me/jobs/{public_slug}`. Every row
carries a way back. That is the distribution mechanism, and it costs one string.

## Limits and politeness

- `maxItems` is hard-capped at **1000** per run, whatever the input says
- page size 100 → at most 10 requests per run
- 250 ms pause between pages
- one retry on 5xx with exponential backoff; after that, exit softly with whatever was
  collected rather than failing the run

The public list endpoints carry **no rate limiter** (limiters exist only on auth, tracer
links, mail-recall and photo upload). The actor's own ceiling is therefore the only thing
standing between a popular listing and the production database, on a host that has already
seen I/O saturation with Postgres on defaults.

At the ceiling, log an invitation rather than an error:

```
Collected 1000 of 4,312 matching jobs.
The full catalogue is available via the freehire API — https://freehire.me/api
```

## Error handling

Three classes, each ending in a sentence a human can act on:

1. **Invalid filter** — fail before any network call, name the offending key and the
   accepted values.
2. **API unavailable** — push what was collected, record the failure in the run summary,
   exit successfully. A partial dataset beats a red run.
3. **Empty result** — not an error. Report that the filter matched nothing and echo the
   parameters that were applied, so the user can see what was actually sent.

## Testing

Unit tests cover the only non-trivial logic: query-string construction and the filter
validator. One smoke run against production with `maxItems: 20`. A full test harness for
150 lines of code would be overbuilt.

## Publication

README is the artifact that matters: what it does, three worked input examples with real
filters, an output field table, an explicit line about the 1000-item ceiling, and the API
link. Store categories `Jobs` and `Business`. Existing freehire logo as the icon.

## Out of scope

Company hiring-signal actor (a plausible second listing, deliberately deferred), paid
pricing tiers, authenticated access to larger pages, and anything that writes to freehire.
