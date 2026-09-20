/**
 * ================================================================
 * BULK UPDATE: Limpiar affcodes de moonreps en toda la DB de Supabase
 * ================================================================
 * 
 * CÓMO EJECUTAR:
 *   1. Abrí la consola del navegador en tu sitio (F12 → Console)
 *   2. Copiá y pegá TODO este script
 *   3. Presioná Enter
 *   4. El script va a escanear todos los productos y actualizar
 *      los source_url que tengan affcodes ajenos
 * 
 * TAMBIÉN PODÉS ejecutarlo desde Node.js:
 *   node tmp_test/bulk_clean_affcodes.js
 * ================================================================
 */

const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";
const REST = `${SUPABASE_URL}/rest/v1`;

const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

// Foreign affiliate patterns to detect in source_url
const FOREIGN_PATTERNS = [
    'affcode=moonreps',
    'affcode=argenreps',
    'inviteCode=moonreps',
    'ref=moonreps',
    'invitation_code=moonreps',
    'promotionCode=moonreps',
    // Generic: any affcode that isn't gonza
    /affcode=(?!gonza\b)[^&]+/i,
    /inviteCode=(?!gonza\b)[^&]+/i,
    /invitation_code=(?!gonza\b)[^&]+/i,
    /promotionCode=(?!gonza\b)[^&]+/i,
    /ref=(?!gonza\b)[^&]+/i,
];

// Extract the base platform URL from any agent link
function extractBaseUrl(url) {
    if (!url || typeof url !== 'string') return null;

    // Kakobuy: extract url= parameter
    if (url.includes('kakobuy.com')) {
        const match = url.match(/[?&]url=([^&]+)/);
        if (match && match[1]) {
            try {
                let decoded = decodeURIComponent(match[1]);
                if (decoded.includes('%')) {
                    try { decoded = decodeURIComponent(decoded); } catch (_) {}
                }
                if (decoded.includes('weidian.com') || decoded.includes('1688.com') || decoded.includes('taobao.com')) {
                    return decoded;
                }
            } catch (_) {}
        }
    }

    // OopBuy: https://oopbuy.com/product/weidian/123456
    const oopMatch = url.match(/oopbuy\.com\/product\/([^/]+)\/(\d+)/);
    if (oopMatch) {
        const platform = oopMatch[1].toLowerCase();
        const id = oopMatch[2];
        if (platform === 'weidian') return `https://weidian.com/item.html?itemID=${id}`;
        if (platform === '1688') return `https://detail.1688.com/offer/${id}.html`;
        if (platform === 'taobao') return `https://item.taobao.com/item.htm?id=${id}`;
    }

    // MuleBuy: https://mulebuy.com/product?id=123&platform=WEIDIAN
    const muleMatch = url.match(/mulebuy\.com\/product\?id=(\d+)&platform=([^&]+)/);
    if (muleMatch) {
        const id = muleMatch[1];
        const platform = muleMatch[2];
        if (platform === 'WEIDIAN') return `https://weidian.com/item.html?itemID=${id}`;
        if (platform === 'ALI_1688') return `https://detail.1688.com/offer/${id}.html`;
        if (platform === 'TAOBAO') return `https://item.taobao.com/item.htm?id=${id}`;
    }

    // HubBuy: extract url= parameter
    if (url.includes('hubbuycn.com') || url.includes('hipobuy')) {
        const match = url.match(/url=([^=&]+)/);
        if (match) {
            try { return decodeURIComponent(match[1]); } catch (_) { return match[1]; }
        }
    }

    // CssBuy: can't determine platform, skip
    if (url.includes('cssbuy.com')) return null;

    // Direct platform link
    if (url.includes('weidian.com') || url.includes('1688.com') || url.includes('taobao.com')) {
        // Strip any affiliate params
        try {
            const parsed = new URL(url);
            ['affcode', 'ref', 'inviteCode', 'invitation_code', 'promotionCode', 'utm_source'].forEach(p => parsed.searchParams.delete(p));
            return parsed.toString();
        } catch (_) {
            return url;
        }
    }

    return null;
}

// Check if a source_url needs cleaning
function needsCleaning(url) {
    if (!url || typeof url !== 'string') return false;
    for (const pattern of FOREIGN_PATTERNS) {
        if (pattern instanceof RegExp) {
            if (pattern.test(url)) return true;
        } else {
            if (url.includes(pattern)) return true;
        }
    }
    // Also clean if it's an agent link (kakobuy/oopbuy/etc) — normalize to base URL
    if (url.includes('kakobuy.com') || url.includes('oopbuy.com') || url.includes('mulebuy.com') ||
        url.includes('hubbuycn.com') || url.includes('cssbuy.com') || url.includes('hipobuy')) {
        return true;
    }
    return false;
}

async function bulkCleanAffcodes() {
    console.log('🔍 Scanning all products in Supabase...');
    
    // Fetch ALL products
    let allProducts = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        const res = await fetch(`${REST}/products_clean?select=id,source_url&order=created_at.desc&limit=${limit}&offset=${offset}`, { headers });
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        const data = await res.json();
        if (data.length === 0) break;
        allProducts.push(...data);
        if (data.length < limit) break;
        offset += limit;
    }

    console.log(`📦 Total products: ${allProducts.length}`);

    // Find products that need cleaning
    const dirtyProducts = allProducts.filter(p => needsCleaning(p.source_url));
    console.log(`🧹 Products with foreign affcodes or agent links: ${dirtyProducts.length}`);

    if (dirtyProducts.length === 0) {
        console.log('✅ All products are clean! Nothing to update.');
        return;
    }

    // Preview first 10
    console.log('\n📋 Preview (first 10):');
    dirtyProducts.slice(0, 10).forEach(p => {
        const cleaned = extractBaseUrl(p.source_url);
        console.log(`  ID: ${p.id}`);
        console.log(`    BEFORE: ${p.source_url}`);
        console.log(`    AFTER:  ${cleaned || '(skipped - cannot extract)'}`);
        console.log('');
    });

    // Ask for confirmation
    const shouldProceed = typeof window !== 'undefined' 
        ? confirm(`¿Actualizar ${dirtyProducts.length} productos? (esto limpia los affcodes de moonreps)`)
        : true; // Auto-proceed in Node.js

    if (!shouldProceed) {
        console.log('❌ Cancelled by user.');
        return;
    }

    // Process updates in batches of 20
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const BATCH_SIZE = 20;

    for (let i = 0; i < dirtyProducts.length; i += BATCH_SIZE) {
        const batch = dirtyProducts.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (product) => {
            const cleanUrl = extractBaseUrl(product.source_url);
            
            if (!cleanUrl) {
                skipped++;
                return;
            }

            try {
                const res = await fetch(`${REST}/products_clean?id=eq.${product.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ source_url: cleanUrl })
                });

                if (res.ok) {
                    updated++;
                } else {
                    errors++;
                    console.warn(`  ⚠️ Error updating ${product.id}: ${res.status}`);
                }
            } catch (err) {
                errors++;
                console.error(`  ❌ Error for ${product.id}:`, err.message);
            }
        });

        await Promise.all(promises);
        
        // Progress log
        const progress = Math.min(i + BATCH_SIZE, dirtyProducts.length);
        console.log(`  Progress: ${progress}/${dirtyProducts.length} (${updated} updated, ${skipped} skipped, ${errors} errors)`);
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < dirtyProducts.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log('\n========================================');
    console.log(`✅ BULK UPDATE COMPLETE`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped} (couldn't extract base URL)`);
    console.log(`   Errors:  ${errors}`);
    console.log('========================================');
    console.log('🔄 Reload the page to see the changes.');
}

// Auto-execute
bulkCleanAffcodes().catch(err => console.error('💥 Bulk update failed:', err));
