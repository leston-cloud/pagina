const ARGEN_URL = "https://qwbmrpxcnrydxgilzxiz.supabase.co/rest/v1/productos?select=nombre,imagen,fotos";
const ARGEN_KEY = "sb_publishable_X7R7U4WEXVBo4bgLl901Lg_CDlt3Ocz";

const HUB_URL = "https://szohpkcgubckxoauspmr.supabase.co/rest/v1/products_clean";
const HUB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function run() {
    let argenProducts = [];
    let offset = 0;
    while(true) {
        const res = await fetch(`${ARGEN_URL}&limit=1000&offset=${offset}`, { headers: { apikey: ARGEN_KEY, Authorization: `Bearer ${ARGEN_KEY}` }});
        const data = await res.json();
        if (data.length === 0) break;
        argenProducts.push(...data);
        offset += 1000;
    }
    
    let hubProducts = [];
    offset = 0;
    while(true) {
        const res = await fetch(`${HUB_URL}?select=id,nombre,imagen_url&limit=1000&offset=${offset}`, { headers: { apikey: HUB_KEY, Authorization: `Bearer ${HUB_KEY}` }});
        const data = await res.json();
        if (data.length === 0) break;
        hubProducts.push(...data);
        offset += 1000;
    }

    let updates = 0;
    const batch = [];
    
    for (const hp of hubProducts) {
        const ap = argenProducts.find(x => x.nombre === hp.nombre);
        if (!ap) continue;
        
        let fotosArr = [];
        try { if (ap.fotos) fotosArr = JSON.parse(ap.fotos); } catch(e) {}
        
        if (fotosArr && Array.isArray(fotosArr) && fotosArr.length > 1) {
            // Transform small/square to medium
            const transformed = fotosArr.map(x => x.replace(/\/(small|square)\./, '/medium.'));
            
            // Unique
            const uniqueFotos = transformed.filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
            if (uniqueFotos.length <= 1) continue;
            
            const newUrl = uniqueFotos.join(',');
            
            if (hp.imagen_url !== newUrl) {
                batch.push(fetch(`${HUB_URL}?id=eq.${hp.id}`, {
                    method: 'PATCH',
                    headers: { "apikey": HUB_KEY, "Authorization": `Bearer ${HUB_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ imagen_url: newUrl })
                }));
                updates++;
            }
        }
    }
    
    console.log(`Executing ${batch.length} updates...`);
    // execute in batches of 50
    for(let i = 0; i < batch.length; i += 50) {
        await Promise.all(batch.slice(i, i+50));
        console.log(`Updated ${i + 50}`);
    }
    
    console.log(`Done! Updated ${updates} products.`);
}
run().catch(console.error);
