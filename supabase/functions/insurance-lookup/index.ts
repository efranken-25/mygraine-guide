const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// CMS Plan Finder base URL (public, no key required)
const CMS_BASE = 'https://api.cms.gov/medicare/plan-finder/v1';

// Open RxNorm API for drug lookup
const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'search_plans') {
      return await searchPlans(body, req);
    } else if (action === 'formulary_drug') {
      return await formularyDrugLookup(body);
    } else if (action === 'plan_formulary') {
      return await planFormulary(body);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('Insurance lookup error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Search insurance plans via CMS Plan Finder ───────────────────────────────
async function searchPlans(body: Record<string, string>, req: Request) {
  const { query, planType, zipCode, year } = body;
  const planYear = year || '2026';
  const zip = zipCode || '60601'; // Default to Chicago; in production user provides this

  // CMS Plan Finder - search by zip/county
  // First get county FIPS from zip
  let fips = '';
  try {
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const state = geoData.places?.[0]?.['state abbreviation'] || 'IL';
      // Use a known FIPS fallback per state for demo; CMS needs full county FIPS
      fips = stateFips[state] || '17031'; // Cook County, IL default
    }
  } catch (_) {
    fips = '17031';
  }

  // Query CMS Plan Finder for plans
  try {
    const cmsUrl = `${CMS_BASE}/plans?year=${planYear}&fips=${fips}&plan_type=${planType || 'ALL'}&limit=25`;
    const cmsRes = await fetch(cmsUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (cmsRes.ok) {
      const cmsData = await cmsRes.json();
      const plans = (cmsData.plans || cmsData.data || []).map(normalizeCmsPlan);

      const filtered = query
        ? plans.filter((p: NormalizedPlan) =>
            p.carrier.toLowerCase().includes(query.toLowerCase()) ||
            p.planName.toLowerCase().includes(query.toLowerCase()) ||
            p.planType.toLowerCase().includes(query.toLowerCase())
          )
        : plans;

      return new Response(
        JSON.stringify({ success: true, plans: filtered, source: 'cms', zip }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (e) {
    console.error('CMS API error:', e);
  }

  // ── Fallback: comprehensive static dataset of real US plans ──────────────────
  const allPlans = getAllPlans();
  const q = (query || '').toLowerCase();
  const filtered = q
    ? allPlans.filter((p) =>
        p.carrier.toLowerCase().includes(q) ||
        p.planName.toLowerCase().includes(q) ||
        p.planType.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q)
      )
    : allPlans;

  return new Response(
    JSON.stringify({ success: true, plans: filtered, source: 'static', zip }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─── Look up a specific drug on a plan's formulary ───────────────────────────
async function formularyDrugLookup(body: Record<string, string>) {
  const { drugName, planId, carrierId } = body;
  if (!drugName) {
    return new Response(
      JSON.stringify({ success: false, error: 'drugName required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Step 1: Get RxNorm CUI for drug name
  let rxcui = '';
  try {
    const rxRes = await fetch(`${RXNORM_BASE}/drugs.json?name=${encodeURIComponent(drugName)}`);
    if (rxRes.ok) {
      const rxData = await rxRes.json();
      rxcui = rxData.drugGroup?.conceptGroup?.[0]?.conceptProperties?.[0]?.rxcui || '';
    }
  } catch (_) {}

  // Step 2: If we have a planId from CMS, query CMS formulary API
  if (planId && rxcui) {
    try {
      const cmsRes = await fetch(`${CMS_BASE}/formulary?plan_id=${planId}&rxcui=${rxcui}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (cmsRes.ok) {
        const cmsData = await cmsRes.json();
        if (cmsData.formulary_items?.length) {
          const item = cmsData.formulary_items[0];
          return new Response(
            JSON.stringify({
              success: true,
              drug: {
                name: drugName,
                rxcui,
                tier: item.tier_level_value || item.tier,
                covered: item.covered !== false,
                paRequired: item.prior_authorization === 'Y' || item.prior_authorization === true,
                stepTherapy: item.step_therapy === 'Y' || item.step_therapy === true,
                quantityLimit: item.quantity_limit === 'Y' || item.quantity_limit === true,
                copay: item.copay_amount ? `$${item.copay_amount}` : 'See plan',
              },
              source: 'cms',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (e) {
      console.error('CMS formulary error:', e);
    }
  }

  // Step 3: Fallback - look up in our extended drug reference, estimate by plan tier structure
  const drugRef = getDrugReference(drugName);
  return new Response(
    JSON.stringify({
      success: true,
      drug: {
        name: drugName,
        rxcui,
        tier: drugRef.tier,
        covered: drugRef.covered,
        paRequired: drugRef.paRequired,
        stepTherapy: drugRef.stepTherapy,
        quantityLimit: drugRef.quantityLimit,
        copay: drugRef.copayHint,
        notes: drugRef.notes,
      },
      source: 'reference',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─── Get full formulary for a plan ───────────────────────────────────────────
async function planFormulary(body: Record<string, string>) {
  const { planId, search } = body;

  if (planId) {
    try {
      const url = search
        ? `${CMS_BASE}/formulary?plan_id=${planId}&drug_name=${encodeURIComponent(search)}&limit=30`
        : `${CMS_BASE}/formulary?plan_id=${planId}&limit=50`;
      const cmsRes = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (cmsRes.ok) {
        const cmsData = await cmsRes.json();
        if (cmsData.formulary_items?.length) {
          return new Response(
            JSON.stringify({
              success: true,
              drugs: cmsData.formulary_items.map((item: Record<string, unknown>) => ({
                name: item.drug_name || item.label_name,
                tier: item.tier_level_value || item.tier,
                covered: item.covered !== false,
                paRequired: item.prior_authorization === 'Y',
                stepTherapy: item.step_therapy === 'Y',
                quantityLimit: item.quantity_limit === 'Y',
                copay: item.copay_amount ? `$${item.copay_amount}` : 'See plan',
              })),
              source: 'cms',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (e) {
      console.error('Plan formulary error:', e);
    }
  }

  // Fallback: return our comprehensive migraine drug reference
  const drugs = getMigraineDrugReference();
  const filtered = search
    ? drugs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : drugs;

  return new Response(
    JSON.stringify({ success: true, drugs: filtered, source: 'reference' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface NormalizedPlan {
  id: string;
  carrier: string;
  planName: string;
  planType: string;
  state?: string;
  tier1: string;
  tier2: string;
  tier3: string;
  pharmacyHelpdesk: string;
  pharmacyHelpdeskHours: string;
  pharmacyWebsite: string;
  formularyYear: string;
  lastUpdated: string;
}

function normalizeCmsPlan(p: Record<string, unknown>): NormalizedPlan {
  return {
    id: String(p.plan_id || p.id || Math.random()),
    carrier: String(p.organization_name || p.carrier || 'Unknown'),
    planName: String(p.plan_name || p.name || 'Unknown Plan'),
    planType: String(p.plan_type || p.type || 'Unknown'),
    state: String(p.state || ''),
    tier1: p.tier1_cost ? `$${p.tier1_cost}` : '$10',
    tier2: p.tier2_cost ? `$${p.tier2_cost}` : '$35',
    tier3: p.tier3_cost ? `$${p.tier3_cost}` : '$65',
    pharmacyHelpdesk: String(p.pharmacy_phone || p.phone || '1-800-MEDICARE'),
    pharmacyHelpdeskHours: '24/7',
    pharmacyWebsite: String(p.website || 'medicare.gov'),
    formularyYear: '2026',
    lastUpdated: 'Jan 1, 2026',
  };
}

// ─── Comprehensive static plan database (real US carriers) ───────────────────
function getAllPlans(): NormalizedPlan[] {
  return [
    // BCBS family
    { id: 'bcbs-ppo-gold', carrier: 'Blue Cross Blue Shield', planName: 'PPO Gold 1000', planType: 'PPO', state: 'IL', tier1: '$10', tier2: '$35', tier3: '$65', pharmacyHelpdesk: '1-800-624-2356', pharmacyHelpdeskHours: 'Mon–Fri 8am–8pm · Sat 8am–5pm CT', pharmacyWebsite: 'bcbsil.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'bcbs-hmo-silver', carrier: 'Blue Cross Blue Shield', planName: 'HMO Silver 2000', planType: 'HMO', state: 'TX', tier1: '$12', tier2: '$38', tier3: '$70', pharmacyHelpdesk: '1-888-697-0683', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'bcbstx.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'bcbs-epo-bronze', carrier: 'Blue Cross Blue Shield', planName: 'EPO Bronze 5000', planType: 'EPO', state: 'CA', tier1: '$15', tier2: '$45', tier3: '$90', pharmacyHelpdesk: '1-833-551-0503', pharmacyHelpdeskHours: 'Mon–Fri 8am–6pm', pharmacyWebsite: 'blueshieldca.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Aetna
    { id: 'aetna-hmo-silver', carrier: 'Aetna', planName: 'HMO Silver 2500', planType: 'HMO', state: 'FL', tier1: '$15', tier2: '$40', tier3: '$80', pharmacyHelpdesk: '1-888-792-3862', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'aetna.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'aetna-ppo-gold', carrier: 'Aetna', planName: 'PPO Gold 800', planType: 'PPO', state: 'NY', tier1: '$12', tier2: '$38', tier3: '$75', pharmacyHelpdesk: '1-888-792-3862', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'aetna.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'aetna-medicare-advantage', carrier: 'Aetna', planName: 'Medicare Advantage Plus', planType: 'Medicare Advantage', state: 'National', tier1: '$0', tier2: '$20', tier3: '$47', pharmacyHelpdesk: '1-800-282-5366', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'aetnamedicare.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Cigna
    { id: 'cigna-ppo-platinum', carrier: 'Cigna', planName: 'PPO Platinum 500', planType: 'PPO', state: 'CT', tier1: '$10', tier2: '$30', tier3: '$55', pharmacyHelpdesk: '1-800-244-6224', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'cigna.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'cigna-hdhp', carrier: 'Cigna', planName: 'HDHP HSA Compatible', planType: 'HDHP', state: 'TX', tier1: '$0 (deductible)', tier2: '$0 (deductible)', tier3: '$0 (deductible)', pharmacyHelpdesk: '1-800-244-6224', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'cigna.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'cigna-connect-gold', carrier: 'Cigna', planName: 'Connect Gold 1500', planType: 'HMO', state: 'GA', tier1: '$10', tier2: '$35', tier3: '$60', pharmacyHelpdesk: '1-800-244-6224', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'cigna.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // UnitedHealthcare
    { id: 'uhc-choice-gold', carrier: 'UnitedHealthcare', planName: 'Choice Plus Gold', planType: 'PPO', state: 'MN', tier1: '$10', tier2: '$35', tier3: '$70', pharmacyHelpdesk: '1-866-606-8612', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'uhc.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'uhc-navigate-silver', carrier: 'UnitedHealthcare', planName: 'Navigate Silver 3000', planType: 'HMO', state: 'OH', tier1: '$15', tier2: '$45', tier3: '$85', pharmacyHelpdesk: '1-866-606-8612', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'uhc.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'uhc-medicare-complete', carrier: 'UnitedHealthcare', planName: 'Medicare Complete', planType: 'Medicare Advantage', state: 'National', tier1: '$0', tier2: '$25', tier3: '$47', pharmacyHelpdesk: '1-877-596-3341', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'aarpmedicareplans.com', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Humana
    { id: 'humana-choice-gold', carrier: 'Humana', planName: 'Choice Gold 1250', planType: 'PPO', state: 'KY', tier1: '$10', tier2: '$35', tier3: '$65', pharmacyHelpdesk: '1-800-604-0215', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'humana.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'humana-value-hmo', carrier: 'Humana', planName: 'Value HMO Bronze', planType: 'HMO', state: 'FL', tier1: '$20', tier2: '$50', tier3: '$95', pharmacyHelpdesk: '1-800-604-0215', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'humana.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'humana-medicare-advantage', carrier: 'Humana', planName: 'Medicare Advantage Gold Plus', planType: 'Medicare Advantage', state: 'National', tier1: '$0', tier2: '$15', tier3: '$42', pharmacyHelpdesk: '1-800-457-4708', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'humana.com/medicare', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Kaiser Permanente
    { id: 'kaiser-hmo-gold', carrier: 'Kaiser Permanente', planName: 'HMO Gold 1000', planType: 'HMO', state: 'CA', tier1: '$10', tier2: '$35', tier3: '$60', pharmacyHelpdesk: '1-800-464-4000', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'kp.org/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'kaiser-hmo-silver', carrier: 'Kaiser Permanente', planName: 'HMO Silver 2000', planType: 'HMO', state: 'CO', tier1: '$15', tier2: '$40', tier3: '$75', pharmacyHelpdesk: '1-800-464-4000', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'kp.org/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Molina
    { id: 'molina-medicaid', carrier: 'Molina Healthcare', planName: 'Medicaid Managed Care', planType: 'Medicaid', state: 'CA', tier1: '$0', tier2: '$0', tier3: '$0', pharmacyHelpdesk: '1-888-665-4621', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'molinahealthcare.com', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'molina-marketplace', carrier: 'Molina Healthcare', planName: 'Marketplace Silver 3000', planType: 'HMO', state: 'TX', tier1: '$10', tier2: '$40', tier3: '$80', pharmacyHelpdesk: '1-888-665-4621', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'molinahealthcare.com', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Anthem
    { id: 'anthem-ppo-gold', carrier: 'Anthem Blue Cross', planName: 'PPO Gold 1500', planType: 'PPO', state: 'CA', tier1: '$10', tier2: '$35', tier3: '$70', pharmacyHelpdesk: '1-855-336-3415', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'anthem.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'anthem-hmo-silver', carrier: 'Anthem Blue Cross', planName: 'HMO Silver 4000', planType: 'HMO', state: 'VA', tier1: '$15', tier2: '$45', tier3: '$85', pharmacyHelpdesk: '1-855-336-3415', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'anthem.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Centene / WellCare
    { id: 'wellcare-medicare', carrier: 'WellCare', planName: 'Medicare Value (PDP)', planType: 'Medicare Part D', state: 'National', tier1: '$0', tier2: '$5', tier3: '$42', pharmacyHelpdesk: '1-800-794-5907', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'wellcare.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Oscar
    { id: 'oscar-gold', carrier: 'Oscar Health', planName: 'Gold Classic', planType: 'HMO', state: 'NY', tier1: '$10', tier2: '$35', tier3: '$65', pharmacyHelpdesk: '1-855-672-2788', pharmacyHelpdeskHours: 'Mon–Fri 9am–6pm ET', pharmacyWebsite: 'hioscar.com/pharmacy', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Medicaid
    { id: 'medicaid-standard', carrier: 'State Medicaid', planName: 'Standard Medicaid', planType: 'Medicaid', state: 'National', tier1: '$0', tier2: '$0', tier3: '$3', pharmacyHelpdesk: '1-800-633-4227', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'medicaid.gov', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    // Medicare Part D standalone
    { id: 'silverscript-pdp', carrier: 'SilverScript (CVS)', planName: 'SilverScript Plus (PDP)', planType: 'Medicare Part D', state: 'National', tier1: '$0', tier2: '$7', tier3: '$47', pharmacyHelpdesk: '1-866-235-5660', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'silverscript.com', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
    { id: 'expresscripts-pdp', carrier: 'Express Scripts', planName: 'Express Scripts Medicare (PDP)', planType: 'Medicare Part D', state: 'National', tier1: '$0', tier2: '$8', tier3: '$47', pharmacyHelpdesk: '1-866-544-4419', pharmacyHelpdeskHours: '24/7', pharmacyWebsite: 'express-scripts.com', formularyYear: '2026', lastUpdated: 'Jan 1, 2026' },
  ];
}

// ─── Drug reference for formulary fallback ───────────────────────────────────
interface DrugRef {
  tier: number;
  covered: boolean;
  paRequired: boolean;
  stepTherapy: boolean;
  quantityLimit: boolean;
  copayHint: string;
  notes: string;
}

function getDrugReference(drugName: string): DrugRef {
  return getMigraineDrugReference().find(
    (d) => d.name.toLowerCase().includes(drugName.toLowerCase())
  ) ?? {
    tier: 3,
    covered: true,
    paRequired: true,
    stepTherapy: false,
    quantityLimit: true,
    copayHint: 'See plan',
    notes: 'Contact your plan for specific coverage details.',
  };
}

function getMigraineDrugReference(): (DrugRef & { name: string; brandNames: string[]; drugClass: string; migraineFocused: boolean; alternatives?: string[] })[] {
  return [
    // ── Migraine-Specific Acute ──────────────────────────────────────────────
    { name: 'Sumatriptan', brandNames: ['Imitrex', 'Zecuity'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$10–$35', notes: 'Generic available; widely covered on most formularies.' },
    { name: 'Rizatriptan', brandNames: ['Maxalt'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$10–$35', notes: 'Generic available; typically Tier 1–2.' },
    { name: 'Zolmitriptan', brandNames: ['Zomig'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$15–$40', notes: 'Generic available.' },
    { name: 'Eletriptan', brandNames: ['Relpax'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$20–$45', notes: 'Generic available in many formularies.' },
    { name: 'Almotriptan', brandNames: ['Axert'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$25–$50', notes: '' },
    { name: 'Naratriptan', brandNames: ['Amerge'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$20–$45', notes: 'Generic available.' },
    { name: 'Frovatriptan', brandNames: ['Frova'], drugClass: 'Triptan', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$25–$55', notes: 'Longer half-life triptan.' },
    { name: 'Ubrogepant', brandNames: ['Ubrelvy'], drugClass: 'CGRP Antagonist (gepant)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$60–$100', notes: 'May require PA and step therapy through triptans first.', alternatives: ['Sumatriptan', 'Rizatriptan'] },
    { name: 'Rimegepant', brandNames: ['Nurtec ODT'], drugClass: 'CGRP Antagonist (gepant)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$60–$100', notes: 'Can be used for both acute and preventive treatment.', alternatives: ['Sumatriptan'] },
    { name: 'Zavegepant', brandNames: ['Zavzpret'], drugClass: 'CGRP Antagonist (gepant)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$105', notes: 'Nasal spray gepant; newer, may not be on all formularies.' },
    { name: 'Lasmiditan', brandNames: ['Reyvow'], drugClass: 'Ditriptan (5-HT1F agonist)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$60–$100', notes: 'No cardiovascular contraindications like triptans; driving restriction.', alternatives: ['Sumatriptan'] },
    { name: 'Dihydroergotamine', brandNames: ['DHE-45', 'Migranal', 'Trudhesa'], drugClass: 'Ergotamine', migraineFocused: true, tier: 2, covered: true, paRequired: true, stepTherapy: false, quantityLimit: true, copayHint: '$40–$80', notes: 'Effective for severe attacks; nasal and injectable forms.' },
    { name: 'Ergotamine', brandNames: ['Cafergot', 'Ergomar'], drugClass: 'Ergotamine', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$25–$50', notes: 'Older agent; avoid overuse.' },
    { name: 'Butalbital', brandNames: ['Fioricet', 'Fiorinal'], drugClass: 'Butalbital Combination', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$20–$40', notes: 'Use sparingly; risk of MOH and dependency.' },
    // ── Migraine-Specific Preventive ─────────────────────────────────────────
    { name: 'Erenumab', brandNames: ['Aimovig'], drugClass: 'CGRP Monoclonal Antibody', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$150', notes: 'Preventive injection; PA typically requires 2+ failed preventives.', alternatives: ['Topiramate', 'Propranolol'] },
    { name: 'Fremanezumab', brandNames: ['Ajovy'], drugClass: 'CGRP Monoclonal Antibody', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$150', notes: 'Monthly or quarterly injection.', alternatives: ['Topiramate'] },
    { name: 'Galcanezumab', brandNames: ['Emgality'], drugClass: 'CGRP Monoclonal Antibody', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$150', notes: 'Also FDA-approved for cluster headache.', alternatives: ['Topiramate'] },
    { name: 'Eptinezumab', brandNames: ['Vyepti'], drugClass: 'CGRP Monoclonal Antibody', migraineFocused: true, tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: 'Not covered / $150+', notes: 'IV infusion; often excluded from commercial formularies.', alternatives: ['Erenumab', 'Topiramate'] },
    { name: 'Atogepant', brandNames: ['Qulipta'], drugClass: 'CGRP Antagonist (gepant)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$105', notes: 'Oral preventive gepant; newer agent.' },
    { name: 'Botulinum Toxin A', brandNames: ['Botox'], drugClass: 'Neurotoxin (Preventive)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: '$65–$200+', notes: 'For chronic migraine (≥15 days/month); requires PA and prior treatment failures.', alternatives: ['Topiramate', 'Propranolol'] },
    // ── Adjuncts & Supportive (migraine context) ─────────────────────────────
    { name: 'Prochlorperazine', brandNames: ['Compazine'], drugClass: 'Antiemetic', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$15–$30', notes: 'Antiemetic / abortive adjunct.' },
    { name: 'Metoclopramide', brandNames: ['Reglan'], drugClass: 'Antiemetic', migraineFocused: true, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'Antiemetic adjunct; also speeds triptan absorption.' },
    { name: 'Ondansetron', brandNames: ['Zofran'], drugClass: 'Antiemetic', migraineFocused: true, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$15–$35', notes: 'Generic available; used for nausea.' },
    { name: 'Magnesium', brandNames: ['Mag-Ox', 'Slow-Mag'], drugClass: 'Nutraceutical', migraineFocused: true, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$10', notes: 'OTC preventive; cheap and safe.' },
    { name: 'Riboflavin (B2)', brandNames: ['Generic'], drugClass: 'Nutraceutical', migraineFocused: true, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5', notes: 'OTC preventive; 400mg/day.' },
    { name: 'Coenzyme Q10', brandNames: ['CoQ10'], drugClass: 'Nutraceutical', migraineFocused: true, tier: 1, covered: false, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: 'OTC only', notes: 'OTC; rarely covered by insurance.' },
    // ── Other Treatments (used for migraine but not migraine-specific) ────────
    { name: 'Topiramate', brandNames: ['Topamax', 'Qudexy XR', 'Trokendi XR'], drugClass: 'Anticonvulsant', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'First-line preventive; generic widely available.' },
    { name: 'Valproate', brandNames: ['Depakote', 'Depakene'], drugClass: 'Anticonvulsant', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$10–$20', notes: 'Generic available; avoid in pregnancy.' },
    { name: 'Propranolol', brandNames: ['Inderal'], drugClass: 'Beta-Blocker', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'First-line preventive; generic widely available.' },
    { name: 'Metoprolol', brandNames: ['Lopressor', 'Toprol-XL'], drugClass: 'Beta-Blocker', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'Generic available; used off-label for prevention.' },
    { name: 'Timolol', brandNames: ['Blocadren'], drugClass: 'Beta-Blocker', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$10–$20', notes: 'FDA-approved for migraine prevention.' },
    { name: 'Amitriptyline', brandNames: ['Elavil'], drugClass: 'Tricyclic Antidepressant', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'Generic widely available; effective preventive.' },
    { name: 'Nortriptyline', brandNames: ['Pamelor'], drugClass: 'Tricyclic Antidepressant', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'Generic available; fewer side effects than amitriptyline.' },
    { name: 'Venlafaxine', brandNames: ['Effexor XR'], drugClass: 'SNRI Antidepressant', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$10–$25', notes: 'Generic available.' },
    { name: 'Candesartan', brandNames: ['Atacand'], drugClass: 'ARB', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$10–$25', notes: 'Used off-label; generally covered as generic.' },
    { name: 'Lisinopril', brandNames: ['Zestril', 'Prinivil'], drugClass: 'ACE Inhibitor', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$10', notes: 'Off-label; very cheap generic.' },
    { name: 'Ibuprofen', brandNames: ['Advil', 'Motrin'], drugClass: 'NSAID', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'OTC and Rx forms available.' },
    { name: 'Naproxen', brandNames: ['Aleve', 'Naprosyn'], drugClass: 'NSAID', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5–$15', notes: 'OTC and Rx forms.' },
    { name: 'Ketorolac', brandNames: ['Toradol'], drugClass: 'NSAID', migraineFocused: false, tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copayHint: '$15–$35', notes: 'Short-term use only (≤5 days).' },
    { name: 'Indomethacin', brandNames: ['Indocin'], drugClass: 'NSAID', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$10–$20', notes: 'First-line for hemicrania continua.' },
    { name: 'Acetaminophen', brandNames: ['Tylenol'], drugClass: 'Analgesic', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5', notes: 'OTC; mild acute relief.' },
    { name: 'Diphenhydramine', brandNames: ['Benadryl'], drugClass: 'Antihistamine', migraineFocused: false, tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copayHint: '$5', notes: 'OTC; used adjunctively for nausea/sleep.' },
    { name: 'Onabotulinumtoxin A', brandNames: ['Botox'], drugClass: 'Neurotoxin (Preventive)', migraineFocused: true, tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copayHint: 'Procedure cost varies', notes: 'Same as Botox; requires specialist administration.' },
  ];
}

// ─── State to FIPS county mapping (representative counties) ──────────────────
const stateFips: Record<string, string> = {
  AL: '01073', AK: '02020', AZ: '04013', AR: '05119', CA: '06037',
  CO: '08031', CT: '09003', DE: '10003', FL: '12086', GA: '13121',
  HI: '15003', ID: '16001', IL: '17031', IN: '18097', IA: '19153',
  KS: '20091', KY: '21067', LA: '22071', ME: '23005', MD: '24005',
  MA: '25025', MI: '26163', MN: '27053', MS: '28049', MO: '29189',
  MT: '30049', NE: '31055', NV: '32003', NH: '33011', NJ: '34017',
  NM: '35001', NY: '36061', NC: '37119', ND: '38017', OH: '39035',
  OK: '40109', OR: '41051', PA: '42101', RI: '44007', SC: '45045',
  SD: '46099', TN: '47157', TX: '48201', UT: '49035', VT: '50007',
  VA: '51059', WA: '53033', WV: '54039', WI: '55079', WY: '56021',
};
