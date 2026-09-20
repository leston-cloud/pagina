// Use built-in fetch
const HUB_URL = "https://szohpkcgubckxoauspmr.supabase.co/rest/v1/products_clean";
const HUB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function testImages() {
    const res = await fetch(`${HUB_URL}?select=nombre,imagen_url&calidad=eq.budget&limit=10`, {
        headers: { apikey: HUB_KEY, Authorization: 'Bearer ' + HUB_KEY }
    });
    const products = await res.json();

    for (const p of products) {
        if (!p.imagen_url) {
            console.log(`[EMPTY] ${p.nombre}`);
            continue;
        }

        try {
            const imgRes = await fetch(p.imagen_url, {
                method: 'HEAD',
                headers: { 'Referer': '' }
            });
            console.log(`[${imgRes.status}] ${p.imagen_url} - ${p.nombre}`);
        } catch (e) {
            console.log(`[ERROR] ${p.imagen_url} - ${e.message}`);
        }
    }
}
testImages();
