/**
 * ============================================
 * SPREADSHEET → REPSHUB PRODUCT IMPORTER
 * ============================================
 * Imports products from the Google Spreadsheet CSV
 * into the Supabase products_clean table.
 * 
 * Usage: node import-spreadsheet.js
 */

const SUPABASE_URL = 'https://szohpkcgubckxoauspmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE';
const REST = `${SUPABASE_URL}/rest/v1`;

const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
};

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1RuT-K2KGzn98rD8tpkCD58WwT_zWY8HpBgr70c1f14A/export?format=csv&gid=0';

// ============================================
// Category mapping by product name keywords
// ============================================
function mapCategory(name) {
    if (!name) return 'accesorios';
    const n = name.toLowerCase();

    // Calzado
    if (n.includes('shoe') || n.includes('sneaker') || n.includes('dunk') ||
        n.includes('air force') || n.includes('air max') || n.includes('jordan') ||
        n.includes('yeezy') || n.includes('slides') || n.includes('slipper') ||
        n.includes('trainer') || n.includes('america\'s cup') || n.includes('gel nyc') ||
        n.includes(' tn ') || n.includes('b22') || n.includes('b30') || n.includes('ma-1')) {
        return 'calzado';
    }

    // Conjuntos (sets/tracksuits/suits) — check before ropa
    if (n.includes('set') || n.includes('tracksuit') || n.includes('suit') ||
        n.includes('t-shirt/short') || n.includes('tee/short') ||
        n.includes('t-shirt/shorts')) {
        return 'conjuntos';
    }

    // Ropa Inferior
    if (n.includes('short') || n.includes('pant') || n.includes('jean') ||
        n.includes('trouser') || n.includes('jogger') || n.includes('swim')) {
        return 'ropa-inferior';
    }

    // Ropa Superior
    if (n.includes('tee') || n.includes('t-shirt') || n.includes('jersey') ||
        n.includes('polo') || n.includes('hoodie') || n.includes('sweater') ||
        n.includes('sweatshirt') || n.includes('longsleeve') || n.includes('shirt') ||
        n.includes('hoodies') || n.includes(' sw') || n.includes('long')) {
        return 'ropa-superior';
    }

    // Accesorios
    if (n.includes('belt') || n.includes('cap') || n.includes('beanie') ||
        n.includes('watch') || n.includes('glass') || n.includes('wallet') ||
        n.includes('bag') || n.includes('bracelet') || n.includes('underwear') ||
        n.includes('bikini') || n.includes('air pods') || n.includes('cardholder')) {
        return 'accesorios';
    }

    return 'accesorios';
}

// ============================================
// Parse CNY price from strings like "CNY 125 ≈ USD 19.91"
// ============================================
function parsePriceCNY(priceStr) {
    if (!priceStr) return 0;
    // Try to match CNY followed by a number
    const match = priceStr.match(/CNY\s*([\d.]+)/i);
    if (match) return parseFloat(match[1]);
    return 0;
}

function parsePriceUSD(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.match(/USD\s*([\d.]+)/i);
    if (match) return parseFloat(match[1]);
    // Try after ≈
    const match2 = priceStr.match(/≈\s*([\d.]+)/);
    if (match2) return parseFloat(match2[1]);
    return 0;
}

// ============================================
// Extract source_url from kakobuy link
// ============================================
function extractSourceUrl(kakobuyLink) {
    if (!kakobuyLink) return '';
    // The kakobuy link contains the real URL as a query param
    try {
        const urlObj = new URL(kakobuyLink.trim());
        const innerUrl = urlObj.searchParams.get('url');
        if (innerUrl) return innerUrl;
    } catch (e) {
        // Try regex fallback
        const match = kakobuyLink.match(/url=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
    }
    return kakobuyLink.trim();
}

// ============================================
// Simple CSV line parser (handles quoted fields)
// ============================================
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

// ============================================
// MAIN
// ============================================
async function main() {
    console.log('📥 Fetching spreadsheet from Google Sheets...');

    const res = await fetch(SPREADSHEET_CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch spreadsheet: ${res.status}`);

    const csvText = await res.text();
    const lines = csvText.split('\n').map(l => l.replace(/\r/g, ''));

    // Skip header line
    const header = lines[0];
    console.log(`📋 Header: ${header}`);

    // Parse products
    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Some entries span multiple lines due to quoted fields with newlines
        // We'll handle this by detecting unclosed quotes
        let fullLine = line;
        while ((fullLine.match(/"/g) || []).length % 2 !== 0 && i + 1 < lines.length) {
            i++;
            fullLine += '\n' + lines[i];
        }

        const fields = parseCSVLine(fullLine);
        if (fields.length < 3) continue;

        const [name, priceStr, imageUrl, kakobuyLink] = fields;
        if (!name || !name.trim()) continue;

        const cleanName = name.trim();
        const precioCny = parsePriceCNY(priceStr);
        const precioUsd = parsePriceUSD(priceStr);
        const sourceUrl = extractSourceUrl(kakobuyLink || '');

        products.push({
            nombre: cleanName,
            categoria: mapCategory(cleanName),
            precio_cny: precioCny,
            precio_usd: precioUsd || precioCny * 0.159,
            imagen_url: (imageUrl || '').trim(),
            source_url: sourceUrl,
            calidad: 'budget',
            activo: true
        });
    }

    console.log(`✅ Parsed ${products.length} products from spreadsheet`);

    // Check existing products to avoid duplicates
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
            if (p.nombre) existingNames.add(p.nombre.toLowerCase().trim());
        }
        totalExisting += page.length;
        offset += PAGE_SIZE;
        if (page.length < PAGE_SIZE) break;
    }

    console.log(`📦 Found ${totalExisting} existing products in database`);

    // Filter out duplicates
    const newProducts = products.filter(p => {
        const nameExists = existingNames.has(p.nombre.toLowerCase().trim());
        const urlExists = p.source_url && existingSourceUrls.has(p.source_url);
        if (nameExists || urlExists) return false;
        return true;
    });

    const skipped = products.length - newProducts.length;

    console.log(`\n📊 Summary:`);
    console.log(`   Total from spreadsheet: ${products.length}`);
    console.log(`   Already in database: ${skipped}`);
    console.log(`   New to import: ${newProducts.length}`);

    if (newProducts.length === 0) {
        console.log('\n✅ No new products to import! All already exist.');
        return;
    }

    // Show preview of first 5
    console.log('\n📋 Preview of first 5 products to import:');
    newProducts.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.nombre} | ${p.categoria} | ¥${p.precio_cny} | img: ${p.imagen_url ? '✓' : '✗'}`);
    });

    // Insert in batches
    const BATCH_SIZE = 25;
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

        // Small delay between batches
        if (i + BATCH_SIZE < newProducts.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   ✅ Successfully imported: ${imported}`);
    if (errors > 0) console.log(`   ❌ Failed: ${errors}`);
    console.log(`   📦 Total in database now: ~${totalExisting + imported}`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
