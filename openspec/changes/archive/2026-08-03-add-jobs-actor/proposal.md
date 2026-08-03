## Why

freehire holds a catalogue of ~4.4M normalised, enriched job postings behind a free public
API, but reaches only the people who already know the site. Apify Store is where developers,
recruiters and AI teams go looking for job data, and they adopt what arrives as a dataset in
their existing pipeline rather than as an API they must integrate. A free actor puts the
catalogue in front of that audience and sends them back to freehire for anything beyond a
sample.

## What Changes

- New standalone repository `freehire-apify` containing one Apify actor, `freehire-jobs`.
- The actor accepts eight job filters plus a text query, queries the public
  `/api/v1/jobs/search` endpoint, and writes results to an Apify Dataset.
- Every dataset row carries a `freehire_url` back to the posting on freehire — the
  distribution mechanism.
- A hard ceiling of 1000 items per run, with the ceiling reported as an invitation to use
  the API for the full catalogue, not as an error.
- Input filters are validated against an allow-list before any network call, because the
  upstream endpoint silently ignores unknown filter names and would otherwise return an
  unfiltered catalogue for a typo.
- Store listing: README with worked examples, output field table, and the stated ceiling.

No change to freehire itself. The actor is a pure consumer of an endpoint that already
exists and is already public.

## Capabilities

### New Capabilities

- `job-search-actor`: accepting filter input, querying the freehire search API within
  server-side and self-imposed limits, and emitting normalised job records to a dataset.
- `filter-validation`: rejecting unknown or malformed filters before any request is issued,
  with an error naming the offending key and its accepted values.

### Modified Capabilities

None. This is a greenfield repository.

## Impact

- **New repository**: `freehire-apify` (TypeScript, Apify SDK, Node).
- **Upstream dependency**: `https://freehire.me/api/v1/jobs/search` — public, unauthenticated,
  page size capped at 100, `offset + limit > 10000` rejected as "pagination too deep".
- **Production load**: freehire's public list endpoints carry no rate limiter. The actor's
  own ceiling and inter-page delay are the only thing bounding traffic from a popular
  listing against a host that has previously seen I/O saturation.
- **No changes** to the freehire codebase, database, or deployment.
