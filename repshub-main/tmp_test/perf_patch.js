const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');
const norm = content.replace(/\r\n/g, '\n');
let updated = norm;

// ============================================================
// 1. Cache TTL: 60s → 10 minutes
// ============================================================
const old_ttl = 'const CATALOG_CACHE_TTL_MS = 60 * 1000;';
const new_ttl  = 'const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos (era 60 segundos)';
if (updated.includes(old_ttl)) {
    updated = updated.replace(old_ttl, new_ttl);
    console.log('[OK] Cache TTL updated to 10 minutes');
} else {
    console.warn('[MISS] Cache TTL line not found!');
}

// ============================================================
// 2. Supabase: select only needed columns (reduce payload ~60%)
// ============================================================
const old_query = '`${SUPABASE_REST_URL}/products_clean?select=*&activo=eq.true&source_url=not.is.null&source_url=neq.&order=created_at.desc`';
const new_query  = '`${SUPABASE_REST_URL}/products_clean?select=id,nombre,categoria,descripcion,calidad,precio_cny,imagen_url,image_url,kakobuy_image_url,source_url,created_at,activo,qc_images&activo=eq.true&source_url=not.is.null&source_url=neq.&order=created_at.desc`';
if (updated.includes(old_query)) {
    updated = updated.replace(old_query, new_query);
    console.log('[OK] Supabase query now selects only needed columns');
} else {
    console.warn('[MISS] Supabase query string not found!');
}

// ============================================================
// 3. Local catalog: no-store → default (use HTTP cache)
// ============================================================
const old_local = "cache: 'no-store'";
const new_local  = "cache: 'default' // Usar HTTP cache del navegador";
if (updated.includes(old_local)) {
    updated = updated.replace(old_local, new_local);
    console.log('[OK] Local catalog fetch now uses HTTP cache');
} else {
    console.warn('[MISS] no-store not found');
}

// ============================================================
// 4. Add localStorage persistence (stale-while-revalidate)
//    Insert after catalogCache declaration
// ============================================================
const CACHE_STORAGE_KEY = '__rh_catalog_v2';

const old_cache_decl = `let catalogCache = {
    data: null,
    expiresAt: 0,
    promise: null
};`;

const new_cache_decl = `let catalogCache = {
    data: null,
    expiresAt: 0,
    promise: null
};

/* ---- localStorage persistence helpers (stale-while-revalidate) ---- */
const LS_CATALOG_KEY = '__rh_catalog_v2';
const LS_CATALOG_TTL = 24 * 60 * 60 * 1000; // 24 horas

function saveCatalogToLS(products) {
    try {
        const payload = JSON.stringify({ ts: Date.now(), data: products });
        // Comprimir guardando solo los campos que necesitamos para mostrar
        localStorage.setItem(LS_CATALOG_KEY, payload);
    } catch (e) {
        // QuotaExceeded - no bloquear
        try { localStorage.removeItem(LS_CATALOG_KEY); } catch(_) {}
    }
}

function loadCatalogFromLS() {
    try {
        const raw = localStorage.getItem(LS_CATALOG_KEY);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (!Array.isArray(data) || data.length === 0) return null;
        if (Date.now() - ts > LS_CATALOG_TTL) {
            localStorage.removeItem(LS_CATALOG_KEY);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
}`;

if (updated.includes(old_cache_decl)) {
    updated = updated.replace(old_cache_decl, new_cache_decl);
    console.log('[OK] localStorage persistence helpers added');
} else {
    console.warn('[MISS] catalogCache declaration not found');
}

// ============================================================
// 5. Patch getActiveCatalogProducts to use LS as instant cache
// ============================================================
const old_getActive = `async function getActiveCatalogProducts(options = {}) {
    const { forceRefresh = false } = options;
    const now = Date.now();

    if (!forceRefresh && catalogCache.data && catalogCache.expiresAt > now) {
        return [...catalogCache.data];
    }

    if (!forceRefresh && catalogCache.promise) {
        const cachedProducts = await catalogCache.promise;
        return [...cachedProducts];
    }

    const loadPromise = (async () => {
        try {
            const [supabaseProducts, localProducts] = await Promise.all([
                fetchSupabaseCatalogProducts().catch(error => {
                    console.error('Error loading Supabase catalog:', error);
                    return [];
                }),
                fetchLocalCatalogProducts()
            ]);

            const mergedProducts = [];
            const dedupMap = new Map();

            [...supabaseProducts, ...localProducts].forEach(product => {
                const key = buildProductDedupKey(product);
                dedupMap.set(key, product);
            });

            dedupMap.forEach(product => {
                mergedProducts.push(product);
            });

            mergedProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            catalogCache.data = mergedProducts;
            catalogCache.expiresAt = Date.now() + CATALOG_CACHE_TTL_MS;

            return mergedProducts;
        } catch (error) {
            console.error('Error building active catalog products:', error);
            catalogCache.data = null;
            catalogCache.expiresAt = 0;
            throw error;
        } finally {
            catalogCache.promise = null;
        }
    })();

    catalogCache.promise = loadPromise;
    const products = await loadPromise;
    return [...products];
}`;

const new_getActive = `async function getActiveCatalogProducts(options = {}) {
    const { forceRefresh = false } = options;
    const now = Date.now();

    // 1. Hot in-memory cache (5-10 min TTL)
    if (!forceRefresh && catalogCache.data && catalogCache.expiresAt > now) {
        return [...catalogCache.data];
    }

    // 2. Deduplicate concurrent fetches
    if (!forceRefresh && catalogCache.promise) {
        const cachedProducts = await catalogCache.promise;
        return [...cachedProducts];
    }

    // 3. Instant display from localStorage while fetching fresh data
    if (!forceRefresh) {
        const lsProducts = loadCatalogFromLS();
        if (lsProducts && lsProducts.length > 0) {
            // Return stale data immediately, then revalidate in background
            catalogCache.data = lsProducts;
            catalogCache.expiresAt = now + 30000; // keep for 30s while fresh fetch runs

            // Kick off background refresh (won't block the caller)
            (async () => {
                try {
                    const [supabaseProducts, localProducts] = await Promise.all([
                        fetchSupabaseCatalogProducts().catch(() => []),
                        fetchLocalCatalogProducts()
                    ]);
                    const merged = buildMergedCatalog(supabaseProducts, localProducts);
                    catalogCache.data = merged;
                    catalogCache.expiresAt = Date.now() + CATALOG_CACHE_TTL_MS;
                    saveCatalogToLS(merged);
                } catch (e) {
                    // Keep stale data
                }
            })();

            return [...lsProducts];
        }
    }

    const loadPromise = (async () => {
        try {
            const [supabaseProducts, localProducts] = await Promise.all([
                fetchSupabaseCatalogProducts().catch(error => {
                    console.error('Error loading Supabase catalog:', error);
                    return [];
                }),
                fetchLocalCatalogProducts()
            ]);

            const mergedProducts = buildMergedCatalog(supabaseProducts, localProducts);

            catalogCache.data = mergedProducts;
            catalogCache.expiresAt = Date.now() + CATALOG_CACHE_TTL_MS;

            // Persist for next page load
            saveCatalogToLS(mergedProducts);

            return mergedProducts;
        } catch (error) {
            console.error('Error building active catalog products:', error);
            catalogCache.data = null;
            catalogCache.expiresAt = 0;
            throw error;
        } finally {
            catalogCache.promise = null;
        }
    })();

    catalogCache.promise = loadPromise;
    const products = await loadPromise;
    return [...products];
}

// Extracted helper so both code paths share the same merge logic
function buildMergedCatalog(supabaseProducts, localProducts) {
    const dedupMap = new Map();
    [...supabaseProducts, ...localProducts].forEach(product => {
        const key = buildProductDedupKey(product);
        dedupMap.set(key, product);
    });
    const merged = [];
    dedupMap.forEach(product => merged.push(product));
    merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return merged;
}`;

if (updated.includes(old_getActive)) {
    updated = updated.replace(old_getActive, new_getActive);
    console.log('[OK] getActiveCatalogProducts patched with stale-while-revalidate');
} else {
    console.warn('[MISS] getActiveCatalogProducts function not found!');
}

// ============================================================
// Save
// ============================================================
content = updated.replace(/\n/g, '\r\n');
fs.writeFileSync(scriptPath, content, 'utf8');

// Verify
const final = fs.readFileSync(scriptPath, 'utf8');
console.log('\n=== Verification ===');
console.log('10 min TTL:', final.includes('10 * 60 * 1000'));
console.log('Selective columns:', final.includes('id,nombre,categoria'));
console.log('HTTP cache for local:', final.includes("cache: 'default'"));
console.log('LS helpers:', final.includes('saveCatalogToLS'));
console.log('Stale-while-revalidate:', final.includes('stale data immediately'));
console.log('buildMergedCatalog:', final.includes('buildMergedCatalog'));
console.log('Done!');
