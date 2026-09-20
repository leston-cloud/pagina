// Use built-in fetch
const ARGEN_URL = "https://qwbmrpxcnrydxgilzxiz.supabase.co/rest/v1/productos?select=*";
const ARGEN_KEY = "sb_publishable_X7R7U4WEXVBo4bgLl901Lg_CDlt3Ocz";

const HUB_URL = "https://szohpkcgubckxoauspmr.supabase.co/rest/v1/products_clean";
const HUB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

// Mapping cssbuy links back to source urls roughly
// CSSBuy links format: https://www.cssbuy.com/item-micro-6538965215.html -> weidian
// https://www.cssbuy.com/item-725458142345.html -> taobao or 1688 (usually taobao)
// https://www.cssbuy.com/item-1688-6758493021.html -> 1688
function guessSourceUrl(cssUrl) {
    if (!cssUrl) return "";
    const match = cssUrl.match(/item-(micro-|1688-)?(\d+)/i);
    if (!match) return cssUrl; // Fallback to raw

    const prefix = match[1] ? match[1].toLowerCase() : "";
    const id = match[2];

    if (prefix.includes('micro')) return `https://weidian.com/item.html?itemID=${id}`;
    if (prefix.includes('1688')) return `https://detail.1688.com/offer/${id}.html`;
    return `https://item.taobao.com/item.htm?id=${id}`;
}

async function run() {
    console.log("Fetching existing 45 products from RepsHub to find oldest date...");
    const hubRes = await fetch(`${HUB_URL}?select=created_at&order=created_at.asc&limit=1`, {
        headers: { "apikey": HUB_KEY, "Authorization": `Bearer ${HUB_KEY}` }
    });
    const hubData = await hubRes.json();
    
    // We want all new products to be older than oldestHubDate
    // So they appear AFTER the 45 existing ones when sorting DESC
    let oldestHubDate = new Date();
    if (hubData && hubData.length > 0 && hubData[0].created_at) {
        oldestHubDate = new Date(hubData[0].created_at);
        console.log(`Oldest Hub Date: ${oldestHubDate.toISOString()}`);
    }
    
    console.log("\nFetching ALL Argenreps products...");
    let argenProducts = [];
    let offset = 0;
    const limit = 1000;
    while(true) {
        const url = `${ARGEN_URL}&limit=${limit}&offset=${offset}`;
        const res = await fetch(url, { headers: { "apikey": ARGEN_KEY, "Authorization": `Bearer ${ARGEN_KEY}` }});
        const data = await res.json();
        if (data.length === 0) break;
        argenProducts.push(...data);
        if (data.length < limit) break;
        offset += limit;
    }
    
    console.log(`Found ${argenProducts.length} Argenreps products.`);
    
    // Prepare inserts
    const inserts = [];
    
    // Base time for the new products - offset by 1 day from the oldest hub product
    // And subtract 1 minute for each product to maintain some order among them
    const baseTimeMs = oldestHubDate.getTime() - (24 * 60 * 60 * 1000); 
    
    for (let i = 0; i < argenProducts.length; i++) {
        const p = argenProducts[i];
        
        // Reverse engineer source url
        const sourceUrl = guessSourceUrl(p.link_cssbuy);
        
        // Categoria mapping roughly
        let cat = p.categoria ? p.categoria.toLowerCase() : "accesorios";
        if (cat.includes("abrigo") || cat.includes("hoodie") || cat.includes("remera") || cat.includes("pantalon") || cat.includes("short")) {
            // Keep specific, or map to RepsHub's categories:
            // RepsHub: calzado, ropa-superior, ropa-inferior, accesorios, conjuntos
            if (cat.includes("zapatilla") || cat.includes("calzado")) cat = "calzado";
            else if (cat.includes("remera") || cat.includes("abrigo") || cat.includes("buzo")) cat = "ropa-superior";
            else if (cat.includes("pantalon") || cat.includes("short")) cat = "ropa-inferior";
            else if (cat.includes("conjunto")) cat = "conjuntos";
            else cat = "accesorios";
        } else if (cat.includes("zapatilla")) {
            cat = "calzado";
        }
        
        // Create an older date for each
        const fakeDate = new Date(baseTimeMs - (i * 60 * 1000)).toISOString();
        
        inserts.push({
            nombre: p.nombre || "Producto",
            categoria: cat,
            precio_cny: parseFloat(p.precio) || 0,
            precio_usd: (parseFloat(p.precio) || 0) * 0.155, // roughly 1 CNY = 0.155 USD
            calidad: "budget",
            imagen_url: p.imagen || "",
            source_url: sourceUrl,
            activo: p.link_activo !== false,
            destacado: false, // Don't make imported ones recommended automatically
            created_at: fakeDate
        });
    }
    
    console.log("Sample insert:", inserts[0]);
    
    if (!process.argv.includes('--confirm')) {
        console.log(`\nReady to insert ${inserts.length} products.`);
        console.log("Run with --confirm to execute.");
        return;
    }
    
    console.log(`\nInserting ${inserts.length} products...`);
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const res = await fetch(HUB_URL, {
            method: 'POST',
            headers: { 
                "apikey": HUB_KEY, 
                "Authorization": `Bearer ${HUB_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(batch)
        });
        
        if (!res.ok) {
            console.error(`Error inserting batch: ${res.status} ${await res.text()}`);
        } else {
            inserted += batch.length;
            console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products (total: ${inserted})`);
        }
    }
    
    console.log(`\n✅ Done! Inserted ${inserted} products.`);
}

run().catch(console.error);
