// Audit content — verbatim port of `SECTIONS` from legacy/AIMS_QPS_v2.html
// (lines 419-605). This is accreditation content (JCI/WHO/IHI/ISMP/NPUAP/CDC/
// SCCM/RCEM/ATLS/CAHPS standards), not implementation detail — edit the
// actual questions/standards here, but don't paraphrase while porting.

export type RiskLevel = "C" | "H" | "M" | "L";

export type SectionItem = {
  std: string;
  q: string;
  risk: RiskLevel;
};

export type SectionGroup = "Core Sections" | "Department Modules";

export type Section = {
  id: string;
  label: string;
  grp: SectionGroup;
  std: string;
  items: SectionItem[];
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  C: "Critical",
  H: "High",
  M: "Moderate",
  L: "Low",
};

export const SECTIONS: Section[] = [
  {
    id: "s1",
    label: "1. Leadership & Safety Culture",
    grp: "Core Sections",
    std: "JCI QPS.1 / IHI",
    items: [
      { std: "JCI QPS.1", q: "Daily Safety Huddle conducted at shift start with all relevant staff?", risk: "H" },
      { std: "JCI QPS.2", q: "Critical incidents from previous 24 hours reviewed during handover or huddle?", risk: "C" },
      { std: "JCI QPS.3", q: "Near misses reported and documented in the incident reporting system?", risk: "H" },
      { std: "IHI", q: "Open, blame-free safety culture observed — staff speak up without fear?", risk: "M" },
      { std: "JCI ACC.3", q: "Inter-departmental communication effective with documented handoff information?", risk: "H" },
      { std: "JCI GLD.11", q: "Staff concerns about patient safety formally documented and acted upon?", risk: "H" },
      { std: "JCI Leadership", q: "Department Head or designee present or contactable during rounds?", risk: "M" },
    ],
  },
  {
    id: "s2",
    label: "2. Patient Identification",
    grp: "Core Sections",
    std: "JCI IPSG.1 / WHO Goal 1",
    items: [
      { std: "JCI IPSG.1", q: "Every inpatient wearing a correctly placed and legible ID wristband?", risk: "C" },
      { std: "JCI IPSG.1", q: "At least TWO patient identifiers used before any procedure, medication, or blood draw?", risk: "C" },
      { std: "JCI IPSG.1", q: "ID wristband legible, undamaged, and contains accurate information?", risk: "H" },
      { std: "JCI IPSG.1", q: "RED allergy band correctly in place for all patients with documented allergies?", risk: "C" },
      { std: "JCI QPS", q: "YELLOW fall-risk band in place for all patients with fall risk score ≥ threshold?", risk: "H" },
      { std: "JCI IPSG", q: "Special-precaution identifiers (DNR, isolation, latex allergy) visible and current?", risk: "H" },
      { std: "JCI IPSG.1", q: "Patient identification verified before blood transfusion using two-nurse double-check?", risk: "C" },
    ],
  },
  {
    id: "s3",
    label: "3. Communication",
    grp: "Core Sections",
    std: "JCI IPSG.2 / SBAR",
    items: [
      { std: "JCI IPSG.2", q: "SBAR framework used for clinical handovers and escalations?", risk: "H" },
      { std: "JCI IPSG.2", q: "Critical lab/radiology values communicated to responsible clinician within 30 minutes?", risk: "C" },
      { std: "JCI IPSG.2", q: "Read-back technique used and documented for verbal/telephone orders?", risk: "H" },
      { std: "JCI ACC.3", q: "Complete, structured handover performed at shift change including pending tasks and risk flags?", risk: "C" },
      { std: "JCI GLD", q: "Staff know escalation pathway — NEWS2/MEWS trigger, rapid response, code protocols?", risk: "H" },
      { std: "JCI IPSG.2", q: "Written orders legible, dated, timed, and signed by the ordering clinician?", risk: "H" },
    ],
  },
  {
    id: "s4",
    label: "4. Clinical Documentation",
    grp: "Core Sections",
    std: "JCI MCI.19",
    items: [
      { std: "JCI MCI.19", q: "Admission H&P documented within required timeframe (≤24h elective; immediate for emergency)?", risk: "H" },
      { std: "JCI MCI.19", q: "Daily progress notes updated, SOAP-structured, and signed by treating clinician?", risk: "H" },
      { std: "JCI IPSG.3", q: "Medication reconciliation documented at admission, transfer, and discharge?", risk: "C" },
      { std: "JCI PFR.6.4", q: "Valid, signed informed consent present for all procedures, surgery, anaesthesia, blood products?", risk: "C" },
      { std: "JCI PFR.6", q: "Code status/DNAR order clearly documented, discussed with patient/family, and regularly reviewed?", risk: "H" },
      { std: "JCI ACC.3.3", q: "Discharge planning initiated and documented from day one of admission?", risk: "M" },
      { std: "JCI MCI.19", q: "Nursing assessment and care plans documented and updated every shift?", risk: "H" },
      { std: "AHRQ / JCI", q: "Allergy status (including NKDA) and reaction type documented on medication chart?", risk: "C" },
    ],
  },
  {
    id: "s5",
    label: "5. Medication Safety",
    grp: "Core Sections",
    std: "JCI IPSG.3 / ISMP",
    items: [
      { std: "JCI IPSG.3", q: "Medication administration charts (MAR) complete, current, free of unauthorised abbreviations?", risk: "H" },
      { std: "JCI IPSG.3", q: "HIGH-ALERT medications labelled with HIGH-ALERT sticker and stored separately?", risk: "C" },
      { std: "ISMP / JCI", q: "LASA medications physically separated and labelled with TALL-MAN lettering?", risk: "C" },
      { std: "JCI MMU.4", q: "Medication expiry dates checked in last 24 hours — no expired medication present?", risk: "C" },
      { std: "JCI MMU.3", q: "Controlled drugs in double-locked cabinet with current, reconciled register?", risk: "C" },
      { std: "JCI IPSG.3", q: "IV infusions labelled: drug name, dose, diluent, rate, date/time prepared, expiry?", risk: "C" },
      { std: "JCI MMU.3", q: "Medication storage area clean, temperature-monitored, and cold-chain compliant?", risk: "H" },
      { std: "ISMP / JCI", q: "Second-nurse independent double-check performed for high-alert IV medications?", risk: "C" },
      { std: "JCI MMU.7", q: "Medication errors and adverse drug events reported through incident reporting system?", risk: "H" },
    ],
  },
  {
    id: "s6",
    label: "6. Infection Prevention & Control",
    grp: "Core Sections",
    std: "WHO 5 Moments / JCI PCI",
    items: [
      { std: "WHO 5 Moments", q: "Hand hygiene compliance at all 5 moments — covert observation of ≥5 staff interactions?", risk: "C" },
      { std: "WHO 5 Moments", q: "ABHR dispensers present, filled, and functional at every point of care?", risk: "C" },
      { std: "JCI PCI", q: "Appropriate PPE available at point of care and used correctly?", risk: "H" },
      { std: "JCI PCI.8", q: "Isolation rooms labelled with appropriate signs (Contact / Droplet / Airborne)?", risk: "C" },
      { std: "JCI PCI.8", q: "Isolation precautions fully adhered to — gowning, gloving, dedicated equipment?", risk: "C" },
      { std: "JCI PCI.7.2", q: "Clinical waste correctly segregated into colour-coded bags per AIMS waste policy?", risk: "H" },
      { std: "JCI PCI", q: "Sharps disposed directly into approved containers — no recapping, no overfilling?", risk: "C" },
      { std: "JCI PCI.5", q: "Environmental cleaning documented: frequency, disinfectant used, cleaner signature?", risk: "H" },
      { std: "JCI PCI.7", q: "Patient equipment (stethoscopes, BP cuffs) cleaned/disinfected between patients?", risk: "H" },
      { std: "JCI PCI.6", q: "Central line, urinary catheter, and ventilator care bundles documented and adhered to?", risk: "C" },
    ],
  },
  {
    id: "s7",
    label: "7. Falls Prevention",
    grp: "Core Sections",
    std: "JCI IPSG.6 / NPSG",
    items: [
      { std: "JCI IPSG.6", q: "Validated fall risk assessment (Morse/STRATIFY) completed within 8 hours of admission?", risk: "H" },
      { std: "JCI IPSG.6", q: "High-risk patients identified with yellow wristband, FALLING STAR sign, whiteboard note?", risk: "H" },
      { std: "JCI IPSG.6", q: "Bed rails in appropriate position — raised ×2 for high-risk patients?", risk: "H" },
      { std: "JCI IPSG.6", q: "Call bell within reach and patient can demonstrate ability to use it?", risk: "H" },
      { std: "JCI IPSG.6", q: "High-risk patients wearing non-slip footwear or non-slip socks?", risk: "M" },
      { std: "JCI IPSG.6", q: "FALL RISK — PLEASE CALL FOR ASSISTANCE signage visible at bed and bathroom?", risk: "M" },
      { std: "JCI IPSG.6", q: "Environment free of fall hazards — clear pathways, no wet floors, adequate lighting?", risk: "H" },
      { std: "JCI QPS", q: "All patient falls in last 24 hours reported, investigated, and acted upon?", risk: "C" },
    ],
  },
  {
    id: "s8",
    label: "8. Pressure Injury Prevention",
    grp: "Core Sections",
    std: "NPUAP/EPUAP",
    items: [
      { std: "NPUAP/EPUAP", q: "Braden/Waterlow risk assessment completed within 8h of admission and every 24h?", risk: "H" },
      { std: "NPUAP", q: "Skin inspection documented each shift with accurate staging of any existing pressure injuries?", risk: "H" },
      { std: "NPUAP / IHI", q: "Turning/repositioning schedule (minimum every 2 hours) documented and adhered to?", risk: "H" },
      { std: "NPUAP / JCI", q: "Pressure-redistributing mattresses in use for all high-risk patients (Braden ≤18)?", risk: "H" },
      { std: "NPUAP", q: "Heels off-loaded for all patients at risk of heel pressure injuries?", risk: "M" },
      { std: "JCI QPS", q: "Hospital-acquired pressure injuries stage 2+ reported as adverse events?", risk: "C" },
    ],
  },
  {
    id: "s9",
    label: "9. Device Safety",
    grp: "Core Sections",
    std: "JCI / CDC Bundles",
    items: [
      { std: "CDC CLABSI", q: "Peripheral IV cannula necessity reviewed daily — no cannula ≥72-96h without justification?", risk: "H" },
      { std: "CDC CLABSI Bundle", q: "CVC necessity reviewed daily; bundle components (CHG dressing, hub disinfection) adhered to?", risk: "C" },
      { std: "CDC CAUTI Bundle", q: "Urinary catheter necessity reviewed daily; CAUTI prevention bundle followed?", risk: "C" },
      { std: "JCI Device Safety", q: "NG tube: position confirmed by X-ray/pH, secured, insertion date labelled?", risk: "H" },
      { std: "IHI VAP Bundle", q: "Ventilated patients: HOB 30-45°, oral care every 4h, cuff pressure 20-30 cmH₂O?", risk: "C" },
      { std: "JCI Device Safety", q: "All invasive devices labelled with insertion date, site, and responsible clinician?", risk: "H" },
    ],
  },
  {
    id: "s10",
    label: "10. Equipment Safety",
    grp: "Core Sections",
    std: "JCI FMS.8",
    items: [
      { std: "JCI FMS.8", q: "Crash cart sealed/locked with intact tamper-evident tag and checked within last 24 hours?", risk: "C" },
      { std: "JCI FMS.8", q: "Defibrillator functional — self-test passed or manual test completed today?", risk: "C" },
      { std: "JCI FMS.8", q: "Suction available, functional (≥300 mmHg vacuum), with yankauer and tubing?", risk: "C" },
      { std: "JCI FMS.8", q: "Piped/cylinder oxygen available, flow meter functional, masks stocked?", risk: "C" },
      { std: "JCI FMS.8", q: "Emergency drugs (adrenaline, atropine, amiodarone, dextrose, hydrocortisone) stocked and in-date?", risk: "C" },
      { std: "JCI FMS.8", q: "Difficult Airway Trolley complete — video laryngoscope, LMA assortment, surgical airway kit?", risk: "C" },
      { std: "JCI FMS.8", q: "POCUS machine available, powered on, with appropriate probes and gel?", risk: "H" },
      { std: "JCI FMS.8", q: "All medical equipment has current biomedical engineering maintenance sticker?", risk: "H" },
      { std: "JCI FMS.8", q: "Patient monitors and ventilators free of alarms and within appropriate alarm limits?", risk: "C" },
    ],
  },
  {
    id: "s11",
    label: "11. Environmental Safety",
    grp: "Core Sections",
    std: "JCI FMS.7",
    items: [
      { std: "JCI FMS.7", q: "Fire exit doors unobstructed, clearly signposted, and functional?", risk: "C" },
      { std: "JCI FMS.7", q: "Fire extinguishers in designated locations, within inspection date — staff know RACE/PASS?", risk: "C" },
      { std: "JCI FMS.11", q: "Electrical safety maintained — no frayed cords, overloaded extensions, trailing cables?", risk: "H" },
      { std: "JCI FMS", q: "All floors dry, non-slippery — wet-floor signs deployed where cleaning in progress?", risk: "H" },
      { std: "JCI FMS.7", q: "Emergency lighting functional in all clinical areas and corridors?", risk: "H" },
      { std: "JCI FMS", q: "Medical gas cylinders: upright, secured, segregated full/empty, no open flames posted?", risk: "C" },
      { std: "JCI FMS.5", q: "Hazardous material storage compliant with SDS/MSDS requirements?", risk: "H" },
      { std: "JCI FMS.6", q: "Clinical corridors free of obstruction and clutter?", risk: "M" },
    ],
  },
  {
    id: "s12",
    label: "12. Patient Rights",
    grp: "Core Sections",
    std: "JCI PFR",
    items: [
      { std: "JCI PFR.1", q: "Patient privacy maintained during clinical care — curtains drawn, no unnecessary exposure?", risk: "H" },
      { std: "JCI PFR.1", q: "Patient confidentiality maintained — charts not left open, screen locks active?", risk: "H" },
      { std: "JCI PFR.2", q: "Patient informed about diagnosis, treatment plan, and involved in decision-making?", risk: "H" },
      { std: "JCI PFR.2.1", q: "Interpreter/translation service accessible for non-Urdu/English speaking patients?", risk: "H" },
      { std: "JCI PFR.3", q: "Patient complaints and feedback mechanism visibly displayed in the ward?", risk: "M" },
      { std: "JCI PFR.5", q: "Restraints (if in use) documented with clinical justification, consent, and regular review?", risk: "C" },
    ],
  },
  {
    id: "s13",
    label: "13. Patient Experience",
    grp: "Core Sections",
    std: "CAHPS / JCI PFR",
    items: [
      { std: "CAHPS / JCI", q: "Pain assessed using validated tool (NRS/VAS/FLACC) and documented in last 4 hours?", risk: "H" },
      { std: "JCI PFR.2", q: "Patient can describe their treatment plan in their own words?", risk: "H" },
      { std: "JCI PFR.2.1", q: "Family updated on patient condition per the communication schedule/plan?", risk: "M" },
      { std: "JCI PFR.3", q: "Patient concerns or complaints raised in last 24 hours acknowledged and addressed?", risk: "H" },
      { std: "JCI PFR", q: "Professional, respectful, and compassionate staff behaviour observed at the bedside?", risk: "H" },
      { std: "JCI FMS", q: "Immediate patient environment clean, organised, and free of malodour?", risk: "M" },
    ],
  },
  {
    id: "s14",
    label: "14. Staff Safety",
    grp: "Core Sections",
    std: "JCI SQE / OSHA",
    items: [
      { std: "JCI SQE", q: "Full PPE available and accessible to all clinical staff at the point of care?", risk: "H" },
      { std: "JCI SQE", q: "Sharps safety devices (safety-engineered needles) in use throughout the unit?", risk: "C" },
      { std: "JCI SQE", q: "Violence prevention protocol and panic alarm system documented and functional?", risk: "H" },
      { std: "JCI SQE", q: "Safe patient handling aids available and staff trained in manual handling?", risk: "M" },
      { std: "JCI SQE.8.1", q: "Staff vaccination records (Hep B, flu, COVID-19, TB screening) current and on file?", risk: "H" },
      { std: "JCI SQE", q: "Needlestick/sharps injury protocol displayed — staff know immediate steps and PEP?", risk: "H" },
    ],
  },
  {
    id: "s15",
    label: "15. Emergency Preparedness",
    grp: "Core Sections",
    std: "JCI FMS",
    items: [
      { std: "JCI FMS", q: "Unit ready for Code Blue — designated response roles assigned and all staff BLS-trained?", risk: "C" },
      { std: "JCI FMS.7", q: "All staff know RACE and PASS protocols for Code Red (fire emergency)?", risk: "C" },
      { std: "JCI FMS", q: "Code Pink response plan in place — door-securing procedures and staff roles assigned?", risk: "H" },
      { std: "JCI FMS.4", q: "Mass Casualty/Disaster (Code Black) plan available and staff familiar with key roles?", risk: "H" },
      { std: "JCI FMS", q: "Emergency contact numbers (Code Blue team, Medical Director, Blood Bank) visibly displayed?", risk: "H" },
      { std: "JCI FMS", q: "Battery backups/UPS functional for critical equipment in case of power failure?", risk: "H" },
    ],
  },
  {
    id: "s16",
    label: "16. Incident Reporting",
    grp: "Core Sections",
    std: "JCI QPS.7",
    items: [
      { std: "JCI QPS.7", q: "All near misses in last 24 hours reported in the hospital incident reporting system?", risk: "H" },
      { std: "JCI QPS.7", q: "All patient falls (including no-injury falls) formally reported and investigated?", risk: "H" },
      { std: "JCI QPS.7", q: "All medication errors reported and root-cause explored?", risk: "C" },
      { std: "JCI QPS.7", q: "All new hospital-acquired pressure injuries stage 2+ reported as adverse events?", risk: "H" },
      { std: "JCI PCI", q: "All suspected hospital-acquired infections reported to IPC and documented?", risk: "C" },
      { std: "JCI QPS.8", q: "Sentinel event reporting process understood by the charge nurse?", risk: "C" },
    ],
  },
  {
    id: "s17",
    label: "17. Quality Indicators",
    grp: "Core Sections",
    std: "JCI QPS.4",
    items: [
      { std: "JCI QPS.4", q: "Department KPIs displayed on unit board and updated at least monthly?", risk: "H" },
      { std: "JCI QPS.4", q: "Monthly compliance data collected, trended, and available for last 3 months?", risk: "H" },
      { std: "JCI QPS.10", q: "All open CAPAs from previous audits tracked, assigned, and progressing toward closure?", risk: "H" },
      { std: "JCI QPS", q: "Findings from previous rounding cycle closed or escalated if overdue?", risk: "H" },
      { std: "JCI QPS", q: "Repeat findings (same deficiency in ≥2 rounds) escalated to Quality Committee?", risk: "H" },
    ],
  },
  {
    id: "sed",
    label: "ED Module",
    grp: "Department Modules",
    std: "RCEM / AHA / ATLS",
    items: [
      { std: "RCEM / MTS", q: "Triage performed within 15 minutes of arrival using validated system (MTS or ESI)?", risk: "C" },
      { std: "RCEM / JCI", q: "Triage acuity documented on patient chart with time-stamp?", risk: "H" },
      { std: "RCEM / ACEP", q: "Door-to-Doctor time measured and within target (≤30 min P2, ≤60 min P3)?", risk: "H" },
      { std: "Surviving Sepsis", q: "1-hour Sepsis Bundle initiated for all patients meeting Sepsis-3 criteria?", risk: "C" },
      { std: "AHA / Stroke", q: "Stroke Pathway activated with CT head within 25 minutes of arrival?", risk: "C" },
      { std: "AHA / STEMI", q: "STEMI Pathway activated — ECG interpreted and documented within 10 minutes of arrival?", risk: "C" },
      { std: "ATLS / Trauma", q: "Trauma Activation protocol functional with defined team roles and resus bay readiness?", risk: "C" },
      { std: "JCI / RCEM", q: "Waiting patients reassessed every 30 min (P2) / 60 min (P3) with vital signs?", risk: "C" },
      { std: "RCEM Resus", q: "Resus Bay ready: crash cart sealed, defib tested, suction, oxygen, airway equipment?", risk: "C" },
      { std: "DAS / RSI", q: "RSI drugs immediately available and in-date: ketamine, succinylcholine, rocuronium, propofol?", risk: "C" },
      { std: "ACEP / POCUS", q: "POCUS machine available with credentialled operator for FAST/cardiac/IVC?", risk: "H" },
      { std: "JCI / Blood Bank", q: "Blood products obtainable within 30 minutes; O-negative available for exsanguinating haemorrhage?", risk: "C" },
      { std: "ATLS / MTP", q: "Massive Transfusion Protocol document available and understood by charge nurse?", risk: "C" },
      { std: "RCEM / MMU", q: "All emergency drugs stocked, labelled, and within expiry in the ED?", risk: "C" },
      { std: "JCI MMU.3", q: "ED controlled drugs in double-locked cabinet with current reconciled register?", risk: "C" },
      { std: "JCI FMS.8", q: "Defibrillator tested today with documented functional check?", risk: "C" },
      { std: "JCI / Code Blue", q: "ED Code Blue response practised, roles assigned, contacts posted?", risk: "C" },
      { std: "JCI ACC / Flow", q: "Patient flow monitored — blocked beds escalated every 2 hours when ≥80% capacity?", risk: "H" },
    ],
  },
  {
    id: "sicu",
    label: "ICU Module",
    grp: "Department Modules",
    std: "IHI / SCCM / CDC",
    items: [
      { std: "IHI / SCCM ABCDEF", q: "ABCDEF bundle documented for all mechanically ventilated patients?", risk: "C" },
      { std: "IHI VAP Bundle", q: "VAP bundle: HOB 30-45°, oral care every 4h, cuff pressure 20-30 cmH₂O, daily SBT?", risk: "C" },
      { std: "CDC CLABSI", q: "CVC maintenance bundles documented: CHG dressing, hub disinfection, daily necessity review?", risk: "C" },
      { std: "SCCM / PADIS", q: "Sedation depth monitored with RASS/SAS every 4 hours targeting RASS -1 to 0?", risk: "H" },
      { std: "PADIS / CAM-ICU", q: "Delirium assessed using CAM-ICU or ICDSC at least every 12 hours?", risk: "H" },
      { std: "SCCM", q: "Daily fluid balance calculated and charted — fluid overload monitored and managed?", risk: "H" },
      { std: "JCI / SCCM", q: "Ventilator liberation (weaning) plan documented for all haemodynamically stable patients?", risk: "H" },
      { std: "JCI QPS / ICU", q: "ICU severity scores (APACHE II or SOFA) calculated on admission and updated?", risk: "M" },
      { std: "JCI FMS.8", q: "ICU crash cart sealed, checked within 24 hours, defibrillator tested?", risk: "C" },
      { std: "JCI PCI / ICU", q: "Contact precaution signage and PPE for MDR organisms (MRSA, ESBL, CRE) in place?", risk: "C" },
    ],
  },
];

export const TOTAL_ITEMS = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);

export const DEPARTMENTS = [
  "Emergency Department",
  "Intensive Care Unit",
  "Medical Ward",
  "Surgical Ward",
  "Paediatrics",
  "NICU",
  "Labour Room",
  "Operating Theatre",
  "Recovery Room (PACU)",
  "Radiology",
  "Pharmacy",
  "Laboratory",
  "Blood Bank",
  "CSSD",
  "Outpatient Department",
  "Dialysis Unit",
];
