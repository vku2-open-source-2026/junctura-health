<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Changelog

All notable changes to Junctura Health are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **Health industry pack for Junctura Workspace** (`pack/`): the real `health` pack (format v1) with the two handoff workflows — `chuyentuyen` (Trạm Y tế sends, Bệnh viện admits, treats and feeds results back, urgency options aligned with the portal's `muc-uu-tien`) and `thanhtoan` (Bệnh viện proposes spending, Sở Y tế approves, rejects or asks for more) — plus three synthetic sample units (Sở Y tế Tỉnh X, Bệnh viện X, Trạm Y tế xã Y) and connected BPMN 2.0 definitions. The BPMN is deployable by the DX-OS engine, not just readable: compact process keys shared by `pack.json` and `process/@id` (the reader requires them equal, the Tier-1 policy only accepts `^[a-z][a-z0-9_]{2,63}$`), every userTask carries `flowable:candidateGroups` bound to its step's manifest role (`y-ta`, `bac-si`, `tai-chinh`, `lanh-dao`) and every multi-decision step branches at an `exclusiveGateway` routed by decision id (`${decision == '…'}`): `reject` ends the record without approving, `request-info` loops back to the preceding step, `approve`/`forward` move to the documented next step. Public `recordType` ids keep their hyphens (`chuyen-tuyen`, `thanh-toan`). `pack/README.md` maps the pack keys onto the existing Tier-2 BPMN keys and capability contracts where they describe the same business flow (`chuyentuyen` ↔ `junctura_chuyen_tuyen` / `referral-summary`; `thanhtoan` is new, sharing only the cost domain with `claim-verify`); the existing `workflows/` definitions, portal behaviour and demo contracts are untouched.
- **CI verification of the pack against the supported Workspace revision and the engine policy**: CI checks out `junctura-workspace` at the pinned commit `73171dae8d50031a6d52c8dde7cfcd82bebb68ef`, installs the reader dependencies at that revision's pins (`ajv`, `saxes`) and `npm test` then validates `pack/` through that revision's own `readPack()` and draft 2020-12 schemas (manifest completeness, synthetic unit tree, userTask/step agreement) plus routing and reachability of every declared decision in the BPMN, and runs both definitions through the pinned DX-OS `validateDefinition(includeTasks: true)` from the `junctura-dxos` checkout. Nothing is copied from the checkers; without a checkout the tests skip, with an explicit `JUNCTURA_*_DIR` they fail loudly.
- **Health UI compatibility check for the `@junctura/ui` RC**: `ui-compat/` is the target shape of `@junctura/health-ui` after the shared-UI split — it re-exports the shared surface from `@junctura/ui` plus the Health-specific components (`PatientBanner`, allergy/consent badges, emergency access, `QueueList`/`ActionList`, `AiSummaryPanel`) and composes `HealthFrame` (RC `AppShell` around the health `PatientBanner`). `scripts/check-ui-compat.mjs` (`npm run check:ui-compat`) builds the RC from the pinned revision `73171dae8d50031a6d52c8dde7cfcd82bebb68ef`, installs its `npm pack` tarball (the exact publish artifact, `0.1.0-rc`) into `ui-compat/` next to the built `@junctura/health-ui`, and runs typecheck, render tests (shared and Health-specific exports by name) and the library build there. Ordinary builds never see the RC; `ui-compat/` is installed only by the check, with no lockfile and nothing published.

- **Draft record schemas** (`schemas/`): one `CollectionSchemaWrite` body per collection for the medical registry app and the five health apps (27 collections: registry catalogs, the nine `clinic_*` collections, the five `hospital_*_v1` collections, pharmacy `dispensations`/`settings`/`stock-receipts`, insurance `insurance_claims`/`checks`/`decisions`/`settlements`, and `myhealth_profiles`), to register through `PUT /v2/data-schemas/{collection}`. Only allowed JSON Schema keywords are used; `schemas/README.md` documents the unique keys, indexed and sensitive fields per collection and the open questions. Nullable values (`birthYear`) and the emergency record's `executionId`/`endedAt` are declared without a `type` and stay validated by the app; pharmacy shapes stay minimal (no `required`, no unique key) until the pharmacy repository provides its writer, and the README records that emergency-request updates must send `If-Match`. `tests/schemas.test.mjs` keeps the files consistent with the seeded and example data, including `birthYear: null` fixtures, both emergency-record states, dotted ICD-10 codes (which keep the catalog without a unique key) and the required `sensitive` labels.
- **Second demo tenant without touching the first** (`demo:setup`, `demo:seed`): `--isolated --tenant demo` puts the second tenant's credentials under `.junctura/demo/<tenant>/` (mode 0700), prefixes human usernames (`demo.bacsi.benhvien`), lets Keycloak issue fresh user ids (recorded as the seeded-subject mapping in that tenant's `subjects.json`, applied by the seed through `withSubjects()`), and gives backend clients and provider hosts a tenant suffix (`health-clinic-demo`, `clinic-demo.provider.internal`). The public PKCE web clients stay shared between tenants. Without the flag, names, paths and behaviour are unchanged; a new guard stops `demo:setup` up front (before any Keycloak or database write) when the target directory already holds `<app>.env` files of another tenant, reading only `JUNCTURA_TENANT`.

### Changed

- The seed vocabulary moves from `seed/catalog.mjs` into topic files under `seed/catalog/`, and the scenario patients An and Binh move to `seed/scenario.mjs`. Generated data is unchanged byte for byte; `seed/catalog.mjs` stays as a re-export because Hospital imports it at runtime.
- **Cổng Junctura Health is the GUI of Layer 2, the cross-facility health space coordinated by the health department**, not a patient portal. Public pages explain the three layers, the shared contracts, workflows and facilities; the signed-in workspace follows the H-P-D-I spaces of the OLP brief: H (today's work, notices from the health department, cross-facility directory), P (cross-facility cases with a coordination form, steps, notes and scanned attachments on the Layer 1 workflow API) and D (live operations for the health department: waiting cases by facility, processing times, data exchange from the Layer 1 audit chain, a data map of each facility without contents, and data and capability sharing by contract); I comes later. A small backend (`portal/server/`, enrolled as the Junctura application `junctura-health-portal`) keeps notices, notes and attachments in Layer 1 records and objects. Patient consents and the access log move to the MyHealth app of Layer 3.
- `demo:setup` gives each staff account `audit.read` on the `health-portal-web` client, and the portal proxies only `/v1` and `/identity` (never the Keycloak admin console).

## 0.1.0 - 2026-11-12

### Changed

- **Capability contracts 1.1.0** (`@junctura/health-contracts`): `allergy-list` and `pre-visit-summary` now return `allergyState` (`recorded`, `none-known`, `not-recorded`) next to `allergies`, so a provider can say "not recorded" instead of an empty list that a caller might read as "no allergy". The examples, the seed projections and the tests follow. Providers and callers move to 1.1.0 together (no app consumes 1.0.0 yet).
- **`@junctura/health-ui` 0.3.0 aligns with the Junctura Console look**: the Junctura "J" tile logo (colours follow the theme), a floating side bar card, a top bar with breadcrumbs (`breadcrumbs`, `status` props on `AppShell`) and theme pill, wider content margins (max 80rem, 2rem), `PageHeader` with `badges`, a bold title and a divider, `StatStrip` as cards with optional icon and hint, `Section` with a description, `Card` titles in sentence case, and radius `rounded-lg` everywhere.
- **Breaking:** `LandingPage` takes `benefits`, `steps`, `audiences`, `trust`, `faq`, `cta`, `hero`, `badge` and `footer: { links, note }` instead of `values` and a text footer. Sections are shown when given.

### Added

- **Guide to building a new Layer 3 app** (`docs/new-app.md`): what to reuse from Junctura DX-OS and what an app writes itself, environment and credentials from `demo:setup`, the app skeleton to copy from Clinic, sign-in and role checks, providing and calling capabilities with `@junctura/server-client` and `@junctura/health-contracts`, the shared UI, workflow rules and a pre-PR checklist.
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
