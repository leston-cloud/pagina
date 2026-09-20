const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

async function cleanLeftovers() {
    console.log("Buscando productos de prueba perdidos...");
    let getRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean?nombre=eq.Test Delete Product`, { headers });
    let leftover = await getRes.json();
    
    if (leftover.length > 0) {
        console.log(`Se encontraron ${leftover.length} productos residuales. Eliminando...`);
        for (const p of leftover) {
            let delRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean?id=eq.${p.id}`, { method: 'DELETE', headers });
            if (delRes.ok) {
                console.log(`-> Eliminado: ${p.id}`);
            } else {
                console.log(`X Fallo al eliminar: ${p.id}`);
            }
        }
        console.log("Limpieza completada.");
    } else {
        console.log("No se devolvió ninguno.");
    }
}
cleanLeftovers();
