<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Changelog

All notable changes to Junctura Health are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **Synthetic patient data** (`seed/`): a deterministic, dependency-free generator
  (`npm run seed:generate`, `npm run seed:check`) producing 50 Vietnamese patients
  with clinic records, referrals, hospital prescriptions and claims, insurer claim
  requests and demo accounts with fixed identity subjects (no passwords). Featured
  patients An and Bình follow the demo script and match the contract examples.
  `rebase()` moves all dates to the demo day; `seed/views.mjs` maps records to each
  contract's output. No external dataset or tool is used.
- **Shared capability contracts** (`contracts/`, package `@junctura/health-contracts`):
  six capabilities (`pre-visit-summary`, `allergy-list`, `vaccination-history`,
  `referral-summary`, `prescription-verify`, `claim-verify`) with input/output schemas,
  provider and consumers, allowed purposes and emergency access. `buildManifest()`
  produces the Junctura manifest for a provider's enrolled application ID;
  `validateValue()` and `checkContext()` let both sides enforce the same rules.
  Valid examples for each capability; CI checks the manifests against Junctura's own
  validator (v0.1.0).
- Repository foundation: Apache-2.0 `LICENSE` and `NOTICE`, REUSE 3.3 metadata,
  SPDX header check (`npm run check`), CI, issue and pull request templates,
  contribution guide.
