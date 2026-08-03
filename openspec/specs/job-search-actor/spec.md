# job-search-actor Specification

## Purpose
TBD - created by archiving change add-jobs-actor. Update Purpose after archive.
## Requirements
### Requirement: Actor queries the freehire search endpoint

The actor SHALL retrieve jobs from `https://freehire.me/api/v1/jobs/search`, mapping its
input fields to that endpoint's query parameters. It MUST NOT use `/api/v1/jobs`, which
accepts only `limit` and `offset` and applies no filters.

#### Scenario: Filters are forwarded to the search endpoint

- **WHEN** the run input is `{"countries":["de"],"skills":["go"]}`
- **THEN** the actor issues a request to `/api/v1/jobs/search` carrying `countries=de` and
  `skills=go`
- **AND** every job written to the dataset matches those filters

#### Scenario: An empty input returns the freshest postings

- **WHEN** the run input contains no filters
- **THEN** the actor requests the search endpoint without filter parameters
- **AND** results are ordered by `posted_at` descending

### Requirement: Results are written in the freehire wire shape

The actor SHALL write one dataset item per job, preserving the field names returned by the
API so the dataset schema cannot drift from the source. Each item MUST additionally carry
`freehire_url`, the canonical link to the posting on freehire.

#### Scenario: A dataset item carries source fields and a back-link

- **WHEN** the actor writes a job whose `public_slug` is `acme-backend-engineer-ab12`
- **THEN** the item retains `public_slug`, `title`, `company`, `url`, `countries`, `skills`,
  `posted_at`, `source` and `enrichment` under those exact names
- **AND** the item contains `freehire_url` equal to
  `https://freehire.me/jobs/acme-backend-engineer-ab12`

### Requirement: Runs are bounded by a hard item ceiling

The actor SHALL stop after collecting 1000 items, regardless of the requested `maxItems`.
It SHALL request at most 100 items per page and SHALL pause at least 250 ms between pages.

#### Scenario: A larger maxItems is capped

- **WHEN** the run input requests `maxItems` of 50000
- **AND** the filter matches more than 1000 jobs
- **THEN** the actor writes exactly 1000 items
- **AND** issues no more than 10 requests to the API

#### Scenario: The ceiling is reported as an invitation

- **WHEN** a run stops because the ceiling was reached
- **THEN** the log states how many items were collected out of how many matched
- **AND** it names the freehire API as the route to the full catalogue
- **AND** the run finishes successfully rather than failing

### Requirement: Upstream failures degrade to a partial dataset

The actor SHALL retry a failed page once with backoff. If the endpoint remains unavailable,
the actor SHALL finish successfully with the items already collected and record the failure
in the run summary.

#### Scenario: The API becomes unavailable mid-run

- **WHEN** the third page request fails twice with a 5xx response
- **THEN** the actor stops requesting further pages
- **AND** the items from the first two pages remain in the dataset
- **AND** the run summary records that collection ended early because of an upstream failure

#### Scenario: A filter matches nothing

- **WHEN** the filter combination returns zero results
- **THEN** the run finishes successfully with an empty dataset
- **AND** the log reports that nothing matched and echoes the parameters that were sent

