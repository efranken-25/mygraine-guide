const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugName } = await req.json();

    if (!drugName) {
      return new Response(
        JSON.stringify({ success: false, error: 'drugName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encoded = encodeURIComponent(drugName);

    // Fetch drug label data from OpenFDA (free, no key needed)
    const labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"+OR+openfda.generic_name:"${encoded}"&limit=1`;
    const labelRes = await fetch(labelUrl);
    const labelData = await labelRes.json();

    let label = labelData.results?.[0];

    if (!label) {
      // Try a broader search
      const broadUrl = `https://api.fda.gov/drug/label.json?search="${encoded}"&limit=1`;
      const broadRes = await fetch(broadUrl);
      const broadData = await broadRes.json();
      label = broadData.results?.[0];
    }

    if (!label) {
      return new Response(
        JSON.stringify({ success: false, error: 'Drug not found in FDA database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const drugInfo = extractDrugInfo(label, drugName);

    // Generate AI plain-language summary
    const aiSummary = await generateAISummary(drugInfo);

    return new Response(
      JSON.stringify({ success: true, data: { ...drugInfo, aiSummary } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Drug lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Lookup failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAISummary(drugInfo: ReturnType<typeof extractDrugInfo>): Promise<{
  whatItDoes: string;
  commonSideEffects: string[];
  importantWarnings: string[];
  interactions: string[];
  bottomLine: string;
} | null> {
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) return null;

    const prompt = `You are a patient-friendly clinical pharmacist. Summarize the following FDA drug label information for a migraine patient in plain, simple English. Be warm, clear, and reassuring — avoid medical jargon.

Drug: ${drugInfo.name} (${drugInfo.genericName})
Drug Class: ${drugInfo.drugClass}
Indications: ${drugInfo.indications.join('; ')}
Adverse Reactions (raw FDA text): ${drugInfo.adverseReactions.slice(0, 4).join(' | ')}
Warnings (raw FDA text): ${drugInfo.warnings.slice(0, 4).join(' | ')}
Drug Interactions (raw FDA text): ${drugInfo.drugInteractions.slice(0, 3).join(' | ')}

Return a JSON object with exactly these fields:
{
  "whatItDoes": "1-2 sentence plain-English explanation of what this drug does and why it's used",
  "commonSideEffects": ["3-5 most common side effects in plain language, short phrases"],
  "importantWarnings": ["2-4 important safety points in plain language, starting with action words like 'Tell your doctor if...' or 'Avoid...'"],
  "interactions": ["2-3 key interaction warnings in plain language"],
  "bottomLine": "1 sentence summary of the most important thing the patient should know"
}

Return ONLY valid JSON, no markdown.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Strip markdown code fences if present
    const clean = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('AI summary error:', e);
    return null;
  }
}

function extractDrugInfo(label: Record<string, unknown>, drugName: string) {
  const arr = (field: unknown): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field as string[];
    return [field as string];
  };

  const clean = (texts: string[]): string[] => {
    return texts
      .join(' ')
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 8);
  };

  return {
    name: drugName,
    genericName: arr((label.openfda as Record<string, unknown>)?.generic_name)?.[0] || drugName,
    brandName: arr((label.openfda as Record<string, unknown>)?.brand_name)?.[0] || '',
    drugClass: arr((label.openfda as Record<string, unknown>)?.pharm_class_epc)?.[0] || '',
    adverseReactions: clean(arr(label.adverse_reactions)),
    warnings: clean(arr(label.warnings || label.warnings_and_cautions)),
    drugInteractions: clean(arr(label.drug_interactions)),
    description: clean(arr(label.description)).slice(0, 2),
    indications: clean(arr(label.indications_and_usage)).slice(0, 3),
  };
}
