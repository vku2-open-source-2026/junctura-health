// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Reference projections from the synthetic records to each contract's output.
// Provider apps implement the same mapping on their own storage; tests use these
// to prove the data fits the contracts. A null result means "no such record for
// this person": the provider then fails the call instead of returning data.

const patientOf = (clinic, subject) => clinic.patients.find(p => p.subject === subject) ?? null;

export function preVisitSummary(clinic, subject) {
  const p = patientOf(clinic, subject);
  return p && {
    patientName: p.patientName, birthYear: p.birthYear, sex: p.sex,
    allergies: p.allergies, chronicConditions: p.chronicConditions, currentMedications: p.currentMedications,
    recentEncounters: p.encounters.slice(-3).reverse(), updatedAt: p.updatedAt,
  };
}

export function allergyList(clinic, subject) {
  const p = patientOf(clinic, subject);
  return p && { allergies: p.allergies, updatedAt: p.updatedAt };
}

export function vaccinationHistory(clinic, subject) {
  const p = patientOf(clinic, subject);
  return p && { vaccinations: p.vaccinations, updatedAt: p.vaccinationsUpdatedAt };
}

export function referralSummary(clinic, subject, { referralId }) {
  const r = clinic.referrals.find(x => x.referralId === referralId && x.subject === subject);
  return r && { referralId: r.referralId, issuedAt: r.issuedAt, fromFacility: r.fromFacility, toFacility: r.toFacility,
    urgency: r.urgency, reason: r.reason, provisionalDiagnosis: r.provisionalDiagnosis, treatmentGiven: r.treatmentGiven };
}

export function prescriptionVerify(hospital, subject, { prescriptionCode }, now = new Date()) {
  const rx = hospital.prescriptions.find(x => x.prescriptionCode === prescriptionCode && x.subject === subject);
  return rx && { valid: Date.parse(rx.expiresAt) >= now.getTime(), issuedAt: rx.issuedAt, expiresAt: rx.expiresAt, items: rx.items, dispensed: rx.dispensed };
}

export function claimVerify(hospital, subject, { claimId, amountVnd }, now = new Date()) {
  const claim = hospital.claims.find(x => x.claimId === claimId && x.subject === subject);
  return { matches: Boolean(claim) && claim.amountVnd === amountVnd, checkedAt: now.toISOString() };
}
