## Why

The actor exists for distribution, but its back-links are currently untagged
(`https://freehire.me/jobs/{slug}`). Visits arriving through them are indistinguishable
from ordinary direct traffic, so the one question the actor was built to answer — does the
Apify listing bring anyone to freehire — has no answer.

## What Changes

- `freehire_url` in every dataset item carries UTM attribution:
  `?utm_source=apify&utm_medium=actor`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `job-search-actor`: the back-link requirement now specifies attribution parameters on
  `freehire_url`.

## Impact

Dataset consumers see a longer URL; it resolves to the same page. No change to filters,
limits or the fetch loop.
