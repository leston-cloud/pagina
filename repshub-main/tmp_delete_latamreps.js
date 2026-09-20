const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function run() {
    const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };

    const fetchUrl = `${SUPABASE_URL}/rest/v1/products_clean?select=id,imagen_url,nombre&imagen_url=ilike.*latamreps*`;
    console.log("Buscando productos con latamreps en la URL de la imagen...");
    
    let res = await fetch(fetchUrl, { headers });
    let data = await res.json();
    
    if (res.ok) {
        console.log(`Se encontraron ${data.length} productos.`);
        if (data.length > 0) {
            console.log("Ejemplo ID: ", data[0].id);
            
            const deleteUrl = `${SUPABASE_URL}/rest/v1/products_clean?imagen_url=ilike.*latamreps*`;
            console.log("Eliminando...");
            
            let delRes = await fetch(deleteUrl, { 
                method: 'DELETE',
                headers 
            });
            
            if (delRes.ok) {
                console.log("Eliminados correctamente.");
            } else {
                const txt = await delRes.text();
                console.error("Error al eliminar:", txt);
            }
        }
    } else {
        console.log("Error consultando:", data);
    }
}

run();
