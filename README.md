# freehire Jobs Scraper

Pull IT job postings from the [freehire](https://freehire.me) catalogue — ~4.4M normalised,
deduplicated and AI-enriched vacancies gathered from Greenhouse, Ashby, Workable, Lever,
Recruitee, Workday and hundreds of company boards — filtered by country, skill, seniority,
category, work mode, recency and salary.

Every row comes back with structured fields: canonical skill tags, ISO country codes,
cities, seniority, category, salary when stated, and a link both to the original posting and
to freehire.

## What you get

One dataset item per job, in freehire's own field names:

| field | description |
|---|---|
| `title` | Job title |
| `company` | Company name |
| `company_slug` | Stable company identifier |
| `url` | The original posting on the company's board |
| `freehire_url` | The posting on freehire (tagged `utm_source=apify`) |
| `countries` | ISO 3166-1 alpha-2 codes, lowercase |
| `cities` | Recognised cities |
| `regions` | Region tags, including `remote` variants |
| `skills` | Canonical skill tags (`go`, `kubernetes`, `react`) |
| `source` | Which board it came from |
| `posted_at` | When the posting appeared |
| `is_tech` | Whether the role is a technical one |
| `enrichment` | Seniority, category, employment type, salary, language and more |
| `collections` | Curated groupings the job belongs to |

## Input examples

**Go backends in Germany, freshest first**

```json
{
  "countries": ["de"],
  "skills": ["go"],
  "maxItems": 200
}
```

**Remote senior roles posted this week**

```json
{
  "workMode": ["remote"],
  "seniority": ["senior", "lead"],
  "postedWithinDays": 7
}
```

**Text search with a salary floor**

```json
{
  "query": "machine learning engineer",
  "salaryMin": 120000,
  "countries": ["us", "gb"]
}
```

All fields are optional. With no input at all, you get the freshest postings across the
whole catalogue.

## Limits

This actor returns **at most 1000 jobs per run**. That is deliberate: freehire is a free,
independent project, and a shared catalogue stays fast only if nobody drains it.

Need more? The same data is available through the free
[freehire API](https://freehire.me/api) with no such ceiling — this actor is a convenience
wrapper around its public search endpoint, not a privileged path to it.

## Input reference

| field | type | notes |
|---|---|---|
| `query` | string | Free-text search. Omit it to browse freshest-first. |
| `countries` | string[] | Lowercase ISO codes: `de`, `pl`, `us`. |
| `skills` | string[] | Canonical tags: `go`, `kubernetes`, `react`. |
| `seniority` | string[] | `junior`, `middle`, `senior`, `lead`, `principal`. |
| `category` | string[] | `backend`, `frontend`, `devops`, `data`, `mobile`, `qa`, … |
| `workMode` | string[] | `remote`, `hybrid`, `onsite`. |
| `postedWithinDays` | integer | Only jobs posted in the last N days. |
| `salaryMin` | integer | Annual salary floor; only jobs with a stated salary qualify. |
| `maxItems` | integer | Up to 1000. Defaults to 1000. |

Unknown fields fail the run immediately, before any request is made. This is on purpose: the
upstream API ignores parameters it does not recognise, so a typo like `seniorty` would
otherwise return a page of *unfiltered* catalogue that looks like a successful, filtered run.

A single string is accepted wherever a list is expected — `"countries": "de"` works.

## Development

```bash
pnpm install
pnpm test     # unit tests
pnpm build    # typecheck + compile
```

Run it locally against production with a small ceiling:

```bash
mkdir -p storage/key_value_stores/default
echo '{ "countries": ["de"], "skills": ["go"], "maxItems": 20 }' \
  > storage/key_value_stores/default/INPUT.json
node dist/main.js
```

## About freehire

[freehire.me](https://freehire.me) is an open-source IT job aggregator: many source parsers
feed one pipeline that normalises postings into a single schema, deduplicates reposts, and
enriches them with structured facets. Search, filters and the API are free.
