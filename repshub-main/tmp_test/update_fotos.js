const ARGEN_URL = "https://qwbmrpxcnrydxgilzxiz.supabase.co/rest/v1/productos?select=nombre,imagen,fotos";
const ARGEN_KEY = "sb_publishable_X7R7U4WEXVBo4bgLl901Lg_CDlt3Ocz";

const HUB_URL = "https://szohpkcgubckxoauspmr.supabase.co/rest/v1/products_clean";
const HUB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function run() {
    console.log("Fetching ALL Argenreps products...");
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
    
    console.log("Fetching ALL Hub products...");
    let hubProducts = [];
    offset = 0;
    while(true) {
        const url = `${HUB_URL}?select=id,nombre,imagen_url&limit=${limit}&offset=${offset}`;
        const res = await fetch(url, { headers: { "apikey": HUB_KEY, "Authorization": `Bearer ${HUB_KEY}` }});
        const data = await res.json();
        if (data.length === 0) break;
        hubProducts.push(...data);
        if (data.length < limit) break;
        offset += limit;
    }
    console.log(`Found ${hubProducts.length} Hub products.`);

    let updates = 0;
    for (const hp of hubProducts) {
        const ap = argenProducts.find(x => x.nombre === hp.nombre);
        if (!ap) continue;
        
        let fotosArr = [];
        try {
            if (ap.fotos) fotosArr = JSON.parse(ap.fotos);
        } catch(e) {}
        
        // Sometimes fotos is empty, sometimes it has 1, sometimes 30.
        // We only want to update if it has > 1 image, and the first image is the same as we have (or whatever)
        if (fotosArr && Array.isArray(fotosArr) && fotosArr.length > 1) {
            // Keep up to 6 images to avoid massive strings, filter out small/square ones if possible
            const bestFotos = fotosArr.filter(x => !x.includes('small') && !x.includes('square')).slice(0, 6);
            if (bestFotos.length === 0) continue; // fallback
            
            // Join them
            const newUrl = bestFotos.join(',');
            
            if (hp.imagen_url !== newUrl) {
                // Update!
                const res = await fetch(`${HUB_URL}?id=eq.${hp.id}`, {
                    method: 'PATCH',
                    headers: { 
                        "apikey": HUB_KEY, 
                        "Authorization": `Bearer ${HUB_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ imagen_url: newUrl })
                });
                if (res.ok) {
                    updates++;
                    if (updates % 50 === 0) console.log(`Updated ${updates} products...`);
                }
            }
        }
    }
    
    console.log(`Done! Updated ${updates} products with multiple photos.`);
}
run().catch(console.error);
