const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medications, migraineEntries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = buildPrompt(medications, migraineEntries);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a clinical pharmacist assistant analyzing medication-migraine correlations for a patient tracking app. 
Be precise and clinically informative but written for a patient audience. 
Return a JSON object with keys: "insights" (array of insight objects) and "summary" (string).
Each insight object: { "type": "improvement"|"concern"|"neutral", "medication": string, "finding": string, "confidence": "high"|"moderate"|"low" }
Focus on: frequency changes, severity trends, side effect connections, BP trends, and drug interactions.
Keep findings concise (1-2 sentences each). Return 3-6 insights maximum.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI request failed: ${err}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { insights: [], summary: content };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Correlation analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(medications: unknown[], migraineEntries: unknown[]) {
  return `
Patient medication list:
${JSON.stringify(medications, null, 2)}

Recent migraine entries (last 30 days):
${JSON.stringify(migraineEntries, null, 2)}

Analyze potential correlations between the patient's medications and migraine patterns.
Look for:
1. Whether preventive medications are showing effectiveness (frequency/severity reduction)
2. Whether any medication side effects could explain migraine increases or other symptoms
3. Drug-drug interactions of concern between listed medications
4. Whether cardiovascular medications (e.g. propranolol, amitriptyline) may be influencing blood pressure readings
5. Whether any patterns suggest medication overuse headache risk

Return a JSON object with "insights" array and "summary" string.
`;
}
