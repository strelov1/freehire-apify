## MODIFIED Requirements

### Requirement: Results are written in the freehire wire shape

The actor SHALL write one dataset item per job, preserving the field names returned by the
API so the dataset schema cannot drift from the source. Each item MUST additionally carry
`freehire_url`, the canonical link to the posting on freehire, tagged with UTM attribution
so traffic arriving through the dataset can be told apart from direct traffic.

#### Scenario: A dataset item carries source fields and a back-link

- **WHEN** the actor writes a job whose `public_slug` is `acme-backend-engineer-ab12`
- **THEN** the item retains `public_slug`, `title`, `company`, `url`, `countries`, `skills`,
  `posted_at`, `source` and `enrichment` under those exact names
- **AND** the item contains `freehire_url` equal to
  `https://freehire.me/jobs/acme-backend-engineer-ab12?utm_source=apify&utm_medium=actor`
