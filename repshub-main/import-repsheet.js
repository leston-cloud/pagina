/**
 * ============================================
 * REPSHEET → REPSHUB PRODUCT IMPORTER
 * ============================================
 * Fetches all products from repsheet.net API
 * and imports them into our Supabase products_clean table.
 * 
 * Usage: node import-repsheet.js
 */

const REPSHEET_API = 'https://repsheet.net/api/storage/finds?agent=kakobuy&currency=usd';

const SUPABASE_URL = 'https://szohpkcgubckxoauspmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE';
const REST = `${SUPABASE_URL}/rest/v1`;

const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
};

// ============================================
// HELPER: Convert affiliate link → real W2C URL
// ============================================
function affiliateToW2C(affiliateLink) {
    if (!affiliateLink) return '';
    
    // Pattern: https://affiliate.repsheet.net/kakobuy/{source}/{sourceId}
    const match = affiliateLink.match(/affiliate\.repsheet\.net\/\w+\/(weidian|taobao|1688)\/(\d+)/);
    if (!match) return affiliateLink; // Return as-is if pattern doesn't match
    
    const [, source, sourceId] = match;
    
    switch (source) {
        case 'weidian':
            return `https://weidian.com/item.html?itemID=${sourceId}`;
        case 'taobao':
            return `https://item.taobao.com/item.htm?id=${sourceId}`;
        case '1688':
            return `https://detail.1688.com/offer/${sourceId}.html`;
        default:
            return affiliateLink;
    }
}

// ============================================
// HELPER: Map Repsheet categories → RepsHub categories
// ============================================
function mapCategory(repsheetCategory) {
    if (!repsheetCategory) return 'accesorios';
    
    const cat = repsheetCategory.toLowerCase();
    
    // Calzado (shoes)
    if (cat.includes('shoe') || cat.includes('sneaker') || cat.includes('boot') || 
        cat.includes('slide') || cat.includes('slipper') || cat.includes('sandal') ||
        cat.includes('footwear') || cat.includes('clog')) {
        return 'calzado';
    }
    
    // Ropa Superior (upper body)
    if (cat.includes('t-shirt') || cat.includes('tee') || cat.includes('hoodie') || 
        cat.includes('sweater') || cat.includes('jacket') || cat.includes('vest') ||
        cat.includes('polo') || cat.includes('longsleeve') || cat.includes('crewneck') ||
        cat.includes('cardigan') || cat.includes('fleece') || cat.includes('coat') ||
        cat.includes('parka') || cat.includes('puffer') || cat.includes('windbreaker') ||
        cat.includes('jersey') || cat.includes('top')) {
        return 'ropa-superior';
    }
    
    // Ropa Inferior (lower body)
    if (cat.includes('pant') || cat.includes('jean') || cat.includes('trouser') || 
        cat.includes('short') || cat.includes('sweat') || cat.includes('cargo') ||
        cat.includes('denim') || cat.includes('jogger') || cat.includes('legging')) {
        return 'ropa-inferior';
    }
    
    // Conjuntos (sets/tracksuits)
    if (cat.includes('tracksuit') || cat.includes('set') || cat.includes('suit')) {
        return 'conjuntos';
    }
    
    // Accesorios (everything else)
    return 'accesorios';
}

// ============================================
// HELPER: Convert USD price to approximate CNY
// ============================================
function usdToCny(usdPrice) {
    // Approximate exchange rate
    const rate = 7.25;
    return Math.round(usdPrice * rate * 100) / 100;
}

// ============================================
// MAIN: Fetch from Repsheet & import to Supabase
// ============================================
async function main() {
    console.log('🔄 Fetching products from Repsheet API...');
    
    // Step 1: Fetch all products from Repsheet
    const response = await fetch(REPSHEET_API);
    if (!response.ok) {
        throw new Error(`Failed to fetch Repsheet API: ${response.status}`);
    }
    
    const data = await response.json();
    const repsheetProducts = data.items;
    console.log(`✅ Fetched ${repsheetProducts.length} products from Repsheet`);
    
    // Step 2: Fetch existing products from Supabase to avoid duplicates
    console.log('🔄 Checking existing products in Supabase...');
    
    let existingSourceUrls = new Set();
    let existingNames = new Set();
    let offset = 0;
    const PAGE_SIZE = 1000;
    let totalExisting = 0;
    
    while (true) {
        const existingRes = await fetch(
            `${REST}/products_clean?select=source_url,nombre&limit=${PAGE_SIZE}&offset=${offset}`, 
            { headers: HEADERS }
        );
        
        if (!existingRes.ok) break;
        const page = await existingRes.json();
        if (page.length === 0) break;
        
        for (const p of page) {
            if (p.source_url) existingSourceUrls.add(p.source_url);
            if (p.nombre) existingNames.add(p.nombre.toLowerCase());
        }
        totalExisting += page.length;
        offset += PAGE_SIZE;
        
        if (page.length < PAGE_SIZE) break; // Last page
    }
    
    console.log(`📦 Found ${totalExisting} existing products in database`);
    
    // Step 3: Transform and filter products
    const newProducts = [];
    let skipped = 0;
    
    for (const item of repsheetProducts) {
        const w2cUrl = affiliateToW2C(item.link);
        const nombre = (item.name || '').trim();
        
        // Skip if we already have this product (by source URL or name)
        if (existingSourceUrls.has(w2cUrl) || existingNames.has(nombre.toLowerCase())) {
            skipped++;
            continue;
        }
        
        const category = item['category[0]'] || '';
        const precioCny = usdToCny(item.price || 0);
        
        newProducts.push({
            nombre: nombre,
            categoria: mapCategory(category),
            precio_cny: precioCny,
            precio_usd: item.price || 0,
            source_url: w2cUrl,
            imagen_url: item.image || '',
            calidad: 'budget', // Mandatory field with specific allowed values
            activo: true
        });
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total from Repsheet: ${repsheetProducts.length}`);
    console.log(`   Already in database: ${skipped}`);
    console.log(`   New to import: ${newProducts.length}`);
    
    if (newProducts.length === 0) {
        console.log('\n✅ No new products to import!');
        return;
    }
    
    // Step 4: Insert in batches (Supabase has limits per request)
    const BATCH_SIZE = 50;
    let imported = 0;
    let errors = 0;
    
    console.log(`\n🚀 Importing ${newProducts.length} products in batches of ${BATCH_SIZE}...`);
    
    for (let i = 0; i < newProducts.length; i += BATCH_SIZE) {
        const batch = newProducts.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(newProducts.length / BATCH_SIZE);
        
        try {
            const res = await fetch(`${REST}/products_clean`, {
                method: 'POST',
                headers: {
                    ...HEADERS,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(batch)
            });
            
            if (res.ok) {
                imported += batch.length;
                console.log(`   ✅ Batch ${batchNum}/${totalBatches}: ${batch.length} products imported`);
            } else {
                const errText = await res.text();
                errors += batch.length;
                console.error(`   ❌ Batch ${batchNum}/${totalBatches} failed: ${errText}`);
            }
        } catch (err) {
            errors += batch.length;
            console.error(`   ❌ Batch ${batchNum}/${totalBatches} error: ${err.message}`);
        }
        
        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < newProducts.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }
    
    console.log(`\n🎉 Import complete!`);
    console.log(`   ✅ Successfully imported: ${imported}`);
    if (errors > 0) console.log(`   ❌ Failed: ${errors}`);
    console.log(`   📦 Total in database: ${imported + skipped + (existingSourceUrls.size || 0)}`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
