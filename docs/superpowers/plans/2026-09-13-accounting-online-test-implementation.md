# Accounting Online Test Implementation Plan

Goal: build the approved Google Apps Script + Google Sheets transaction-analysis test.

Spec: `docs/superpowers/specs/2026-09-13-accounting-transaction-analysis-online-test-design.md`

## Tasks

- [ ] Create Accounts and Questions datasets for five parallel forms (A-E), 20 questions each.
- [ ] Write grading tests first for order-independent matching, partial skill scores, two-account and three-account questions.
- [ ] Implement grading and input validation services.
- [ ] Implement Google Sheets access, exam start, random form assignment, timer metadata, submission, persistence, and dashboard aggregation.
- [ ] Build Thai mobile-first student UI and teacher dashboard using Sarabun.
- [ ] Configure the supplied Google Sheet with Accounts, Questions, Attempts, Responses, Settings, Students, and Dashboard tabs.
- [ ] Write README and deployment guide.
- [ ] Re-run tests and verify no answer keys are exposed to the client.
- [ ] Open a pull request from `feat/build-online-test` to `main`.

Constraints: only สินทรัพย์, หนี้สิน, ส่วนของเจ้าของ; no revenue/expense/debit-credit; server-side grading; default 20 questions, 30 minutes, pass 60%.