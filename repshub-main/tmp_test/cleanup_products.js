// Script to keep only the first 45 products and delete the rest
const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";
const REST = `${SUPABASE_URL}/rest/v1`;

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

async function run() {
    // 1. Fetch ALL products ordered by created_at desc
    console.log("Fetching all products...");
    let allProducts = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        const url = `${REST}/products_clean?select=id,nombre,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
            console.error(`Error fetching: ${res.status} ${await res.text()}`);
            process.exit(1);
        }
        const data = await res.json();
        if (data.length === 0) break;
        allProducts.push(...data);
        if (data.length < limit) break;
        offset += limit;
    }

    console.log(`Total products found: ${allProducts.length}`);

    if (allProducts.length <= 45) {
        console.log("There are 45 or fewer products. Nothing to delete.");
        return;
    }

    // 2. Split: keep first 45, delete the rest
    const toKeep = allProducts.slice(0, 45);
    const toDelete = allProducts.slice(45);

    console.log(`\nKeeping ${toKeep.length} products:`);
    toKeep.forEach((p, i) => console.log(`  ${i + 1}. ${p.nombre} (${p.id})`));

    console.log(`\nWill DELETE ${toDelete.length} products:`);
    toDelete.forEach((p, i) => console.log(`  ${i + 1}. ${p.nombre} (${p.id})`));

    // Check for --confirm flag
    if (!process.argv.includes('--confirm')) {
        console.log("\n⚠️  Run with --confirm flag to actually delete.");
        console.log(`    node cleanup_products.js --confirm`);
        return;
    }

    // 3. Delete in batches of 50
    console.log(`\nDeleting ${toDelete.length} products...`);
    const batchSize = 50;
    let deleted = 0;

    for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        const ids = batch.map(p => p.id);
        
        // Use Supabase's "in" filter
        const idsParam = `(${ids.join(',')})`;
        const deleteUrl = `${REST}/products_clean?id=in.${idsParam}`;
        
        const res = await fetch(deleteUrl, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            console.error(`Error deleting batch: ${res.status} ${await res.text()}`);
        } else {
            deleted += batch.length;
            console.log(`  Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products (total: ${deleted})`);
        }
    }

    console.log(`\n✅ Done! Deleted ${deleted} products. ${toKeep.length} remain.`);
}

run().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
