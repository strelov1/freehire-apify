# Apify Store listing — copy to paste

Everything here is ready to paste into the Store form. The one thing that cannot be
prepared from here is the icon: export the freehire logo as a square PNG (at least
256×256, transparent background) and upload it as the actor icon.

## Name

`freehire-jobs`

## Title

freehire Jobs Scraper

## Description (short, shown in listings)

Pull IT job postings from the freehire catalogue — 4.4M normalised vacancies from
Greenhouse, Ashby, Workable, Lever, Workday and hundreds of company boards. Filter by
country, skill, seniority, work mode, recency and salary.

## Categories

- Jobs
- Business

## SEO keywords

job scraper, tech jobs, IT vacancies, remote jobs, greenhouse jobs, ashby jobs, workable,
job board api, job postings dataset, hiring data, recruitment data

## README

The repository README is the listing body — Apify renders it directly. No separate copy.

## Pricing

Free. This actor exists for distribution, not revenue: the 1000-item ceiling is what sends
heavy users to the freehire API rather than a paywall.

## Pre-publication checklist

- [ ] Icon uploaded (square PNG, ≥256×256)
- [ ] `apify login` done on the publishing account
- [ ] `apify push` from the repository root
- [ ] A test run from the Store page with `{"countries":["de"],"skills":["go"],"maxItems":20}`
- [ ] Dataset preview shows the `overview` view with `freehire_url` present
- [ ] Listing set to Public
