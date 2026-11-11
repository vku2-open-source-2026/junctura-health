<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Changelog

All notable changes to Junctura Health are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **Shared UI library** (`ui/`, `@junctura/health-ui` 0.1.0): React components for all five apps, built on the design guide: app shell, landing page, patient banner, four-state allergy status, four alert levels, source/freshness/consent badges, emergency access (reason + two-step confirm), confirm dialog, tabs, sortable table, form fields, timeline, toasts, empty/error/permission/loading states and the summary-only AI panel (off by default, mandatory "cần kiểm tra lại" label). Tailwind 4 tokens from Junctura Console with text tones darkened to meet WCAG 2.2 AA (contrast test for every pair, light and dark), text size 16 / 17.5 / 19 px, light and dark theme, axe accessibility tests, a preview gallery (`npm run ui:preview`) and tag-triggered npm publishing with provenance (`ui-vX.Y.Z`). Fonts (Inter, JetBrains Mono) are dependencies, not bundled files.
- **Design guide and app specs** (`docs/DESIGN.md`, `docs/APPS.md`): user analysis for the five apps, safe-display rules (patient banner, four allergy states, alert levels, source and freshness of shared data, emergency access), visual identity aligned with Junctura Console, accessibility and Vietnamese content rules, the shared component list, and the features, tabs and data of each app including the boundary of the AI summary feature. A `junctura-health-design` skill (`skills/`) keeps new screens consistent.
- **Demo environment** (`npm run demo:setup`, `demo/`): prepares a running Junctura
  DX-OS stack for the health scenario through the real Gateway: 55 demo accounts that
  keep their seeded subjects, five applications with backend and browser (PKCE)
  clients, the six contract capabilities published, and seven grants. Idempotent;
  credentials are written only to the Git-ignored `.junctura/demo/`. `withSubjects()`
  remaps seeded subjects when an identity provider issues different ones.
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
