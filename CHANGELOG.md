<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Changelog

All notable changes to Junctura Health are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Changed

- **`@junctura/health-ui` 0.3.0 aligns with the Junctura Console look**: the Junctura "J" tile logo (colours follow the theme), a floating side bar card, a top bar with breadcrumbs (`breadcrumbs`, `status` props on `AppShell`) and theme pill, wider content margins (max 80rem, 2rem), `PageHeader` with `badges`, a bold title and a divider, `StatStrip` as cards with optional icon and hint, `Section` with a description, `Card` titles in sentence case, and radius `rounded-lg` everywhere.
- **Breaking:** `LandingPage` takes `benefits`, `steps`, `audiences`, `trust`, `faq`, `cta`, `hero`, `badge` and `footer: { links, note }` instead of `values` and a text footer. Sections are shown when given.

### Added

- **Guide to building a new Layer 2 app** (`docs/new-app.md`): what to reuse from Junctura DX-OS and what an app writes itself, environment and credentials from `demo:setup`, the app skeleton to copy from Clinic, sign-in and role checks, providing and calling capabilities with `@junctura/server-client` and `@junctura/health-contracts`, the shared UI, workflow rules and a pre-PR checklist.
- **`@junctura/health-contracts` on npm**: a tag-triggered publish workflow (`contracts-vX.Y.Z`, with provenance, same pattern as the UI library), an install section in the contracts README, and a CI step that checks the package would contain the code, the schemas and the license files.
- `LandingPage` in the Console structure (sticky bar with section links, headline with a picture of the app, benefits, how it works, who it is for, trust, questions, call to action, footer), `PreviewFrame` for that picture, `SignInPage` (centred card on the pattern background, message, text size and theme, back link) and `PublicControls`.

- **UX analysis** (`docs/UX.md`): working context, users, day rhythm, 18 user stories for Clinic (P1/P2), layout principles (open on the work to do, the patient as context, queue always at hand, global quick find, drafts that never get lost), information architecture and screen layouts, and how the other four apps reuse the frame.
- **AppShell v2 and layout components** (`@junctura/health-ui` 0.2.0): `AppShell` with grouped navigation, station switcher, quick find (`/` or Ctrl+K), notifications, account menu (text size, theme, sign out), collapsible side bar and bottom navigation on phones; `CommandSearch`, `Popover`, `PageHeader`, `WorkspaceLayout` (main column plus side rail), `Section`, `FormSection`, `StatStrip`, `SegmentedControl`, `QueueList` (people in line as action rows with waiting time) and `ActionList`. The flat `nav` list of 0.1 still works. `DataTable` rows now expose a real button in the first cell for keyboard users.
- The preview gallery now includes real Clinic screens (today's work, patient list, patient record with exam form and in-flow allergy warning) in light, dark and phone widths.

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

### Fixed

- **Synthetic data**: two patients (P0004, P0043) had vaccinations dated before they were born. The generator now stops a vaccine series at the first dose outside the range from the patient's birth year to the reference date. Only those two records changed; identities, subjects and every other value are the same. A test now checks that no encounter, chronic condition or vaccination predates the birth year, no vaccination is in the future, and doses are numbered in order.
