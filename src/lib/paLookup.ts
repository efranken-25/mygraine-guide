/**
 * PA Approval Lookup Table
 * Generated from migraine-pa-data.xlsx (2023–2026 data, 63,480 records)
 *
 * Key format: "DrugName|plantype"  (plantype = "commercial" | "medicaid")
 * Approval rates and denial reasons are aggregated averages from real PA submissions.
 */

export interface PALookupEntry {
  avgApprovalRate: number;          // Historical average approval % (0–100)
  avgPredictedScore: number;        // Model-predicted score (0–1)
  totalRequests: number;            // Total PA requests in dataset
  denialReasons: {
    missingDocs: number;            // % of denials due to missing documentation
    insufficientTrial: number;      // % due to insufficient trial duration
    stepTherapyNotMet: number;      // % due to step therapy not completed
    other: number;                  // % other reasons
  };
  typicalRequirements: {
    minMigraineDays: number;        // Minimum migraine days/month required
    failedPreventivesCount: number; // Number of failed preventives required
    failedPreventivesLabel: string; // Human-readable label
    trialDurationWeeks: number;     // Required trial duration in weeks
    stepTherapyRequired: boolean;
  };
}

export const PA_LOOKUP: Record<string, PALookupEntry> = {
  "Almotriptan|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.726,"totalRequests":635306,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.3,"stepTherapyNotMet":17.2,"other":23.5},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Almotriptan|medicaid": {"avgApprovalRate":76.2,"avgPredictedScore":0.727,"totalRequests":142168,"denialReasons":{"missingDocs":32.4,"insufficientTrial":27.1,"stepTherapyNotMet":17.2,"other":23.2},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Amitriptyline|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.727,"totalRequests":633075,"denialReasons":{"missingDocs":32.4,"insufficientTrial":27.1,"stepTherapyNotMet":17.1,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Amitriptyline|medicaid": {"avgApprovalRate":76.4,"avgPredictedScore":0.728,"totalRequests":140755,"denialReasons":{"missingDocs":32.4,"insufficientTrial":26.9,"stepTherapyNotMet":16.9,"other":23.8},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Divalproex|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.727,"totalRequests":633994,"denialReasons":{"missingDocs":32.4,"insufficientTrial":27.2,"stepTherapyNotMet":17.1,"other":23.3},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Divalproex|medicaid": {"avgApprovalRate":76.7,"avgPredictedScore":0.728,"totalRequests":144192,"denialReasons":{"missingDocs":32.4,"insufficientTrial":26.8,"stepTherapyNotMet":16.7,"other":24.2},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Eletriptan|commercial": {"avgApprovalRate":76.8,"avgPredictedScore":0.729,"totalRequests":628030,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.3,"stepTherapyNotMet":17.0,"other":23.7},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Eletriptan|medicaid": {"avgApprovalRate":77.0,"avgPredictedScore":0.729,"totalRequests":145150,"denialReasons":{"missingDocs":31.8,"insufficientTrial":27.4,"stepTherapyNotMet":17.2,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Eptinezumab|commercial": {"avgApprovalRate":76.2,"avgPredictedScore":0.726,"totalRequests":626243,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.2,"stepTherapyNotMet":17.0,"other":23.7},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Eptinezumab|medicaid": {"avgApprovalRate":75.9,"avgPredictedScore":0.721,"totalRequests":146810,"denialReasons":{"missingDocs":31.5,"insufficientTrial":27.4,"stepTherapyNotMet":17.0,"other":24.0},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Erenumab|commercial": {"avgApprovalRate":76.9,"avgPredictedScore":0.728,"totalRequests":632705,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.2,"stepTherapyNotMet":17.4,"other":23.2},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Erenumab|medicaid": {"avgApprovalRate":77.0,"avgPredictedScore":0.729,"totalRequests":137513,"denialReasons":{"missingDocs":31.5,"insufficientTrial":27.6,"stepTherapyNotMet":17.1,"other":23.8},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Fremanezumab|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.729,"totalRequests":626686,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.1,"stepTherapyNotMet":17.0,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Fremanezumab|medicaid": {"avgApprovalRate":76.2,"avgPredictedScore":0.722,"totalRequests":142573,"denialReasons":{"missingDocs":32.4,"insufficientTrial":27.6,"stepTherapyNotMet":17.4,"other":22.7},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Frovatriptan|commercial": {"avgApprovalRate":76.4,"avgPredictedScore":0.726,"totalRequests":616786,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.2,"stepTherapyNotMet":16.9,"other":23.6},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Frovatriptan|medicaid": {"avgApprovalRate":76.3,"avgPredictedScore":0.726,"totalRequests":144442,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.0,"stepTherapyNotMet":16.6,"other":24.1},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Galcanezumab|commercial": {"avgApprovalRate":76.4,"avgPredictedScore":0.728,"totalRequests":619305,"denialReasons":{"missingDocs":32.2,"insufficientTrial":27.1,"stepTherapyNotMet":17.5,"other":23.2},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Galcanezumab|medicaid": {"avgApprovalRate":76.9,"avgPredictedScore":0.728,"totalRequests":146241,"denialReasons":{"missingDocs":32.5,"insufficientTrial":27.2,"stepTherapyNotMet":17.6,"other":22.8},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Metoprolol|commercial": {"avgApprovalRate":76.2,"avgPredictedScore":0.726,"totalRequests":634680,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.2,"stepTherapyNotMet":17.1,"other":23.7},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Metoprolol|medicaid": {"avgApprovalRate":77.0,"avgPredictedScore":0.728,"totalRequests":141060,"denialReasons":{"missingDocs":31.8,"insufficientTrial":27.4,"stepTherapyNotMet":16.6,"other":24.3},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Naratriptan|commercial": {"avgApprovalRate":76.0,"avgPredictedScore":0.725,"totalRequests":634602,"denialReasons":{"missingDocs":31.9,"insufficientTrial":27.3,"stepTherapyNotMet":17.4,"other":23.3},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Naratriptan|medicaid": {"avgApprovalRate":77.2,"avgPredictedScore":0.728,"totalRequests":145149,"denialReasons":{"missingDocs":33.2,"insufficientTrial":27.0,"stepTherapyNotMet":16.3,"other":23.5},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Nortriptyline|commercial": {"avgApprovalRate":76.4,"avgPredictedScore":0.726,"totalRequests":615172,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.3,"stepTherapyNotMet":17.2,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Nortriptyline|medicaid": {"avgApprovalRate":76.1,"avgPredictedScore":0.725,"totalRequests":139545,"denialReasons":{"missingDocs":32.2,"insufficientTrial":26.8,"stepTherapyNotMet":17.5,"other":23.6},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "OnabotulinumtoxinA|commercial": {"avgApprovalRate":76.4,"avgPredictedScore":0.727,"totalRequests":625060,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.0,"stepTherapyNotMet":17.1,"other":23.6},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "OnabotulinumtoxinA|medicaid": {"avgApprovalRate":77.0,"avgPredictedScore":0.728,"totalRequests":145341,"denialReasons":{"missingDocs":31.9,"insufficientTrial":27.3,"stepTherapyNotMet":16.7,"other":24.1},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Propranolol|commercial": {"avgApprovalRate":76.7,"avgPredictedScore":0.727,"totalRequests":619539,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.1,"stepTherapyNotMet":17.2,"other":23.5},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Propranolol|medicaid": {"avgApprovalRate":75.7,"avgPredictedScore":0.725,"totalRequests":141118,"denialReasons":{"missingDocs":32.8,"insufficientTrial":27.2,"stepTherapyNotMet":17.5,"other":22.4},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Rimegepant|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.729,"totalRequests":639649,"denialReasons":{"missingDocs":32.2,"insufficientTrial":27.4,"stepTherapyNotMet":17.3,"other":23.1},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Rimegepant|medicaid": {"avgApprovalRate":76.2,"avgPredictedScore":0.727,"totalRequests":140848,"denialReasons":{"missingDocs":32.8,"insufficientTrial":26.8,"stepTherapyNotMet":17.4,"other":23.0},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Rizatriptan|commercial": {"avgApprovalRate":76.3,"avgPredictedScore":0.724,"totalRequests":625707,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.3,"stepTherapyNotMet":16.9,"other":23.4},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Rizatriptan|medicaid": {"avgApprovalRate":76.5,"avgPredictedScore":0.725,"totalRequests":149384,"denialReasons":{"missingDocs":32.7,"insufficientTrial":27.4,"stepTherapyNotMet":17.3,"other":22.6},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Sumatriptan|commercial": {"avgApprovalRate":76.6,"avgPredictedScore":0.727,"totalRequests":635835,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.0,"stepTherapyNotMet":17.2,"other":23.5},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Sumatriptan|medicaid": {"avgApprovalRate":76.7,"avgPredictedScore":0.725,"totalRequests":146858,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.2,"stepTherapyNotMet":17.5,"other":23.0},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Timolol|commercial": {"avgApprovalRate":76.7,"avgPredictedScore":0.728,"totalRequests":625775,"denialReasons":{"missingDocs":32.2,"insufficientTrial":27.2,"stepTherapyNotMet":17.3,"other":23.4},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Timolol|medicaid": {"avgApprovalRate":75.4,"avgPredictedScore":0.721,"totalRequests":136339,"denialReasons":{"missingDocs":32.4,"insufficientTrial":27.0,"stepTherapyNotMet":17.4,"other":23.1},"typicalRequirements":{"minMigraineDays":8,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Topiramate|commercial": {"avgApprovalRate":76.2,"avgPredictedScore":0.726,"totalRequests":639917,"denialReasons":{"missingDocs":32.1,"insufficientTrial":27.4,"stepTherapyNotMet":17.1,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Topiramate|medicaid": {"avgApprovalRate":76.9,"avgPredictedScore":0.73,"totalRequests":141005,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.5,"stepTherapyNotMet":17.2,"other":23.0},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Ubrogepant|commercial": {"avgApprovalRate":76.5,"avgPredictedScore":0.727,"totalRequests":624281,"denialReasons":{"missingDocs":32.3,"insufficientTrial":27.1,"stepTherapyNotMet":17.2,"other":23.3},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":1,"failedPreventivesLabel":"1 oral preventive","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Ubrogepant|medicaid": {"avgApprovalRate":76.2,"avgPredictedScore":0.724,"totalRequests":139080,"denialReasons":{"missingDocs":32.6,"insufficientTrial":27.7,"stepTherapyNotMet":17.0,"other":22.6},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Valproate|commercial": {"avgApprovalRate":76.1,"avgPredictedScore":0.726,"totalRequests":637990,"denialReasons":{"missingDocs":32.0,"insufficientTrial":27.4,"stepTherapyNotMet":17.1,"other":23.5},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Valproate|medicaid": {"avgApprovalRate":76.2,"avgPredictedScore":0.726,"totalRequests":146567,"denialReasons":{"missingDocs":31.8,"insufficientTrial":27.3,"stepTherapyNotMet":17.2,"other":23.7},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Venlafaxine|commercial": {"avgApprovalRate":76.3,"avgPredictedScore":0.726,"totalRequests":620214,"denialReasons":{"missingDocs":32.0,"insufficientTrial":26.9,"stepTherapyNotMet":17.0,"other":24.1},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Venlafaxine|medicaid": {"avgApprovalRate":75.3,"avgPredictedScore":0.72,"totalRequests":140460,"denialReasons":{"missingDocs":32.6,"insufficientTrial":28.0,"stepTherapyNotMet":17.5,"other":21.9},"typicalRequirements":{"minMigraineDays":10,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
  "Zolmitriptan|commercial": {"avgApprovalRate":76.2,"avgPredictedScore":0.725,"totalRequests":635962,"denialReasons":{"missingDocs":32.5,"insufficientTrial":27.2,"stepTherapyNotMet":17.1,"other":23.2},"typicalRequirements":{"minMigraineDays":12,"failedPreventivesCount":2,"failedPreventivesLabel":"2 oral preventives","trialDurationWeeks":8,"stepTherapyRequired":true}},
  "Zolmitriptan|medicaid": {"avgApprovalRate":75.5,"avgPredictedScore":0.719,"totalRequests":141039,"denialReasons":{"missingDocs":32.5,"insufficientTrial":26.7,"stepTherapyNotMet":17.5,"other":23.3},"typicalRequirements":{"minMigraineDays":6,"failedPreventivesCount":3,"failedPreventivesLabel":"3 oral preventives","trialDurationWeeks":12,"stepTherapyRequired":true}},
};

/** Look up PA data for a drug + plan type combination. Returns null if not found. */
export function lookupPA(drugName: string, planType: string): PALookupEntry | null {
  const key = `${drugName}|${planType.toLowerCase()}`;
  return PA_LOOKUP[key] ?? null;
}

/** All drug names available in the dataset */
export const PA_DRUGS = [
  { value: "Almotriptan",       label: "Almotriptan (Axert)",               group: "Triptan" },
  { value: "Eletriptan",        label: "Eletriptan (Relpax)",               group: "Triptan" },
  { value: "Frovatriptan",      label: "Frovatriptan (Frova)",              group: "Triptan" },
  { value: "Naratriptan",       label: "Naratriptan (Amerge)",              group: "Triptan" },
  { value: "Rizatriptan",       label: "Rizatriptan (Maxalt)",              group: "Triptan" },
  { value: "Sumatriptan",       label: "Sumatriptan (Imitrex)",             group: "Triptan" },
  { value: "Zolmitriptan",      label: "Zolmitriptan (Zomig)",              group: "Triptan" },
  { value: "Rimegepant",        label: "Rimegepant (Nurtec ODT)",           group: "CGRP – Oral" },
  { value: "Ubrogepant",        label: "Ubrogepant (Ubrelvy)",              group: "CGRP – Oral" },
  { value: "Erenumab",          label: "Erenumab (Aimovig)",                group: "CGRP – Injectable" },
  { value: "Fremanezumab",      label: "Fremanezumab (Ajovy)",              group: "CGRP – Injectable" },
  { value: "Galcanezumab",      label: "Galcanezumab (Emgality)",           group: "CGRP – Injectable" },
  { value: "Eptinezumab",       label: "Eptinezumab (Vyepti)",              group: "CGRP – Injectable" },
  { value: "OnabotulinumtoxinA",label: "OnabotulinumtoxinA (Botox)",        group: "Preventive" },
  { value: "Topiramate",        label: "Topiramate (Topamax)",              group: "Preventive" },
  { value: "Propranolol",       label: "Propranolol (Inderal)",             group: "Preventive" },
  { value: "Metoprolol",        label: "Metoprolol (Lopressor)",            group: "Preventive" },
  { value: "Timolol",           label: "Timolol (Blocadren)",               group: "Preventive" },
  { value: "Amitriptyline",     label: "Amitriptyline (Elavil)",            group: "Preventive" },
  { value: "Nortriptyline",     label: "Nortriptyline (Pamelor)",           group: "Preventive" },
  { value: "Venlafaxine",       label: "Venlafaxine (Effexor)",             group: "Preventive" },
  { value: "Divalproex",        label: "Divalproex (Depakote)",             group: "Preventive" },
  { value: "Valproate",         label: "Valproate (Depacon)",               group: "Preventive" },
] as const;
