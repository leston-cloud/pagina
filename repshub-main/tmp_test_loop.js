const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function testFetch() {
    const headersTemplate = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "count=exact"
    };

    const query = `${SUPABASE_URL}/rest/v1/products_clean?select=id&activo=eq.true&source_url=not.is.null&source_url=neq.&order=created_at.desc`;

    let allProducts = [];
    let offset = 0;
    const limit = 1000;
    let fetchMore = true;

    while (fetchMore) {
        const headers = { ...headersTemplate, "Range": `${offset}-${offset + limit - 1}` };
        console.log("Fetching offset " + offset);
        const res = await fetch(query, { headers });

        if (!res.ok) {
            const txt = await res.text();
            console.error(`Supabase error ${res.status}: ${txt}`);
            break;
        }

        const products = await res.json();
        const contentRange = res.headers.get("content-range");
        console.log(`Received ${products.length} products. Content-Range: ${contentRange}`);
        
        if (Array.isArray(products) && products.length > 0) {
            allProducts = allProducts.concat(products);
            offset += limit;
            if (products.length < limit) {
                fetchMore = false;
            }
        } else {
            fetchMore = false;
        }
    }
    
    console.log("Total fetched:", allProducts.length);
}

testFetch();
