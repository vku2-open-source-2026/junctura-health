---
name: junctura-health-design
description: Design rules for any Junctura Health app UI (clinic, hospital, myhealth, pharmacy, insurance).
---
<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Junctura Health design

Use this whenever you build, change or review a screen in `junctura-clinic`, `junctura-hospital`, `junctura-myhealth`, `junctura-pharmacy` or `junctura-insurance`. The rules below are a summary; the sources of truth are `docs/DESIGN.md` (how it looks and what is safe to show) and `docs/APPS.md` (what each app does) in `junctura-health`. Read both before starting a new screen. If the repository is checked out next to the app, they are at `../junctura-health/docs/`.

## Before you design

1. Name the user and their situation (see the user table in `DESIGN.md`): who, on what device, how rushed. Design for that person.
2. Check `APPS.md` for the tab and the data this screen needs. Do not invent features, and do not put health logic in Junctura Layer 1 (`junctura-dxos`).
3. Use the shared components of `@junctura/health-ui`. Never add a one-off colour, font, spacing or button style. If a component is missing, add it to the shared library first.

## Non-negotiable safety rules

- **Patient banner** on every single-patient screen: name, birth year (age), sex, patient id; fixed on top, names never truncated, unknown shown as "Chưa rõ".
- **Allergies have four states** and are never merged: "Có dị ứng đã ghi nhận", "Không có dị ứng đã biết" (only when a clinician confirmed it), "Chưa ghi nhận dị ứng", "Không xem được dị ứng". Severe allergies stay prominent.
- **Alerts** use colour + icon + text, four levels (Nghiêm trọng, Cảnh báo, Lưu ý, Thông tin), the same wording everywhere, no flashing. Only blocking alerts use `role="alert"`.
- **Data from another facility** always shows its source and date. A request refused for missing consent is a state ("Chưa có đồng thuận"), never an empty list.
- **Emergency access** needs a reason, two-step confirmation and a persistent bar; only for capabilities that allow it.
- **Irreversible actions** name the consequence and use the action as the button label.
- **Insurance** never shows diagnoses; it only receives yes/no.

## Look and content

- Tokens come from Junctura Console: Stone Ink `#172F3D`, Junctura Blue `#176B80` (the only interactive colour), Teal `#18877A`, Sandstone `#C58B62` (never as text); Inter + JetBrains Mono; 17.5 px base with 16 / 17.5 / 19 px choices; light and dark.
- Vietnamese UI, consistent terms: người bệnh, đồng thuận, chuyển tuyến, tóm tắt trước khám, truy cập cấp cứu, nhật ký truy cập. Short sentences; errors say what happened, why, what next. Dates `dd/mm/yyyy`, 24 h.
- Every screen has four states: loading (skeleton), empty (says what to do next), error, not permitted.
- Accessibility target WCAG 2.2 AA: contrast 4.5:1, visible focus, full keyboard use, labelled fields, targets ≥ 24 px (44 px in MyHealth), `lang="vi"`, reduced motion respected, colour never the only signal.
- Apps share one look; they differ by name, icon and content, not by colour scheme.

## AI

AI features only summarise what is already in the record: no diagnosis, no treatment or drug suggestion, no decisions. They are off by default, always labelled "Tóm tắt do AI tạo, cần kiểm tra lại với hồ sơ gốc", link to the source data, and never send real patient data to an external service.

## Before you finish

Walk the screen once with the keyboard only; check each state (loading, empty, error, no consent); check the screen at phone width and with the largest text size; confirm nothing relies on colour alone; confirm all demo data is synthetic. Report what you could not check.
