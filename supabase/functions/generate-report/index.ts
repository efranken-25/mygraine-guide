const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries, medications, dateFrom, dateTo, patientNotes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = buildPrompt(entries, medications, dateFrom, dateTo, patientNotes);

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
            content: `You are a clinical neurologist assistant generating a patient migraine report for a healthcare provider review.
Write in a professional, neutral, clinical tone. Be concise but comprehensive. 
Return a JSON object with exactly these keys:
- "executiveSummary": string (2-4 sentences, clinical overview of the period)
- "patternInsights": string[] (3-5 bullet points as strings, each 1-2 sentences on patterns found)
- "triggerAnalysis": string (2-3 sentences analyzing top triggers and their correlations)
- "medicationSummary": string (2-3 sentences on medication use, effectiveness, and any concerns)
- "anomalies": string[] (0-3 notable anomalies or red flags as strings, empty array if none)
- "clinicalRecommendations": string[] (2-4 actionable recommendations as strings for the clinician)
- "hormonalNotes": string (1-2 sentences on hormonal patterns if data present, otherwise empty string)`,
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
      parsed = {
        executiveSummary: content,
        patternInsights: [],
        triggerAnalysis: '',
        medicationSummary: '',
        anomalies: [],
        clinicalRecommendations: [],
        hormonalNotes: '',
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Report generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(entries: unknown[], medications: unknown[], dateFrom: string, dateTo: string, patientNotes: string) {
  return `
Clinical Report Period: ${dateFrom} to ${dateTo}

Total migraine episodes in period: ${Array.isArray(entries) ? entries.length : 0}

Episode Data:
${JSON.stringify(entries, null, 2)}

Current Medications:
${JSON.stringify(medications, null, 2)}

Patient Notes:
${patientNotes || 'None provided'}

Please analyze this patient's migraine data for the specified period and generate a clinical report suitable for review by a neurologist or headache specialist. Focus on:
1. Overall episode frequency, severity, and duration trends
2. Most impactful triggers and any correlations between them (e.g., stress + poor sleep)
3. Medication usage patterns, rescue medication frequency, and effectiveness data if available
4. Any hormonal patterns if hormonal status data is present
5. Any anomalies: unusually severe episodes, clusters, or rapid changes in pattern
6. Specific, actionable clinical recommendations based on the data

Return the JSON object as specified.
`;
}
