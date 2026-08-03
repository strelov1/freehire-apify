## 1. Project setup

- [x] 1.1 Initialise the Node/TypeScript project: `package.json`, `tsconfig.json`, `apify` and `vitest` dependencies, `build` and `test` scripts
- [x] 1.2 Add the Apify actor scaffolding: `.actor/actor.json`, `Dockerfile`, and an empty `src/main.ts` that starts and exits cleanly

## 2. Filter validation

- [x] 2.1 Define the allow-list of accepted input fields and their mapping to API query parameters
- [x] 2.2 Implement the validator: reject unknown keys, naming the offending key
- [x] 2.3 Implement type and range checks: `postedWithinDays` a positive integer, `salaryMin` non-negative, with errors naming the field and its accepted values
- [x] 2.4 Accept a bare string where a list is expected, coercing it to a single-element list

## 3. Query construction

- [x] 3.1 Build the query string for `/api/v1/jobs/search` from validated input, forwarding repeated values as repeated parameters
- [x] 3.2 Default an empty input to freshest-first ordering (`sort=posted_at&order=desc`)
- [x] 3.3 Clamp `maxItems` to the hard ceiling of 1000 and derive the page plan (100 per page, at most 10 pages)

## 4. Fetch loop

- [x] 4.1 Fetch pages sequentially with a 250 ms pause between them, stopping at the ceiling or when results run out
- [x] 4.2 Retry a failed page once with backoff; on a second failure, stop and keep what was collected
- [x] 4.3 Map each job to a dataset item, preserving upstream field names and adding `freehire_url`
- [x] 4.4 Push items to the Apify Dataset

## 5. Run reporting

- [x] 5.1 On reaching the ceiling, log collected-of-matching and point at the freehire API
- [x] 5.2 On an empty result, log that nothing matched and echo the parameters that were sent
- [x] 5.3 On an upstream failure, record the early stop in the run summary and still finish successfully

## 6. Verification and publication

- [x] 6.1 Smoke-run against production with `maxItems: 20` and confirm the dataset contents
- [x] 6.2 Write the README: what it does, three worked input examples, output field table, the stated ceiling, and the API link
- [ ] 6.3 Prepare the Store listing: title, description, categories (`Jobs`, `Business`), icon
