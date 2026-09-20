
const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

async function testSupabase() {
    console.log("1. Insertando producto de prueba...");
    const testProduct = {
        nombre: "Test Delete Product",
        categoria: "accesorios",
        precio_cny: 10,
        precio_usd: 1.5,
        calidad: "budget",
        source_url: "https://test.com",
        imagen_url: "https://test.com/img.jpg",
        activo: true
    };

    let insertRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testProduct)
    });
    
    if (!insertRes.ok) {
        console.error("Fallo al insertar:", await insertRes.text());
        return;
    }
    
    const insertedObj = await insertRes.json();
    const id = insertedObj[0].id;
    console.log("Insertado con ID:", id);

    console.log("2. Verificando si existe...");
    let getRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean?id=eq.${id}`, { headers });
    let getObj = await getRes.json();
    console.log(`Encontrados: ${getObj.length}`);

    console.log(`3. Intentando ELIMINAR el producto ${id}...`);
    let deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean?id=eq.${id}`, {
        method: 'DELETE',
        headers
    });
    
    if (!deleteRes.ok) {
        console.error("Fallo al eliminar (Error HTTP):", await deleteRes.text());
    } else {
        const delRet = await deleteRes.json();
        console.log("Respuesta de eliminacion:", delRet);
        if (delRet.length === 0) {
            console.log("ADVERTENCIA: La respuesta HTTP fue OK, pero no se eliminó ninguna fila. (Posible bloqueo por RLS)");
        } else {
            console.log("EXITO: Producto eliminado.");
        }
    }
    
    console.log("4. Verificando si sigue existiendo...");
    let getFinalRes = await fetch(`${SUPABASE_URL}/rest/v1/products_clean?id=eq.${id}`, { headers });
    let getFinalObj = await getFinalRes.json();
    console.log(`Encontrados tras eliminar: ${getFinalObj.length}`);
}

testSupabase();
