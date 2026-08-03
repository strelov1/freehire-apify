# filter-validation Specification

## Purpose
TBD - created by archiving change add-jobs-actor. Update Purpose after archive.
## Requirements
### Requirement: Unknown filter keys are rejected before any request

The search endpoint silently ignores query parameters it does not recognise, so a misspelled
filter widens the query to the whole catalogue instead of erroring. The actor SHALL therefore
validate every input key against an allow-list and SHALL fail the run before issuing any
network request when an unknown key is present.

#### Scenario: A misspelled filter fails the run

- **WHEN** the run input contains `seniorty` instead of `seniority`
- **THEN** the actor fails before making any request to the API
- **AND** the error names `seniorty` as the unrecognised key
- **AND** the dataset stays empty

#### Scenario: Known filters pass validation

- **WHEN** the run input contains only `query`, `countries`, `skills`, `seniority`,
  `category`, `workMode`, `postedWithinDays`, `salaryMin` and `maxItems`
- **THEN** validation succeeds and the run proceeds

### Requirement: Filter values are checked for type and range

The actor SHALL reject values whose type or range cannot produce a meaningful query, naming
the offending field and what it accepts.

#### Scenario: A non-numeric numeric field is rejected

- **WHEN** `postedWithinDays` is `"last week"`
- **THEN** the run fails before any request
- **AND** the error states that `postedWithinDays` accepts a positive integer

#### Scenario: An out-of-range value is rejected

- **WHEN** `salaryMin` is negative
- **THEN** the run fails before any request
- **AND** the error states the accepted range

#### Scenario: Array fields accept a bare string

- **WHEN** `countries` is the string `"de"` rather than `["de"]`
- **THEN** validation succeeds by treating it as a single-element list
- **AND** the request carries `countries=de`

