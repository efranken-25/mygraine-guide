import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NPPES_URL = "https://npiregistry.cms.hhs.gov/api/?version=2.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zip, type } = await req.json();
    // type: "doctor" | "pharmacy"

    if (!zip || typeof zip !== "string" || zip.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Valid ZIP code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanZip = zip.trim();

    let url: string;

    if (type === "pharmacy") {
      // NPI-2 = organizations, taxonomy for pharmacies
      url = `${NPPES_URL}&enumeration_type=NPI-2&postal_code=${cleanZip}&taxonomy_description=Pharmacy&limit=20`;
    } else {
      // NPI-1 = individuals, taxonomy for neurology
      url = `${NPPES_URL}&enumeration_type=NPI-1&postal_code=${cleanZip}&taxonomy_description=Neurology&limit=20`;
    }

    console.log("Fetching NPPES:", url);

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NPPES API error [${res.status}]: ${text}`);
    }

    const data = await res.json();
    const results = data.results || [];

    // Transform into a clean format
    const providers = results.map((r: any, idx: number) => {
      const addr =
        r.addresses?.find((a: any) => a.address_purpose === "LOCATION") ||
        r.addresses?.[0] ||
        {};
      const taxonomy = r.taxonomies?.[0] || {};

      if (type === "pharmacy") {
        const orgName =
          r.basic?.organization_name || r.basic?.name || "Unknown Pharmacy";
        return {
          id: r.number || idx,
          npi: r.number,
          name: orgName,
          chain: orgName.split(" ")[0],
          address: [addr.address_1, addr.city, addr.state, addr.postal_code]
            .filter(Boolean)
            .join(", "),
          phone: addr.telephone_number || "",
          specialty: taxonomy.desc || "Pharmacy",
        };
      } else {
        const firstName = r.basic?.first_name || "";
        const lastName = r.basic?.last_name || "";
        const credential = r.basic?.credential || "";
        return {
          id: r.number || idx,
          npi: r.number,
          name: `Dr. ${firstName} ${lastName}`.trim(),
          title: credential,
          specialty: taxonomy.desc || "Neurology",
          practice:
            r.basic?.organization_name || taxonomy.desc || "Private Practice",
          address: [addr.address_1, addr.city, addr.state, addr.postal_code]
            .filter(Boolean)
            .join(", "),
          phone: addr.telephone_number || "",
          state: addr.state || "",
        };
      }
    });

    return new Response(JSON.stringify({ providers, count: providers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("provider-search error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
