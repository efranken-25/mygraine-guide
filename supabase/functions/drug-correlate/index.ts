const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lookedUpDrug, lookedUpDrugInfo, currentMedications, migraineEntries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const activeMeds = currentMedications.filter((m: { active: boolean }) => m.active);
    const allMeds = currentMedications;

    const prompt = `
You are a clinical pharmacist reviewing a patient's medication profile. The patient is looking up "${lookedUpDrug}" and you must analyze how it relates to their current medication regimen.

PATIENT'S CURRENT MEDICATIONS (active):
${JSON.stringify(activeMeds, null, 2)}

ALL MEDICATIONS (including discontinued):
${JSON.stringify(allMeds, null, 2)}

DRUG BEING LOOKED UP: ${lookedUpDrug}
FDA LABEL DATA FOR ${lookedUpDrug}:
- Drug class: ${lookedUpDrugInfo?.drugClass || 'Unknown'}
- Adverse reactions (excerpt): ${lookedUpDrugInfo?.adverseReactions?.slice(0, 3).join('; ') || 'N/A'}
- Drug interactions (excerpt): ${lookedUpDrugInfo?.drugInteractions?.slice(0, 3).join('; ') || 'N/A'}
- Warnings (excerpt): ${lookedUpDrugInfo?.warnings?.slice(0, 2).join('; ') || 'N/A'}

RECENT MIGRAINE HISTORY (last 30 days):
${JSON.stringify(migraineEntries, null, 2)}

Analyze and return a JSON object with:
1. "interactions": array of drug-drug interaction objects between ${lookedUpDrug} and each current active medication — only include clinically meaningful ones
2. "sideEffectOverlaps": array of side effect overlap objects — where a known side effect of ${lookedUpDrug} might explain a symptom pattern in the migraine history
3. "migraineRelevance": object describing how ${lookedUpDrug} relates to this patient's migraine condition
4. "overallRisk": "low" | "moderate" | "high" — overall concern level of adding this drug to current regimen
5. "summary": 2-3 sentence plain-English clinical summary

For "interactions" items use: { "drug": string, "severity": "major"|"moderate"|"minor", "mechanism": string, "clinicalEffect": string }
For "sideEffectOverlaps" items use: { "sideEffect": string, "relevance": string, "action": string }
For "migraineRelevance" use: { "role": "beneficial"|"neutral"|"potentially harmful", "explanation": string }

Only include interactions and overlaps that are clinically meaningful. Return an empty array if none are significant.
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert clinical pharmacist. Return only valid JSON, no markdown, no explanation outside the JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'Usage credits required. Please add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, interactions: [], sideEffectOverlaps: [], overallRisk: 'low' };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Drug correlation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
