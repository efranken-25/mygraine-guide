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

    const label = labelData.results?.[0];

    if (!label) {
      // Try a broader search
      const broadUrl = `https://api.fda.gov/drug/label.json?search="${encoded}"&limit=1`;
      const broadRes = await fetch(broadUrl);
      const broadData = await broadRes.json();
      const broadLabel = broadData.results?.[0];

      if (!broadLabel) {
        return new Response(
          JSON.stringify({ success: false, error: 'Drug not found in FDA database' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: extractDrugInfo(broadLabel, drugName) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: extractDrugInfo(label, drugName) }),
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
