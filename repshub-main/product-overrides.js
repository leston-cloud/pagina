(function () {
  const LOCAL_PLACEHOLDER = 'images/placeholder-product.svg';
  const FALLBACK_SEPARATOR = '||';
  const KAKOBUY_FIELDS = [
    'kakobuy_image_url',
    'kakobuy_image',
    'kakobuyImageUrl',
    'kakobuyImage',
    'image_kakobuy',
    'image_url_kakobuy',
    'product_image_url',
    'product_image',
    'primary_image_url',
    'primary_image',
    'main_image_url',
    'main_image',
    'item_image_url',
    'item_image',
    'item_img',
    'cover_image_url',
    'cover_image'
  ];
  const FALLBACK_FIELDS = [
    'supabase_image_url',
    'imagen_url',
    'image_url',
    'image',
    'imagen'
  ];
  const INVALID_KAKOBUY_MARKERS = [
    'purchase-at-the-new-link',
    'purchase%20at%20the%20new%20link',
    'purchase at the new link',
    'new-link',
    'placeholder',
    'banner',
    'default',
    'notice',
    'coming-soon',
    'coming_soon',
    'update-link',
    'empty'
  ];
  const HOME_FALLBACKS = [
    {
      category: 'Ruta rapida',
      name: 'Entrar por calzado',
      detail: 'Jordan, Nike, Adidas y mas pares buscados.',
      href: 'productos.html?category=calzado',
      label: 'Calzado',
      background: '#f8e7e7'
    },
    {
      category: 'Ruta rapida',
      name: 'Ver ropa superior',
      detail: 'Remeras, hoodies y sweaters para arrancar.',
      href: 'productos.html?category=ropa-superior',
      label: 'Ropa',
      background: '#f4f2ff'
    },
    {
      category: 'Ruta rapida',
      name: 'Explorar accesorios',
      detail: 'Bolsos, lentes, belts y extras del haul.',
      href: 'productos.html?category=accesorios',
      label: 'Accesorios',
      background: '#eef7f1'
    },
    {
      category: 'Ruta rapida',
      name: 'Abrir catalogo completo',
      detail: 'Entrar al listado general y filtrar desde ahi.',
      href: 'productos.html',
      label: 'Catalogo',
      background: '#f5f5f5'
    }
  ];

  const originalNormalizeCatalogProduct = window.normalizeCatalogProduct;
  const escapeText = typeof window.escapeHtml === 'function'
    ? window.escapeHtml
    : (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  function pickFirstNonEmptyFieldValue(source, fieldNames) {
    if (!source || typeof source !== 'object') return '';

    for (const fieldName of fieldNames) {
      const value = source[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  function normalizeRemoteImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    if (trimmedUrl.includes('yupoo.com') && !trimmedUrl.includes('/api/imag')) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const proxyBase = isLocal ? 'https://argenreps.vercel.app' : '';
        const proxyPath = isLocal ? '/api/imagen' : '/api/image';
        return `${proxyBase}${proxyPath}?url=${encodeURIComponent(trimmedUrl)}`;
    }

    if (typeof window.normalizeImgurUrl === 'function') {
      return window.normalizeImgurUrl(trimmedUrl);
    }
    return trimmedUrl;
  }

  function isLikelyRenderableImageUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const normalizedUrl = url.trim();
    if (!normalizedUrl) return false;
    if (normalizedUrl.startsWith('/')) return true;
    if (/^data:image\//i.test(normalizedUrl)) return true;
    if (!/^https?:\/\//i.test(normalizedUrl)) return false;

    const lowerUrl = normalizedUrl.toLowerCase();
    if (
      lowerUrl.includes('/item/details') ||
      lowerUrl.includes('/product/item') ||
      lowerUrl.includes('/product/details')
    ) {
      return false;
    }

    if (/\.(html?|php|aspx?)(?:$|[?#])/i.test(lowerUrl)) {
      return false;
    }

    return true;
  }

  function getValidKakobuyProductImage(url) {
    const normalizedUrl = normalizeRemoteImageUrl(url);
    if (!normalizedUrl || !isLikelyRenderableImageUrl(normalizedUrl)) return '';

    const lowerUrl = normalizedUrl.toLowerCase();
    if (INVALID_KAKOBUY_MARKERS.some((marker) => lowerUrl.includes(marker))) {
      return '';
    }

    return normalizedUrl;
  }

  function getValidFallbackProductImage(url) {
    const normalizedUrl = normalizeRemoteImageUrl(url);
    if (!normalizedUrl || !isLikelyRenderableImageUrl(normalizedUrl)) return '';
    return normalizedUrl;
  }

  function resolveProductImageSources(product) {
    const rawKakobuy = pickFirstNonEmptyFieldValue(product, KAKOBUY_FIELDS);
    const rawFallback = pickFirstNonEmptyFieldValue(product, FALLBACK_FIELDS);
    
    const sources = [];
    if (rawKakobuy) {
        rawKakobuy.split(',').forEach(s => {
            const url = s.trim();
            const valid = getValidKakobuyProductImage(url);
            if (valid) {
                sources.push(valid);
                // Fallbacks para Yupoo
                if (url.includes('yupoo.com')) {
                    // Fallback 1: Weserv (sometimes bypasses if Vercel is blocked)
                    sources.push(`https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&output=webp`);
                    // Fallback 2: Jetpack
                    sources.push(`https://i0.wp.com/${url.replace(/^https?:\/\//, '')}`);
                }
            }
        });
    }
    if (rawFallback) {
        rawFallback.split(',').forEach(s => {
            const url = s.trim();
            const valid = getValidFallbackProductImage(url);
            if (valid) {
                sources.push(valid);
                // Fallbacks para Yupoo
                if (url.includes('yupoo.com')) {
                    // Fallback 1: Weserv
                    sources.push(`https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&output=webp`);
                    // Fallback 2: Jetpack
                    sources.push(`https://i0.wp.com/${url.replace(/^https?:\/\//, '')}`);
                }
            }
        });
    }

    const uniqueSources = sources.filter((source, index, array) => source && array.indexOf(source) === index);
    if (uniqueSources.length === 0) uniqueSources.push(LOCAL_PLACEHOLDER);
    return uniqueSources;
  }

  function buildImageFallbackAttribute(imageSources) {
    return imageSources.slice(1).join(FALLBACK_SEPARATOR);
  }

  function handleProductImageError(imgElement) {
    if (!imgElement) return;

    const fallbackQueue = String(imgElement.dataset.fallbackSrcs || '')
      .split(FALLBACK_SEPARATOR)
      .map((source) => source.trim())
      .filter(Boolean);

    const nextSource = fallbackQueue.shift();
    if (nextSource && imgElement.src !== nextSource) {
      imgElement.dataset.fallbackSrcs = fallbackQueue.join(FALLBACK_SEPARATOR);
      imgElement.src = nextSource;
      return;
    }

    imgElement.onerror = null;
    imgElement.src = LOCAL_PLACEHOLDER;
    imgElement.classList.add('is-placeholder');
  }

  window.LOCAL_PRODUCT_PLACEHOLDER = LOCAL_PLACEHOLDER;
  window.resolveProductImageSources = resolveProductImageSources;
  window.buildImageFallbackAttribute = buildImageFallbackAttribute;
  window.handleProductImageError = handleProductImageError;

  window.normalizeCatalogProduct = function normalizeCatalogProductOverride(rawProduct, index = 0, source = 'local') {
    const baseProduct = typeof originalNormalizeCatalogProduct === 'function'
      ? originalNormalizeCatalogProduct(rawProduct, index, source)
      : rawProduct;

    if (!baseProduct || typeof baseProduct !== 'object') {
      return null;
    }

    const kakobuyImageUrl = getValidKakobuyProductImage(
      pickFirstNonEmptyFieldValue(rawProduct || baseProduct, KAKOBUY_FIELDS)
    );
    const fallbackImageUrl = getValidFallbackProductImage(
      pickFirstNonEmptyFieldValue(rawProduct || baseProduct, FALLBACK_FIELDS) ||
      pickFirstNonEmptyFieldValue(baseProduct, FALLBACK_FIELDS)
    );

    return {
      ...baseProduct,
      imagen_url: fallbackImageUrl || baseProduct.imagen_url || '',
      supabase_image_url: fallbackImageUrl || baseProduct.supabase_image_url || '',
      kakobuy_image_url: kakobuyImageUrl || baseProduct.kakobuy_image_url || ''
    };
  };

  function renderEmptyProductsState(grid) {
    grid.innerHTML = '<p style="color:#fff; opacity:.8;">No hay productos todavia.</p>';
  }

  window.renderProducts = function renderProductsOverride(products) {
    const grid = document.querySelector('.products-grid') || document.getElementById('products-grid');
    if (!grid) return;

    if (!products || !products.length) {
      renderEmptyProductsState(grid);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const product of products) {
      let rawImageSources = resolveProductImageSources(product);
      let allImages = [];
      rawImageSources.forEach(src => {
          if (src) {
              src.split(',').forEach(s => {
                  s = s.trim();
                  if (s) {
                      if (!allImages.includes(s) && s !== LOCAL_PLACEHOLDER) {
                          allImages.push(s);
                      }
                  }
              });
          }
      });
      if (allImages.length === 0) allImages.push(LOCAL_PLACEHOLDER);

      const imagenUrl = allImages[0];
      const fallbackSources = allImages.slice(1).join(FALLBACK_SEPARATOR);
      const imagesJsonEscaped = escapeText(JSON.stringify(allImages));

      const card = document.createElement('article');
      const mappedCategory = typeof window.mapProductCategory === 'function'
        ? window.mapProductCategory(product)
        : (product.categoria || 'accesorios');

      card.className = 'product-card card slide-up';
      card.setAttribute('data-category', mappedCategory);
      card.setAttribute('data-quality', String(product.calidad || '').toLowerCase());
      card.setAttribute('data-base-url', product.source_url || '');

      const nombreEscapado = escapeText(product.nombre || 'Producto');
      const categoriaEscapada = escapeText(product.categoria || '');
      
      // Determine if it should have DESTACADO badge.
      const isDestacado = product.destacado === true || product.destacado === 'true' || product.destacado === 1;

      card.innerHTML = \`
          <div class="card-img-wrap carousel-container" data-current="0">
              <img src="\${escapeText(imagenUrl)}" alt="\${nombreEscapado}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback-srcs="\${escapeText(fallbackSources)}" data-images="\${imagesJsonEscaped}" class="card-img carousel-img" onerror="handleProductImageError(this)">
              \${isDestacado ? '<span class="featured-badge">DESTACADO</span>' : ''}
              \${allImages.length > 1 ? \`
              <button class="carousel-btn prev" onclick="changeCarouselImage(event, this, -1)">&#10094;</button>
              <button class="carousel-btn next" onclick="changeCarouselImage(event, this, 1)">&#10095;</button>
              <div class="carousel-dots">
                  \${allImages.map((_, i) => \`<span class="dot \${i===0?'active':''}"></span>\`).join('')}
              </div>
              \` : ''}
          </div>

          <div class="card-body">
              <span class="card-cat">\${categoriaEscapada}</span>
              <h3 class="card-name">\${nombreEscapado}</h3>
              <div class="card-price price-cny" data-price-cny="\${product.precio_cny || 0}">¥\${product.precio_cny || 0}</div>
              <a class="card-btn" href="javascript:void(0);" target="_blank" rel="noopener noreferrer" data-agent-link>Ver Producto</a>
          </div>
      \`;
      fragment.appendChild(card);
    }

    grid.innerHTML = '';
    grid.appendChild(fragment);

    if (typeof window.initScrollAnimations === 'function') {
      window.initScrollAnimations();
    }

    requestAnimationFrame(() => {
      if (typeof window.updateProductLinks === 'function') {
        window.updateProductLinks();
      }
      patchExistingImages();
    });
  };

  function buildHomeFallbackThumb(label, background) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <rect width="600" height="600" rx="36" fill="${background}" />
        <circle cx="300" cy="240" r="96" fill="rgba(17,24,39,0.06)" />
        <text x="300" y="368" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="46" font-weight="700">${label}</text>
      </svg>
    `;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function renderHomeFeaturedFallback(message) {
    const featuredGrid = document.getElementById('homeFeaturedGrid');
    if (!featuredGrid) return;

    const statusMessage = message || 'No pudimos cargar destacados en vivo. Mientras tanto, entra al catalogo por estas rutas rapidas.';
    const cards = HOME_FALLBACKS.map((item) => `
      <article class="home-featured-card">
        <div class="home-featured-media">
          <img src="${buildHomeFallbackThumb(item.label, item.background)}" alt="${escapeText(item.name)}" loading="lazy" decoding="async">
        </div>
        <div class="home-featured-content">
          <div class="home-featured-meta">${escapeText(item.category)}</div>
          <h3 class="home-featured-name">${escapeText(item.name)}</h3>
          <div class="home-featured-price">${escapeText(item.detail)}</div>
            <a href="${item.href}" class="rs-btn-magic home-featured-link" style="width:100%;">
                <span class="rs-btn-magic-spin"></span>
                <span class="rs-btn-magic-inner rs-btn-magic-text" style="font-size: 0.85rem; padding: 0 1rem; position: relative; z-index: 10;">Abrir seccion</span>
            </a>
        </div>
      </article>
    `).join('');

    featuredGrid.innerHTML = `
      <div class="home-v2-product-status">${escapeText(statusMessage)}</div>
      ${cards}
    `;
  }

  window.loadFeaturedProducts = async function loadFeaturedProductsOverride() {
    const featuredGrid = document.getElementById('homeFeaturedGrid');
    if (!featuredGrid || typeof window.getActiveCatalogProducts !== 'function') return;

    try {
      const products = await window.getActiveCatalogProducts();
      if (!products || !products.length) {
        renderHomeFeaturedFallback('No encontramos destacados en este momento. Podes entrar igual por estas rutas del catalogo.');
        return;
      }

      // Prioritize products marked as 'destacado' (recommended via admin heart button)
      // Use loose check to handle boolean true, string "true", or any truthy value from Supabase
      const isDestacado = (p) => p.destacado === true || p.destacado === 'true' || p.destacado === 1;
      const recommended = products.filter(p => isDestacado(p));
      const nonRecommended = products.filter(p => !isDestacado(p));

      let selectedProducts;
      if (recommended.length >= 8) {
        // If enough recommended products, shuffle and take 8
        selectedProducts = [...recommended].sort(() => 0.5 - Math.random()).slice(0, 8);
      } else {
        // Take all recommended first, then fill remaining slots with random non-recommended
        const shuffledOthers = [...nonRecommended].sort(() => 0.5 - Math.random());
        selectedProducts = [...recommended, ...shuffledOthers].slice(0, 8);
      }

      if (!selectedProducts.length) {
        renderHomeFeaturedFallback('No encontramos destacados en este momento. Podes entrar igual por estas rutas del catalogo.');
        return;
      }

      const fragment = document.createDocumentFragment();

      selectedProducts.forEach((product) => {
        let rawImageSources = resolveProductImageSources(product);
        let allImages = [];
        rawImageSources.forEach(src => {
            if (src) {
                src.split(',').forEach(s => {
                    s = s.trim();
                    if (s) {
                        if (!allImages.includes(s) && s !== LOCAL_PLACEHOLDER) {
                            allImages.push(s);
                        }
                    }
                });
            }
        });
        if (allImages.length === 0) allImages.push(LOCAL_PLACEHOLDER);

        const imagenUrl = allImages[0];
        const fallbackSources = allImages.slice(1).join(FALLBACK_SEPARATOR);
        const imagesJsonEscaped = escapeText(JSON.stringify(allImages));

        const card = document.createElement('article');
        const mappedCategory = typeof window.mapProductCategory === 'function'
          ? window.mapProductCategory(product)
          : (product.categoria || 'Catalogo');

        card.className = 'product-card card slide-up'; // reuse the same card style for featured
        card.setAttribute('data-category', mappedCategory);
        card.setAttribute('data-quality', String(product.calidad || '').toLowerCase());
        card.setAttribute('data-base-url', product.source_url || '');

        const nombreEscapado = escapeText(product.nombre || 'Producto');
        const categoriaEscapada = escapeText(product.categoria || 'Catalogo');
        
        // Determine if it should have DESTACADO badge.
        const isDestacado = product.destacado === true || product.destacado === 'true' || product.destacado === 1;

        card.innerHTML = \`
            <div class="card-img-wrap carousel-container" data-current="0">
                <img src="\${escapeText(imagenUrl)}" alt="\${nombreEscapado}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback-srcs="\${escapeText(fallbackSources)}" data-images="\${imagesJsonEscaped}" class="card-img carousel-img" onerror="handleProductImageError(this)">
                \${isDestacado ? '<span class="featured-badge">DESTACADO</span>' : ''}
                \${allImages.length > 1 ? \`
                <button class="carousel-btn prev" onclick="changeCarouselImage(event, this, -1)">&#10094;</button>
                <button class="carousel-btn next" onclick="changeCarouselImage(event, this, 1)">&#10095;</button>
                <div class="carousel-dots">
                    \${allImages.map((_, i) => \`<span class="dot \${i===0?'active':''}"></span>\`).join('')}
                </div>
                \` : ''}
            </div>

            <div class="card-body">
                <span class="card-cat">\${categoriaEscapada}</span>
                <h3 class="card-name">\${nombreEscapado}</h3>
                <div class="card-price price-cny" data-price-cny="\${product.precio_cny || 0}">¥\${product.precio_cny || 0}</div>
                <a class="card-btn" href="javascript:void(0);" target="_blank" rel="noopener noreferrer" data-agent-link>Ver Producto</a>
            </div>
        \`;
        fragment.appendChild(card);
      });

      featuredGrid.innerHTML = '';
      featuredGrid.appendChild(fragment);
      if (typeof window.updateProductLinks === 'function') {
        window.updateProductLinks();
      }
      patchExistingImages();
    } catch (error) {
      console.error('Error loading featured products override:', error);
      renderHomeFeaturedFallback();
    }
  };

  function resetCatalogCache() {
    if (!window.catalogCache || typeof window.catalogCache !== 'object') return;
    window.catalogCache.data = null;
    window.catalogCache.expiresAt = 0;
    window.catalogCache.promise = null; localStorage.removeItem('__rh_catalog_v3'); localStorage.removeItem('__rh_catalog_v4'); localStorage.removeItem('catalog_cache');
  }

  function patchExistingImages() {
    document.querySelectorAll('.product-card img, .home-featured-card img, .seller-logo img').forEach((img) => {
      if (!img.dataset.fallbackSrcs && !img.classList.contains('is-placeholder')) {
        img.dataset.fallbackSrcs = LOCAL_PLACEHOLDER;
      }
      img.onerror = function onImageError() {
        handleProductImageError(img);
      };
    });
  }

  async function rerunProductViews() {
    const grid = document.querySelector('.products-grid') || document.getElementById('products-grid');
    if (grid && typeof window.loadProductsPage === 'function') {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page'), 10) || window.currentPage || 1;
      const filters = typeof window.buildFiltersFromURLParams === 'function'
        ? window.buildFiltersFromURLParams(params)
        : {};

      if (typeof window.syncProductFilterUIFromURL === 'function') {
        window.syncProductFilterUIFromURL(params);
      }

      await window.loadProductsPage(page, filters);
    }

    if (document.getElementById('homeFeaturedGrid')) {
      await window.loadFeaturedProducts();
    }
  }

  async function bootstrapProductOverrides() {
    resetCatalogCache();
    patchExistingImages();

    try {
      await rerunProductViews();
    } catch (error) {
      console.error('Error applying product overrides:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapProductOverrides, { once: true });
  } else {
    setTimeout(bootstrapProductOverrides, 0);
  }
})();
