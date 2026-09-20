/**
 * ============================================
 * MAIN JAVASCRIPT FILE
 * ============================================
 * Handles:
 * - Scroll animations
 * - Mobile menu toggle
 * - Sticky header on scroll
 * - Smooth scrolling
 * - Filter button interactions (visual only)
 */

// ============================================
// GLOBAL STATE VARIABLES (must be declared first)
// ============================================
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
const PRODUCTS_PER_PAGE = 36;

// Expose to window for other scripts (like product-overrides.js)
if (typeof window !== 'undefined') {
    window.currentPage = currentPage;
    window.totalPages = totalPages;
    window.currentFilters = currentFilters;
    window.PRODUCTS_PER_PAGE = PRODUCTS_PER_PAGE;
}

// ============================================
// DOM ELEMENTS (cached for performance)
// ============================================

// DOM Elements - Initialize after DOM is ready
let header, mobileMenuToggle, nav, navList, filterButtons;
let isMenuOpen = false;

function initDOMElements() {
    header = document.getElementById('header');
    mobileMenuToggle = document.getElementById('mobileMenuToggle');
    nav = document.getElementById('nav');
    navList = document.querySelector('.nav-list');
    filterButtons = document.querySelectorAll('.filter-btn');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOMElements);
} else {
    initDOMElements();
}

function syncHeaderSearchInputs() {
    const currentSearch = new URLSearchParams(window.location.search).get('search') || '';
    document.querySelectorAll('.header-search-input').forEach(input => {
        input.value = currentSearch;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHeaderSearchInputs);
} else {
    syncHeaderSearchInputs();
}

// ============================================
// PERFORMANCE HELPERS
// ============================================

// Throttle function para optimizar eventos frecuentes
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Debounce function para optimizar búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// STICKY HEADER ON SCROLL
// ============================================

let lastScroll = 0;
let ticking = false;
let rafId = null;

function updateHeader() {
    const currentScroll = window.pageYOffset || window.scrollY;

    // Hide/show header based on scroll direction (Infiner style)
    if (currentScroll < lastScroll || currentScroll < 50) {
        // Scrolling up or at top - show header
        if (header) {
            header.style.transform = 'translate3d(0, 0, 0)';
            header.style.opacity = '1';
        }
    } else {
        // Scrolling down - hide header
        if (header && currentScroll > 50) {
            header.style.transform = 'translate3d(0, -100%, 0)';
            header.style.opacity = '0';
        }
    }

    // Add 'scrolled' class when scrolling down
    if (currentScroll > 50) {
        header?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
    }

    // Update header height CSS variable for mobile menu positioning (solo cuando sea necesario)
    if (window.innerWidth <= 767 && header && isMenuOpen) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }

    lastScroll = currentScroll;
    ticking = false;
    rafId = null;
}

// Optimizado con requestAnimationFrame y passive listener
function handleScroll() {
    if (!ticking) {
        rafId = requestAnimationFrame(updateHeader);
        ticking = true;
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    window.removeEventListener('scroll', handleScroll);
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    mobileMenuToggle = document.getElementById('mobileMenuToggle');
    nav = document.getElementById('nav');
    navList = document.querySelector('.nav-list');
    header = document.getElementById('header');

    if (mobileMenuToggle) {
        // Update header height and menu position on load and resize
        function updateMobileMenuPosition() {
            if (window.innerWidth <= 767 && header && navList) {
                const headerRect = header.getBoundingClientRect();
                const headerHeight = headerRect.height;
                const headerTop = headerRect.top;

                // Actualizar la variable CSS con la altura del header
                document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

                // Si el menú está abierto, actualizar su posición para que siempre esté debajo del header
                if (isMenuOpen && navList.classList.contains('active')) {
                    // Calcular la posición correcta del menú basada en la posición actual del header
                    const menuTop = headerTop + headerHeight;
                    navList.style.top = `${menuTop}px`;
                    navList.style.height = `calc(100vh - ${menuTop}px)`;
                }
            }
        }

        // Initial update on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateMobileMenuPosition);
        } else {
            updateMobileMenuPosition();
        }

        // Update on resize
        window.addEventListener('resize', throttle(updateMobileMenuPosition, 100));

        // Update on scroll - mantener el menú visible y actualizar posición (optimizado)
        const handleMenuScroll = throttle(() => {
            if (window.innerWidth <= 767 && isMenuOpen && navList?.classList.contains('active')) {
                requestAnimationFrame(updateMobileMenuPosition);
            }
        }, 100);

        window.addEventListener('scroll', handleMenuScroll, { passive: true });

        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Update position before opening/closing menu
            updateMobileMenuPosition();

            // Toggle menu state
            const wasOpen = navList.classList.contains('active');
            navList.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            isMenuOpen = !wasOpen;

            // Prevenir scroll del body cuando el menú está abierto
            if (isMenuOpen) {
                document.body.style.overflow = 'hidden';
                // Actualizar posición después de abrir para asegurar que esté correcta
                setTimeout(() => updateMobileMenuPosition(), 10);
            } else {
                document.body.style.overflow = '';
            }

            // Animate hamburger icon
            const spans = mobileMenuToggle.querySelectorAll('span');
            if (navList.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Cerrar menú al hacer click fuera de él
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 767 && isMenuOpen && navList.classList.contains('active')) {
                const isClickInsideMenu = navList.contains(e.target);
                const isClickOnToggle = mobileMenuToggle.contains(e.target);

                if (!isClickInsideMenu && !isClickOnToggle) {
                    navList.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    isMenuOpen = false;
                    document.body.style.overflow = '';

                    // Reset hamburger icon
                    const spans = mobileMenuToggle.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });

        // Dropdown menus
        const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
        const closeAllDropdowns = (exceptDropdown = null) => {
            document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                if (dropdown !== exceptDropdown) {
                    dropdown.classList.remove('open');
                    dropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
                }
            });
        };

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const dropdown = toggle.closest('.nav-dropdown');
                if (!dropdown) return;

                const willOpen = !dropdown.classList.contains('open');
                closeAllDropdowns(dropdown);
                dropdown.classList.toggle('open', willOpen);
                toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });
        });

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('a.nav-link, a.nav-dropdown-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                isMenuOpen = false;
                closeAllDropdowns();
                document.body.style.overflow = '';
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && navList.classList.contains('active')) {
                navList.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
            if (!e.target.closest('.nav-dropdown')) {
                closeAllDropdowns();
            }
        });
    }
});

// ============================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#" or if it has data-agent-link (product links)
        if (href === '#' || this.hasAttribute('data-agent-link')) {
            return;
        }

        const target = document.querySelector(href);

        if (target) {
            e.preventDefault();
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================

/**
 * Observe elements with 'slide-up' class
 * Add 'visible' class when they enter the viewport
 */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Unobserve after animation to improve performance
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with 'slide-up' class
function initScrollAnimations() {
    const slideUpElements = document.querySelectorAll('.slide-up:not(.observed)');
    slideUpElements.forEach(el => {
        observer.observe(el);
        el.classList.add('observed'); // Marcar como observado para evitar duplicados
    });
}

// Inicializar animaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
});

// ============================================
// FILTER BUTTON INTERACTIONS (Visual Only)
// ============================================

if (filterButtons && filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);

            // Note: This is visual only - no actual filtering functionality
            // In a real application, you would filter products here
        });
    });
}

// ============================================
// PRODUCT FILTERS SIDEBAR
// ============================================

// Función para inicializar filtros modernos con badges
async function initModernFilters() {
    const container = document.getElementById('categoriesContainerModern');
    if (!container) return;

    try {
        // Obtener estadísticas de categorías desde la API
        const headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        };

        const query = `${SUPABASE_REST_URL}/products_clean?select=categoria&activo=eq.true&source_url=not.is.null&source_url=neq.`;
        const res = await secureSupabaseFetch(query, { headers });

        if (!res.ok) return;

        const products = await res.json();

        // Contar productos por categoría
        const categoryCounts = {};
        const categoryMap = {
            'all': 'Todos los Productos',
            'calzado': 'Zapatillas',
            'ropa-superior': 'Remeras',
            'ropa-inferior': 'Pantalones',
            'accesorios': 'Accesorios',
            'conjuntos': 'Conjuntos'
        };

        let totalCount = 0;
        products.forEach(product => {
            totalCount++;
            const mappedCategory = mapProductCategory(product);
            if (mappedCategory && mappedCategory !== 'all') {
                categoryCounts[mappedCategory] = (categoryCounts[mappedCategory] || 0) + 1;
            }
        });

        // Crear botones de categorías
        container.innerHTML = '';

        // Botón "Todos los Productos"
        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn-modern active';
        allBtn.setAttribute('data-category', 'all');
        allBtn.innerHTML = `Todos los Productos <span class="category-badge">${totalCount}</span>`;
        // Aplicar estilos inline para asegurar que se vea en rojo
        allBtn.style.background = '#dc2626';
        allBtn.style.border = 'none';
        allBtn.style.color = '#ffffff';
        allBtn.style.fontWeight = '600';
        allBtn.style.borderRadius = '20px';
        allBtn.style.padding = '0.5rem 1rem';
        container.appendChild(allBtn);

        // Botones de otras categorías
        const categories = ['calzado', 'ropa-superior', 'ropa-inferior', 'accesorios', 'conjuntos'];
        categories.forEach(cat => {
            const count = categoryCounts[cat] || 0;
            if (count > 0) {
                const btn = document.createElement('button');
                btn.className = 'category-btn-modern';
                btn.setAttribute('data-category', cat);
                btn.innerHTML = `${categoryMap[cat]} <span class="category-badge">${count}</span>`;
                // Asegurar estilos por defecto para botones inactivos
                btn.style.background = 'transparent';
                btn.style.border = 'none';
                btn.style.color = '';
                container.appendChild(btn);
            }
        });

        // Agregar event listeners a los nuevos botones
        const modernButtons = container.querySelectorAll('.category-btn-modern');
        modernButtons.forEach(button => {
            // Asegurar que el botón activo tenga los estilos correctos
            if (button.classList.contains('active')) {
                button.style.background = '#dc2626';
                button.style.border = 'none';
                button.style.color = '#ffffff';
                button.style.fontWeight = '600';
                button.style.borderRadius = '20px';
                button.style.padding = '0.5rem 1rem';
            } else {
                button.style.background = 'transparent';
                button.style.border = 'none';
            }

            button.addEventListener('click', () => {
                modernButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                });
                button.classList.add('active');
                button.style.background = '#dc2626';
                button.style.borderColor = '#dc2626';
                button.style.color = '#ffffff';

                setTimeout(() => {
                    const filters = buildFiltersFromUI();
                    loadProductsPage(1, filters);
                }, 10);
            });
        });

    } catch (error) {
        console.error('Error loading category filters:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar filtros modernos si existe el contenedor
    if (document.getElementById('categoriesContainerModern')) {
        // Pequeño delay para asegurar que el DOM esté completamente listo
        setTimeout(() => {
            initModernFilters();
        }, 100);
    }

    // Category buttons with filtering (ahora recarga desde API) - mantener compatibilidad con botones antiguos
    const categoryButtons = document.querySelectorAll('.category-btn:not(.category-btn-modern)');
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            // Verificar si ya tiene un listener para evitar duplicados
            if (!button.dataset.listenerAdded) {
                button.dataset.listenerAdded = 'true';
                button.addEventListener('click', () => {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Esperar un momento para que el DOM se actualice antes de construir filtros
                    setTimeout(() => {
                        const filters = buildFiltersFromUI();
                        loadProductsPage(1, filters);
                    }, 10);
                });
            }
        });
    }

    // Search input con debounce optimizado
    const searchInput = document.getElementById('headerSearchGlobal') || document.getElementById('productSearch');
    if (searchInput) {
        const handleSearch = debounce((e) => {
            const searchTerm = e.target.value.trim();
            const filters = buildFiltersFromUI();
            if (searchTerm) {
                filters.search = searchTerm;
            }
            loadProductsPage(1, filters);
        }, 400);

        searchInput.addEventListener('input', handleSearch, { passive: true });
    }

    // Sort select change handler
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            const selectedValue = this.value;
            const filters = buildFiltersFromUI();
            filters.sort = selectedValue;
            // Resetear a página 1 cuando cambia el ordenamiento
            currentPage = 1;
            loadProductsPage(1, filters);
        });
    }

    // Filter section accordions
    const filterSectionHeaders = document.querySelectorAll('.filter-section-header');
    filterSectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.getAttribute('data-section');
            const content = document.getElementById(`${section}Content`);
            const isExpanded = header.getAttribute('aria-expanded') === 'true';

            // Close all other sections
            filterSectionHeaders.forEach(h => {
                if (h !== header) {
                    h.setAttribute('aria-expanded', 'false');
                    const otherSection = h.getAttribute('data-section');
                    const otherContent = document.getElementById(`${otherSection}Content`);
                    if (otherContent) {
                        otherContent.classList.remove('expanded');
                    }
                }
            });

            // Toggle current section
            header.setAttribute('aria-expanded', !isExpanded);
            if (content) {
                content.classList.toggle('expanded', !isExpanded);
            }
        });

        // Set initial state (closed by default)
        header.setAttribute('aria-expanded', 'false');
        const section = header.getAttribute('data-section');
        const content = document.getElementById(`${section}Content`);
        if (content) {
            content.classList.remove('expanded');
        }
    });

    // Quality buttons with filtering (ahora recarga desde API)
    const qualityButtons = document.querySelectorAll('.quality-btn');
    qualityButtons.forEach(button => {
        button.addEventListener('click', () => {
            qualityButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filters = buildFiltersFromUI();
            const quality = button.getAttribute('data-quality');
            if (quality) {
                filters.quality = quality;
            }
            loadProductsPage(1, filters);
        });
    });

    // Brand buttons with filtering (ahora recarga desde API)
    const brandButtons = document.querySelectorAll('.brand-btn');
    brandButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Desactivar todas las demás marcas (solo una activa a la vez)
            brandButtons.forEach(btn => {
                if (btn !== button) {
                    btn.classList.remove('active');
                }
            });
            button.classList.toggle('active');

            const filters = buildFiltersFromUI();
            loadProductsPage(1, filters);
        });
    });
});

// Construir objeto de filtros desde la UI
function buildFiltersFromUI() {
    const filters = {};

    const searchInput = document.getElementById('headerSearchGlobal') || document.getElementById('productSearch');
    if (searchInput && searchInput.value.trim()) {
        filters.search = searchInput.value.trim();
    }

    // Buscar categoría activa en botones modernos, antiguos, o los nuevos pills
    const activeCategory = document.querySelector('.rs-cat-pill.active') || document.querySelector('.category-btn-modern.active') || document.querySelector('.category-btn.active');
    if (activeCategory) {
        const category = activeCategory.getAttribute('data-category');
        if (category && category !== 'all') {
            // Guardar la categoría directamente (sin convertir) para el filtrado en el cliente
            // El filtrado usa mapProductCategory que retorna valores como 'calzado', 'ropa-superior', etc.
            filters.category = category;
        }
    }

    const activeQuality = document.querySelector('.quality-btn.active');
    if (activeQuality) {
        const quality = activeQuality.getAttribute('data-quality');
        if (quality) {
            filters.quality = quality;
        }
    }

    const activeBrand = document.querySelector('.rs-filter-brand-item.active') || document.querySelector('.brand-btn.active');
    if (activeBrand) {
        // Usar el atributo data-brand si existe, sino usar el texto
        const brandValue = activeBrand.getAttribute('data-brand') || activeBrand.textContent.trim();
        filters.brand = brandValue;
    }

    // Agregar ordenamiento
    const sortSelect = document.getElementById('rsFilterSort') || document.getElementById('sortSelect');
    if (sortSelect && sortSelect.value && sortSelect.value !== 'default') {
        filters.sort = sortSelect.value;
    }

    // Price range
    const priceMin = document.getElementById('rsPriceMin');
    const priceMax = document.getElementById('rsPriceMax');
    if (priceMin && priceMax) {
        filters.priceMin = parseFloat(priceMin.value);
        filters.priceMax = parseFloat(priceMax.value);
    }

    return filters;
}

// ============================================
// PRODUCT CARD HOVER EFFECTS (Enhanced)
// ============================================

const productCards = document.querySelectorAll('.product-card');

productCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s ease-in-out';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transition = 'all 0.3s ease-in-out';
    });
});

// ============================================
// BUTTON HOVER EFFECTS
// ============================================

const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s ease-in-out';
    });

    button.addEventListener('mouseleave', function () {
        this.style.transition = 'all 0.3s ease-in-out';
    });
});

// ============================================
// ACTIVE NAVIGATION LINK HIGHLIGHTING
// ============================================

/**
 * Highlight the active navigation link based on current page
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('a.nav-link, a.nav-dropdown-link');
    const navDropdowns = document.querySelectorAll('.nav-dropdown');

    navDropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
        dropdown.querySelector('.nav-dropdown-toggle')?.classList.remove('active');
    });

    navLinks.forEach(link => {
        link.classList.remove('active');

        const linkPath = link.getAttribute('href');
        const [pathWithQuery = '', hashPart = ''] = (linkPath || '').split('#');
        const normalizedLinkPath = pathWithQuery.split('?')[0];

        // Check if current path matches link path
        const pathMatches = normalizedLinkPath && (
            currentPath === normalizedLinkPath ||
            (currentPath === '' && normalizedLinkPath === 'index.html') ||
            (currentPath === '/' && normalizedLinkPath === 'index.html')
        );
        const hashMatches = !hashPart || window.location.hash === `#${hashPart}`;

        if (pathMatches && hashMatches) {
            link.classList.add('active');
            const parentDropdown = link.closest('.nav-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('active');
                parentDropdown.querySelector('.nav-dropdown-toggle')?.classList.add('active');
            }
        }
    });
}

// Initialize active nav link
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setActiveNavLink);
} else {
    setActiveNavLink();
}

// ============================================
// CONFIG PANEL (Settings)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const configToggle = document.getElementById('configToggle');
    const configPanel = document.getElementById('configPanel');
    const prefMain = document.getElementById('prefMain');

    if (!configToggle || !configPanel) return;

    // Agent icon mapping for the main row
    const agentIcons = {
        'KakoBuy': 'images/kakobuylogo.png',
        'Hubbuy': 'hubbuy-logo.png',
        'CssBuy': 'images/cssbuy%20logo.png',
        'OOPBuy': 'images/oopbuylogo.png',
        'MuleBuy': '',
        'LitBuy': 'images/Litbuy_logo.png'
    };

    // Toggle panel
    configToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        // Reset to main view when opening
        if (!configPanel.classList.contains('active')) {
            document.querySelectorAll('.pref-sub').forEach(s => s.classList.remove('active'));
            if (prefMain) prefMain.style.display = '';
            // Position below the gear icon
            const rect = configToggle.getBoundingClientRect();
            configPanel.style.top = (rect.bottom + 8) + 'px';
            configPanel.style.right = (window.innerWidth - rect.right) + 'px';
        }
        configPanel.classList.toggle('active');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (configPanel.classList.contains('active') &&
            !configPanel.contains(e.target) &&
            !configToggle.contains(e.target)) {
            configPanel.classList.remove('active');
        }
    });

    // Row clicks -> show sub-panel
    document.querySelectorAll('.pref-row[data-pref-target]').forEach(row => {
        row.addEventListener('click', () => {
            const targetId = row.getAttribute('data-pref-target');
            const target = document.getElementById(targetId);
            if (target && prefMain) {
                prefMain.style.display = 'none';
                target.classList.add('active');
            }
        });
    });

    // Back buttons -> show main
    document.querySelectorAll('[data-pref-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.pref-sub').classList.remove('active');
            if (prefMain) prefMain.style.display = '';
        });
    });

    // Theme options
    document.querySelectorAll('#prefTheme .pref-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('#prefTheme .pref-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const val = opt.getAttribute('data-theme-val');
            localStorage.setItem('selectedTheme', val);
            if (typeof applyTheme === 'function') applyTheme(val);
            // Update main row label
            const label = document.getElementById('currentThemeLabel');
            if (label) label.textContent = val === 'dark' ? '🌙 Oscuro' : '☀️ Claro';
            // Update theme option buttons state
            document.querySelectorAll('#themeOptions .config-option').forEach(o => o.classList.remove('active'));
        });
    });

    // Currency options
    document.querySelectorAll('#prefCurrency .pref-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('#prefCurrency .pref-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const val = opt.getAttribute('data-currency');
            localStorage.setItem('selectedCurrency', val);
            if (typeof updateProductPrices === 'function') updateProductPrices(val);
            const label = document.getElementById('currentCurrencyLabel');
            if (label) label.textContent = opt.querySelector('span').textContent.trim();
        });
    });

    // Helper to set agent globally and sync all UI states
    function setAgent(val) {
        localStorage.setItem('selectedAgent', val);
        if (typeof updateProductLinks === 'function') updateProductLinks(val);
        const label = document.getElementById('currentAgentLabel');
        if (label) label.textContent = val;
        const icon = document.getElementById('currentAgentIcon');
        if (icon && agentIcons[val]) {
            icon.src = agentIcons[val];
            icon.style.display = '';
        } else if (icon) {
            icon.style.display = 'none';
        }

        // Sync panel active option classes
        document.querySelectorAll('#prefAgent .pref-option').forEach(o => {
            o.classList.toggle('active', o.getAttribute('data-agent') === val);
        });

        // Sync quick switch slider and option classes
        const quickSwitch = document.querySelector('.agent-quick-switch');
        if (quickSwitch) {
            quickSwitch.setAttribute('data-active', val);
            document.querySelectorAll('.agent-quick-switch .switch-option').forEach(opt => {
                opt.classList.toggle('active', opt.getAttribute('data-agent') === val);
            });
        }
    }

    // Agent options Traditional Panel
    document.querySelectorAll('#prefAgent .pref-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-agent');
            setAgent(val);
        });
    });

    // Quick Switch Floating Options
    document.querySelectorAll('.agent-quick-switch .switch-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = opt.getAttribute('data-agent');
            setAgent(val);
        });
    });

    // Restore saved preferences on load
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'CNY';
    const savedAgent = localStorage.getItem('selectedAgent') || 'KakoBuy';

    if (savedTheme) {
        const tLabel = document.getElementById('currentThemeLabel');
        if (tLabel) tLabel.textContent = savedTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro';
        document.querySelectorAll('#prefTheme .pref-option').forEach(o => {
            o.classList.toggle('active', o.getAttribute('data-theme-val') === savedTheme);
        });
    }
    if (savedCurrency) {
        document.querySelectorAll('#prefCurrency .pref-option').forEach(o => {
            const isActive = o.getAttribute('data-currency') === savedCurrency;
            o.classList.toggle('active', isActive);
            if (isActive) {
                const cLabel = document.getElementById('currentCurrencyLabel');
                if (cLabel) cLabel.textContent = o.querySelector('span').textContent.trim();
            }
        });
    }
    if (savedAgent) {
        setAgent(savedAgent);
    }
});

// ============================================
// THEME TOGGLE
// ============================================

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('selectedTheme', theme);

    // Sync theme options in config panel (Claro/Oscuro buttons)
    const themeOpts = document.querySelectorAll('#themeOptions .config-option');
    themeOpts.forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme-val') === theme);
    });
}

// Initialize theme from saved preference
(function () {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Theme options in config panel (Claro/Oscuro)
    document.addEventListener('DOMContentLoaded', () => {
        const themeOpts = document.querySelectorAll('#themeOptions .config-option');
        if (themeOpts.length > 0) {
            // Set initial active state
            const current = localStorage.getItem('selectedTheme') || 'dark';
            themeOpts.forEach(opt => {
                opt.classList.toggle('active', opt.getAttribute('data-theme-val') === current);
                opt.addEventListener('click', () => {
                    const t = opt.getAttribute('data-theme-val');
                    applyTheme(t);
                });
            });
        }
    });
})();


// ============================================
// GET AGENT DISPLAY NAME
// ============================================

function getAgentDisplayName(agentCode) {
    const agentOption = document.querySelector(`.agent-option[data-agent="${agentCode}"]`);
    if (agentOption) {
        const agentNameSpan = agentOption.querySelector('.agent-name');
        if (agentNameSpan) return agentNameSpan.textContent.trim();
    }
    const agentNames = {
        'Hubbuy': 'Hubbuy',
        'KakoBuy': 'KakoBuy',
        'Kakobuy': 'KakoBuy',
        'MuleBuy': 'MuleBuy',
        'Mulebuy': 'MuleBuy',
        'CssBuy': 'CssBuy',
        'CSSBuy': 'CssBuy',
        'cssbuy': 'CssBuy',
        'Oopbuy': 'Oopbuy',
        'OOPBuy': 'Oopbuy',
        'oopbuy': 'Oopbuy',
        'LitBuy': 'LitBuy',
        'Litbuy': 'LitBuy',
        'litbuy': 'LitBuy'
    };
    return agentNames[agentCode] || agentCode;
}

// ============================================
// EXTRACT BASE URL FROM AGENT LINK
// ============================================

function extractBaseUrlFromAgentLink(agentLink) {
    if (!agentLink || typeof agentLink !== 'string') return null;

    const url = agentLink.trim();

    // If it's already a base URL, return it directly
    if ((url.includes('weidian.com') || url.includes('1688.com') || url.includes('taobao.com')) &&
        !url.includes('kakobuy.com') && !url.includes('hubbuycn.com') &&
        !url.includes('mulebuy.com') && !url.includes('cssbuy.com') && !url.includes('oopbuy.com') && !url.includes('litbuy.com')) {
        return url;
    }

    // KakoBuy: https://www.kakobuy.com/item/details?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7616832901&affcode=gonza
    if (url.includes('kakobuy.com')) {
        const urlMatch = url.match(/url=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
            try {
                let decodedUrl = decodeURIComponent(urlMatch[1]);
                if (decodedUrl.includes('%')) {
                    decodedUrl = decodeURIComponent(decodedUrl);
                }
                if (decodedUrl.includes('weidian.com') || decodedUrl.includes('1688.com') || decodedUrl.includes('taobao.com')) {
                    return decodedUrl;
                }
            } catch (e) {
                // Error decoding URL
            }
        }
    }

    // Hubbuy/HipoBuy
    if (url.includes('hubbuycn.com') || url.includes('hipobuy')) {
        const hubbuyMatch = url.match(/url=([^=&]+)/);
        if (hubbuyMatch) {
            let baseUrl = hubbuyMatch[1];
            if (baseUrl.includes('=product_link')) {
                baseUrl = baseUrl.replace('=product_link', '');
            }
            try {
                return decodeURIComponent(baseUrl);
            } catch (e) {
                return baseUrl;
            }
        }
    }

    // Oopbuy: https://oopbuy.com/product/weidian/7616832901

    // Extraer plataforma e ID
    const oopbuyMatch = url.match(/oopbuy\.com\/product\/([^\/]+)\/(\d+)/);
    if (oopbuyMatch) {
        const platform = oopbuyMatch[1];
        const productId = oopbuyMatch[2];

        // Reconstruir link base según plataforma
        if (platform === 'weidian' || platform === 'WEIDIAN') {
            return `https://weidian.com/item.html?itemID=${productId}`;
        } else if (platform === '1688') {
            return `https://detail.1688.com/offer/${productId}.html`;
        } else if (platform === 'taobao') {
            return `https://item.taobao.com/item.htm?id=${productId}`;
        }
    }

    // MuleBuy: https://mulebuy.com/product?id=7616832901&platform=WEIDIAN&ref=200118463
    const mulebuyMatch = url.match(/mulebuy\.com\/product\?id=(\d+)&platform=([^&]+)/);
    if (mulebuyMatch) {
        const productId = mulebuyMatch[1];
        const platform = mulebuyMatch[2];

        // Reconstruir link base según plataforma
        if (platform === 'WEIDIAN') {
            return `https://weidian.com/item.html?itemID=${productId}`;
        } else if (platform === 'ALI_1688') {
            return `https://detail.1688.com/offer/${productId}.html`;
        } else if (platform === 'TAOBAO') {
            return `https://item.taobao.com/item.htm?id=${productId}`;
        }
    }

    // LitBuy: https://litbuy.com/product/0/933488465401 or https://litbuy.com/product/taobao/12345
    const litbuyMatch = url.match(/litbuy\.com\/product\/([^\/]+)\/(\d+)/);
    if (litbuyMatch) {
        const platform = litbuyMatch[1].toLowerCase();
        const productId = litbuyMatch[2];

        if (platform === '2' || platform === 'weidian') {
            return `https://weidian.com/item.html?itemID=${productId}`;
        } else if (platform === '0' || platform === '1688') {
            return `https://detail.1688.com/offer/${productId}.html`;
        } else if (platform === '1' || platform === 'taobao') {
            return `https://item.taobao.com/item.htm?id=${productId}`;
        }
    }

    // CssBuy: https://www.cssbuy.com/item-698667801968.html
    // Formato: item-{productId}.html
    // Intentar extraer productId del link de CssBuy
    const cssbuyMatch = url.match(/cssbuy\.com\/item-(\d+)\.html/i);
    if (cssbuyMatch) {
        const productId = cssbuyMatch[1];
        // No podemos determinar la plataforma desde CssBuy, así que retornamos null
        // El link base se obtendrá desde source_url en la base de datos
        return null;
    }

    return null;
}

// Function to update all product links based on selected agent
function updateProductLinks(selectedAgent) {
    // If no agent provided, get it from localStorage or active button
    if (!selectedAgent) {
        selectedAgent = localStorage.getItem('selectedAgent') ||
            document.querySelector('.agent-option.active')?.getAttribute('data-agent') ||
            'KakoBuy';
    }

    // Get the display name of the agent
    const agentDisplayName = getAgentDisplayName(selectedAgent);

    // Select all product links (buttons with data-agent-link attribute)
    const productLinks = document.querySelectorAll('a[data-agent-link]');

    // Procesar todos los links de forma optimizada
    productLinks.forEach((link) => {
        const card = link.closest('.product-card, .home-featured-card');
        if (!card) {
            const inner = link.querySelector('.rs-btn-magic-text');
            if (inner) { inner.textContent = `Comprar`; } else { link.textContent = `Ver Producto`; }
            link.href = 'javascript:void(0);';
            link.style.opacity = '0.5';
            link.style.cursor = 'not-allowed';
            return;
        }

        // Obtener source_url del card (link base weidian/1688/taobao)
        let baseUrl = card.getAttribute('data-base-url');

        // Validar y limpiar baseUrl si es necesario
        if (baseUrl && baseUrl.trim() !== '') {
            // Si es un link de agente, extraer el link base real
            if (baseUrl.includes('kakobuy.com') || baseUrl.includes('hubbuycn.com') || baseUrl.includes('mulebuy.com') || baseUrl.includes('cssbuy.com') || baseUrl.includes('oopbuy.com') || baseUrl.includes('litbuy.com')) {
                const realBaseUrl = extractBaseUrlFromAgentLink(baseUrl);
                if (realBaseUrl && (realBaseUrl.includes('weidian.com') || realBaseUrl.includes('1688.com') || realBaseUrl.includes('taobao.com'))) {
                    baseUrl = realBaseUrl;
                } else {
                    baseUrl = null;
                }
            } else if (!baseUrl.includes('weidian.com') && !baseUrl.includes('1688.com') && !baseUrl.includes('taobao.com')) {
                // Keep the base url as fallback instead of nulling it out
                // baseUrl = null; 
            }
        } else {
            baseUrl = null;
        }

        // Convertir link base al agente seleccionado
        if (baseUrl && baseUrl.trim() !== '') {
            // Usar async/await para la conversión
            (async () => {
                const convertedLink = await convertToAgentLink(baseUrl, selectedAgent);

                // Security: only run transformLink for Kakobuy links to ensure affcode=gonza
                // Other agents already embed gonza via convertToAgentLink
                let safeFinal = convertedLink;
                if (typeof transformLink === 'function' && selectedAgent.toLowerCase() === 'kakobuy') {
                    safeFinal = transformLink(convertedLink) || convertedLink;
                }

                if (safeFinal && safeFinal.trim() !== '' && safeFinal.startsWith('http')) {
                    link.href = safeFinal;
                    const inner = link.querySelector('.rs-btn-magic-text');
                    if (inner) { inner.textContent = `Comprar`; } else { link.textContent = `Ver Producto`; }
                    link.style.opacity = '';
                    link.style.cursor = '';
                } else {
                    link.href = 'javascript:void(0);';
                    const inner = link.querySelector('.rs-btn-magic-text');
                    if (inner) { inner.textContent = `Sin link disponible`; } else { link.textContent = `Sin link disponible`; }
                    link.style.opacity = '0.5';
                    link.style.cursor = 'not-allowed';
                }
            })();
        } else {
            link.href = 'javascript:void(0);';
            const inner = link.querySelector('.rs-btn-magic-text');
            if (inner) { inner.textContent = `Sin link disponible`; } else { link.textContent = `Sin link disponible`; }
            link.style.opacity = '0.5';
            link.style.cursor = 'not-allowed';
        }
    });
}

// ============================================
// QC MODAL (Quality Check Viewer)
// ============================================

// Abrir modal QC con información del producto
function openQCModal(product) {
    const qcModal = document.getElementById('qcModal');
    const qcModalBody = document.getElementById('qcModalBody');

    if (!qcModal || !qcModalBody) return;

    // Obtener imágenes del producto
    // Por ahora usamos la imagen principal y simulamos múltiples imágenes
    const productImageSources = resolveProductImageSources(product);
    const mainImage = productImageSources[0] || LOCAL_PRODUCT_PLACEHOLDER;
    const qcImages = product.qc_images || [];

    // Si no hay imágenes QC específicas, usar la imagen principal
    const images = qcImages.length > 0 ? qcImages : [mainImage].filter(Boolean);

    // Construir HTML del modal
    let modalHTML = '';

    if (images.length === 0) {
        modalHTML = `
            <div class="qc-no-images">
                <div class="qc-no-images-icon">📷</div>
                <p>No hay imágenes QC disponibles para este producto</p>
            </div>
        `;
    } else {
        // Imagen principal
        modalHTML = `
            <div class="qc-main-image-container">
                <img src="${images[0]}" alt="${escapeHtml(product.nombre || 'Producto')}" class="qc-main-image" id="qcMainImage" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback-srcs="${escapeHtml(buildImageFallbackAttribute(productImageSources))}" onerror="handleProductImageError(this)">
            </div>
            ${images.length > 1 ? `
                <div class="qc-gallery" id="qcGallery">
                    ${images.map((img, index) => `
                        <div class="qc-gallery-item ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <img src="${img}" alt="QC ${index + 1}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="qc-product-info">
                <h3 class="qc-product-name">${escapeHtml(product.nombre || 'Producto')}</h3>
                <div class="qc-product-meta">
                    ${product.categoria ? `
                        <div class="qc-meta-item">
                            <span class="qc-meta-label">Categoría</span>
                            <span class="qc-meta-value">${escapeHtml(product.categoria)}</span>
                        </div>
                    ` : ''}
                    ${product.calidad ? `
                        <div class="qc-meta-item">
                            <span class="qc-meta-label">Calidad</span>
                            <span class="qc-meta-value">${escapeHtml(product.calidad)}</span>
                        </div>
                    ` : ''}
                    ${product.precio_cny ? `
                        <div class="qc-meta-item">
                            <span class="qc-meta-label">Precio</span>
                            <span class="qc-meta-value">${formatPrice(product.precio_cny)} CNY</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    qcModalBody.innerHTML = modalHTML;

    // Agregar event listeners para la galería
    if (images.length > 1) {
        const galleryItems = qcModalBody.querySelectorAll('.qc-gallery-item');
        const mainImageEl = document.getElementById('qcMainImage');

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Remover clase active de todos los items
                galleryItems.forEach(i => i.classList.remove('active'));
                // Agregar clase active al item clickeado
                item.classList.add('active');
                // Cambiar imagen principal
                if (mainImageEl) {
                    mainImageEl.src = images[index];
                }
            });
        });
    }

    // Mostrar modal
    qcModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal QC
function closeQCModal() {
    const qcModal = document.getElementById('qcModal');
    if (qcModal) {
        qcModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Inicializar eventos del modal QC
function initQCModal() {
    const qcModal = document.getElementById('qcModal');
    const qcModalClose = document.getElementById('qcModalClose');
    const qcModalBackdrop = qcModal?.querySelector('.qc-modal-backdrop');

    if (!qcModal) return;

    // Cerrar con botón X
    if (qcModalClose) {
        qcModalClose.addEventListener('click', closeQCModal);
    }

    // Cerrar con backdrop
    if (qcModalBackdrop) {
        qcModalBackdrop.addEventListener('click', closeQCModal);
    }

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && qcModal.classList.contains('active')) {
            closeQCModal();
        }
    });

    // Agregar event listeners a las imágenes de productos
    // Esto se ejecutará después de que se rendericen los productos
    const observer = new MutationObserver(() => {
        attachQCListeners();
    });

    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
        observer.observe(productsGrid, { childList: true, subtree: true });
        // Ejecutar una vez al inicio
        attachQCListeners();
    }
}

// Adjuntar listeners a las imágenes de productos para abrir QC
function attachQCListeners() {
    const productImages = document.querySelectorAll('.product-card .product-image');

    productImages.forEach((imageContainer) => {
        // Evitar agregar múltiples listeners
        if (imageContainer.dataset.qcListener === 'true') return;
        imageContainer.dataset.qcListener = 'true';

        imageContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const card = imageContainer.closest('.product-card');
            if (!card) return;

            // Obtener información del producto desde el card
            const productName = card.querySelector('.product-name')?.textContent || '';
            const productCategory = card.querySelector('.product-meta')?.textContent || '';
            const productPrice = card.querySelector('.price-cny')?.getAttribute('data-price-cny') || '';
            const productImage = card.querySelector('.product-image img')?.src || '';
            const productQuality = card.querySelector('.product-quality')?.textContent || '';

            // Construir objeto producto
            const product = {
                nombre: productName,
                categoria: productCategory,
                precio_cny: parseFloat(productPrice) || 0,
                imagen_url: productImage,
                calidad: productQuality,
                qc_images: [] // Por ahora vacío, se puede expandir después
            };

            // Si hay múltiples imágenes en el card, agregarlas
            const allImages = card.querySelectorAll('.product-image img');
            if (allImages.length > 1) {
                product.qc_images = Array.from(allImages).map(img => img.src);
            }

            openQCModal(product);
        });
    });
}

// Inicializar modal QC cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQCModal);
} else {
    initQCModal();
}

// ============================================
// DATABASE STATS (Base de Datos Stats)
// ============================================

// Cargar estadísticas de la base de datos
async function loadDatabaseStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalCategoriesEl = document.getElementById('totalCategories');
    const totalQualityEl = document.getElementById('totalQuality');
    const lastUpdateEl = document.getElementById('lastUpdate');

    if (!totalProductsEl) return; // Solo ejecutar en página de productos

    try {
        const headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        };

        // Obtener todos los productos activos
        const query = `${SUPABASE_REST_URL}/products_clean?select=id,categoria,calidad,created_at&activo=eq.true&source_url=not.is.null&source_url=neq.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await secureSupabaseFetch(query, {
            headers: headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`Error ${res.status}`);
        }

        const products = await res.json();

        // Calcular estadísticas
        const totalProducts = products.length;

        // Contar categorías únicas
        const categories = new Set();
        products.forEach(p => {
            if (p.categoria) {
                categories.add(p.categoria);
            }
        });
        const totalCategories = categories.size;

        // Contar productos calidad 1:1
        const quality1to1 = products.filter(p =>
            p.calidad && p.calidad.toLowerCase().includes('1:1')
        ).length;

        // Obtener fecha de última actualización (producto más reciente)
        let lastUpdate = 'N/A';
        if (products.length > 0) {
            const sortedProducts = products
                .filter(p => p.created_at)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (sortedProducts.length > 0) {
                const lastDate = new Date(sortedProducts[0].created_at);
                const now = new Date();
                const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    lastUpdate = 'Hoy';
                } else if (diffDays === 1) {
                    lastUpdate = 'Ayer';
                } else if (diffDays < 7) {
                    lastUpdate = `Hace ${diffDays} días`;
                } else {
                    lastUpdate = lastDate.toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short'
                    });
                }
            }
        }

        // Actualizar UI con animación
        animateValue(totalProductsEl, 0, totalProducts, 1000);
        animateValue(totalCategoriesEl, 0, totalCategories, 1000);
        animateValue(totalQualityEl, 0, quality1to1, 1000);

        if (lastUpdateEl) {
            lastUpdateEl.textContent = lastUpdate;
        }

    } catch (error) {
        console.error('Error loading database stats:', error);
        // Mostrar valores por defecto
        if (totalProductsEl) totalProductsEl.textContent = '1,500+';
        if (totalCategoriesEl) totalCategoriesEl.textContent = '6+';
        if (totalQualityEl) totalQualityEl.textContent = '500+';
        if (lastUpdateEl) lastUpdateEl.textContent = 'Reciente';
    }
}

// Función para animar valores numéricos
function animateValue(element, start, end, duration) {
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        // Formatear número con separador de miles
        const formatted = Math.floor(current).toLocaleString('es-AR');
        element.textContent = formatted;
    }, 16);
}

// Cargar estadísticas cuando la página esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('productos.html')) {
            loadDatabaseStats();
        }
    });
} else {
    if (window.location.pathname.includes('productos.html')) {
        loadDatabaseStats();
    }
}

// Exchange rates (will be updated from API if available)
// Base currency is now CNY (products prices are stored in CNY)
let exchangeRates = {
    CNY: 1.0,    // Base currency
    USD: 0.155,  // 1 CNY = 0.155 USD (tasa aproximada)
    ARS: 1455,   // 1 USD = 1455 ARS (dólar oficial, se actualiza desde API)
    CLP: 930     // 1 USD = 930 CLP (tasa aproximada)
};

// Function to fetch exchange rates
async function fetchExchangeRates() {
    try {
        // Use external API directly (dolarsi - more reliable)
        try {
            const response = await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales');
            if (response.ok) {
                const data = await response.json();
                // Find "Dolar Oficial" in the response
                const oficial = data.find(item => item.casa.nombre === 'Dolar Oficial');
                if (oficial && oficial.casa.venta) {
                    const ventaOficial = parseFloat(oficial.casa.venta.replace(',', '.'));
                    if (!isNaN(ventaOficial) && ventaOficial > 0) {
                        // 1 USD = ventaOficial ARS
                        // Actualizar la tasa ARS/USD
                        exchangeRates.ARS = ventaOficial;
                        console.log('Exchange rate updated: 1 USD =', ventaOficial, 'ARS');
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Error fetching exchange rates, using default:', e);
            // Fallback to default rate (1455 ARS per USD)
            exchangeRates.ARS = 1455;
        }
    } catch (e) {
        console.warn('Error in fetchExchangeRates, using default:', e);
        // Keep default rates
        exchangeRates.ARS = 1455;
    }
}

// Function to update all product prices based on selected currency (optimizado)
function updateProductPrices(selectedCurrency) {
    const priceElements = document.querySelectorAll('.price-cny[data-price-cny]');

    // Pre-calcular formato según moneda para evitar cálculos repetidos
    let formatPriceFn;
    switch (selectedCurrency) {
        case 'CNY':
            formatPriceFn = (priceCNY) => `¥${priceCNY.toFixed(2)} CNY`;
            break;
        case 'USD':
            formatPriceFn = (priceCNY) => {
                const convertedPrice = priceCNY * exchangeRates.USD;
                return `$${convertedPrice.toFixed(2)} USD`;
            };
            break;
        case 'ARS':
            formatPriceFn = (priceCNY) => {
                // Convertir CNY -> USD -> ARS
                // exchangeRates.USD = 0.155 (1 CNY = 0.155 USD)
                // exchangeRates.ARS = dólar oficial ARS/USD (ej: 1455)
                // Primero convertir CNY a USD, luego USD a ARS
                const priceUSD = priceCNY * exchangeRates.USD;
                const convertedPrice = priceUSD * exchangeRates.ARS;
                // Redondear y formatear sin decimales para ARS
                const roundedPrice = Math.round(convertedPrice);
                return `$${roundedPrice.toLocaleString('es-AR')} ARS`;
            };
            break;
        case 'CLP':
            formatPriceFn = (priceCNY) => {
                // Convertir CNY -> USD -> CLP
                const priceUSD = priceCNY * exchangeRates.USD;
                const convertedPrice = priceUSD * exchangeRates.CLP;
                const roundedPrice = Math.round(convertedPrice);
                return `$${roundedPrice.toLocaleString('es-CL')} CLP`;
            };
            break;
        default:
            formatPriceFn = (priceCNY) => `¥${priceCNY.toFixed(2)} CNY`;
    }

    // Usar requestAnimationFrame para batch updates si hay muchos elementos
    if (priceElements.length > 20) {
        let index = 0;
        const updateBatch = () => {
            const batchSize = 10;
            const end = Math.min(index + batchSize, priceElements.length);

            for (let i = index; i < end; i++) {
                const priceEl = priceElements[i];
                const originalPriceText = priceEl.getAttribute('data-price-cny');
                if (!originalPriceText) continue;

                const priceCNY = parseFloat(originalPriceText);
                if (isNaN(priceCNY)) continue;

                const formattedPrice = formatPriceFn(priceCNY);
                priceEl.textContent = formattedPrice;
            }

            index = end;
            if (index < priceElements.length) {
                requestAnimationFrame(updateBatch);
            }
        };
        requestAnimationFrame(updateBatch);
    } else {
        // Para pocos elementos, actualizar directamente
        priceElements.forEach(priceEl => {
            const originalPriceText = priceEl.getAttribute('data-price-cny');
            if (!originalPriceText) return;

            const priceCNY = parseFloat(originalPriceText);
            if (isNaN(priceCNY)) return;

            const formattedPrice = formatPriceFn(priceCNY);
            priceEl.textContent = `¥${formattedPrice}`;
        });
    }
}

// Load saved preferences on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch exchange rates first
    await fetchExchangeRates();

    // Asegurar que el tema guardado se mantenga (sincronizar con el guardado)
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    const currentTheme = document.documentElement.getAttribute('data-theme');
    // Solo aplicar si el tema actual es diferente al guardado (evita cambios innecesarios)
    if (currentTheme !== savedTheme) {
        applyTheme(savedTheme);
    }

    const savedCurrency = localStorage.getItem('selectedCurrency');
    const savedAgent = localStorage.getItem('selectedAgent');

    if (savedCurrency && currencyOptions && currencyOptions.length > 0) {
        currencyOptions.forEach(option => {
            if (option.getAttribute('data-currency') === savedCurrency) {
                currencyOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                // Update prices with saved currency
                updateProductPrices(savedCurrency);
            }
        });
    } else {
        // Default to CNY if no saved preference
        const defaultCurrency = 'CNY';
        updateProductPrices(defaultCurrency);
    }

    if (savedAgent && agentOptions && agentOptions.length > 0) {
        agentOptions.forEach(option => {
            if (option.getAttribute('data-agent') === savedAgent) {
                agentOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                updateProductLinks(savedAgent);
            }
        });
    } else {
        // Default to KakoBuy if no saved preference
        const defaultAgent = 'KakoBuy';
        // Update links if we're on a page with products
        if (document.querySelectorAll('a[data-agent-link]').length > 0) {
            updateProductLinks(defaultAgent);
        }
    }
});

// ============================================
// ARGENTINA TAX CALCULATOR
// ============================================
// Safe, isolated calculator that only runs if elements exist
// Does not interfere with other site features

document.addEventListener("DOMContentLoaded", () => {
    // Get calculator elements
    const compraInput = document.getElementById("compraUSD");
    const envioInput = document.getElementById("envioUSD");
    const impuestosUSD = document.getElementById("impuestosUSD");
    const impuestosARS = document.getElementById("impuestosARS");
    const limpiarBtn = document.getElementById("limpiarCalc");
    const toggleFranquicia = document.getElementById("toggleFranquicia");
    const toggleTasaGestion = document.getElementById("toggleTasaGestion");
    const calculationSummary = document.getElementById("calculationSummary");
    const franquiciaStatus = document.getElementById("franquiciaStatus");
    const configAccordionToggle = document.getElementById("configAccordionToggle");
    const configCard = document.getElementById("configCard");

    // Safety check: exit if calculator elements don't exist
    if (!compraInput || !envioInput || !impuestosUSD || !impuestosARS || !limpiarBtn) {
        return; // Calculator not on this page, exit silently
    }

    // Get UI elements for exchange rates
    const dolarOficialDisplay = document.getElementById("dolarOficial");
    const contadoLiquiDisplay = document.getElementById("contadoLiqui");

    // Constants
    let DOLAR_OFICIAL = 1455; // Default value, will be updated from API
    let CONTADO_LIQUI = 1513.90; // Default value, will be updated from API
    const FRANQUICIA = 50; // $50 USD
    const TASA_GESTION = 4.95; // $4.95 USD

    // Fetch exchange rates from API
    async function fetchExchangeRates() {
        try {
            // Use external API directly (dolarsi - more reliable)
            try {
                const response = await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales');
                if (response.ok) {
                    const data = await response.json();
                    // Find "Dolar Oficial" in the response
                    const oficial = data.find(item => item.casa.nombre === 'Dolar Oficial');
                    const ccl = data.find(item => item.casa.nombre === 'Contado con Liquidacion' || item.casa.nombre === 'Dolar Contado con Liquidacion');

                    if (oficial && oficial.casa.venta) {
                        const ventaOficial = parseFloat(oficial.casa.venta.replace(',', '.'));
                        if (!isNaN(ventaOficial)) {
                            DOLAR_OFICIAL = ventaOficial;
                            if (dolarOficialDisplay) {
                                dolarOficialDisplay.textContent = `$${DOLAR_OFICIAL.toFixed(2)}`;
                            }
                        }
                    }

                    if (ccl && ccl.casa.venta) {
                        const ventaCCL = parseFloat(ccl.casa.venta.replace(',', '.'));
                        if (!isNaN(ventaCCL)) {
                            CONTADO_LIQUI = ventaCCL;
                            if (contadoLiquiDisplay) {
                                contadoLiquiDisplay.textContent = `$${CONTADO_LIQUI.toFixed(2)}`;
                            }
                        }
                    }
                }
            } catch (e) {
                // Keep default values
            }

            // Update calculation if rates changed
            calcular();

        } catch (error) {
            // Keep default values
        }
    }

    // Fetch rates on page load (usar requestIdleCallback si está disponible)
    if ('requestIdleCallback' in window) {
        requestIdleCallback(fetchExchangeRates, { timeout: 2000 });
    } else {
        setTimeout(fetchExchangeRates, 100);
    }

    // Refresh rates every 30 minutes (optimizado para no bloquear)
    setInterval(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(fetchExchangeRates);
        } else {
            fetchExchangeRates();
        }
    }, 30 * 60 * 1000);

    // Animate number update
    function animateNumber(element) {
        element.classList.add("animate");
        setTimeout(() => {
            element.classList.remove("animate");
        }, 400);
    }

    // Update franquicia status display
    function updateFranquiciaStatus(usarFranquicia) {
        if (!franquiciaStatus) return;

        if (usarFranquicia) {
            franquiciaStatus.textContent = "Franquicia aplicada: -$50";
        } else {
            franquiciaStatus.textContent = "Franquicia no aplicada";
        }
    }

    // Update calculation summary
    function updateSummary(usarTasaGestion) {
        if (!calculationSummary) return;

        let summary = "Estimación: 50% de la base imponible";
        if (usarTasaGestion) {
            summary += " + tasa fija ($4.95 USD)";
        }
        calculationSummary.textContent = summary;
    }

    // Calculation function
    function calcular() {
        // Get input values (default to 0 if empty or invalid)
        const compra = parseFloat(compraInput.value) || 0;
        const envio = parseFloat(envioInput.value) || 0;

        // Calculate total USD
        const totalUSD = compra + envio;

        // Check if franquicia is enabled
        const usarFranquicia = toggleFranquicia ? toggleFranquicia.checked : true;
        const usarTasaGestion = toggleTasaGestion ? toggleTasaGestion.checked : true;

        // Calculate taxable base based on franquicia status
        let baseImponible;
        if (usarFranquicia) {
            // If franquicia is ON: subtract $50 from the total (minimum 0)
            baseImponible = Math.max(0, totalUSD - FRANQUICIA);
        } else {
            // If franquicia is OFF: no discount, full total is taxable
            baseImponible = totalUSD;
        }

        // Calculate taxes: (taxableBase * 0.5) + tasa de gestión (if enabled)
        let impuestos = (baseImponible * 0.5);
        if (usarTasaGestion) {
            impuestos += TASA_GESTION;
        }

        // Store previous values to detect changes
        const prevUSD = impuestosUSD.textContent;
        const prevARS = impuestosARS.textContent;

        // Format and display USD (2 decimals)
        impuestosUSD.textContent = `$${impuestos.toFixed(2)}`;

        // Convert to ARS and format (es-AR locale)
        const impuestosARSValue = impuestos * DOLAR_OFICIAL;
        impuestosARS.textContent = `$${impuestosARSValue.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        })}`;

        // Update dollar note in ARS result box
        const dolarOficialNote = document.getElementById("dolarOficialNote");
        if (dolarOficialNote) {
            dolarOficialNote.textContent = `Dólar Oficial: $${DOLAR_OFICIAL.toFixed(2)}`;
        }

        // Animate if values changed
        if (prevUSD !== impuestosUSD.textContent) {
            animateNumber(impuestosUSD);
        }
        if (prevARS !== impuestosARS.textContent) {
            animateNumber(impuestosARS);
        }

        // Update UI status displays
        updateFranquiciaStatus(usarFranquicia);
        updateSummary(usarTasaGestion);
    }

    // Add event listeners for real-time calculation
    compraInput.addEventListener("input", calcular);
    envioInput.addEventListener("input", calcular);

    // Toggle listeners
    if (toggleFranquicia) {
        toggleFranquicia.addEventListener("change", calcular);
    }
    if (toggleTasaGestion) {
        toggleTasaGestion.addEventListener("change", calcular);
    }

    // Clear button functionality
    limpiarBtn.addEventListener("click", () => {
        compraInput.value = "";
        envioInput.value = "";
        impuestosUSD.textContent = "$0.00";
        impuestosARS.textContent = "$0.00";
        if (calculationSummary) {
            calculationSummary.textContent = "Estimación: 50% de la base imponible + tasa fija (si aplica)";
        }
        if (franquiciaStatus) {
            const usarFranquicia = toggleFranquicia ? toggleFranquicia.checked : true;
            updateFranquiciaStatus(usarFranquicia);
        }
        animateNumber(impuestosUSD);
        animateNumber(impuestosARS);
    });


    // Initial calculation (in case there are pre-filled values)
    calcular();

    // Confirm calculator is connected
});


// ============================================
// REGISTRATION MODAL (Index page only)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const registerModal = document.getElementById('registerModal');
    const registerModalClose = document.getElementById('registerModalClose');
    const registerModalBackdrop = registerModal?.querySelector('.register-modal-backdrop');

    // Only show on index.html
    const isHomePage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname === '' ||
        !window.location.pathname.includes('.html');

    if (!registerModal || !isHomePage) return;

    // Show modal after page is fully loaded (optimized to prevent lag)
    // Usar delays más largos y CSS para animaciones suaves
    const showModal = () => {
        // Usar requestIdleCallback si está disponible para mejor rendimiento, sino requestAnimationFrame
        const show = () => {
            registerModal.classList.add('active');
            // Solo bloquear scroll en desktop
            if (window.innerWidth > 640) {
                document.body.style.overflow = 'hidden';
            }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(show, { timeout: 3000 });
        } else {
            setTimeout(() => requestAnimationFrame(show), 3000);
        }
    };

    // Esperar a que la página esté completamente cargada y el contenido principal renderizado
    if (document.readyState === 'complete') {
        setTimeout(showModal, 2000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(showModal, 2000);
        }, { once: true });
    }

    // Close modal function
    const closeModal = () => {
        registerModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close button
    if (registerModalClose) {
        registerModalClose.addEventListener('click', closeModal);
    }

    // Close on backdrop click
    if (registerModalBackdrop) {
        registerModalBackdrop.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && registerModal.classList.contains('active')) {
            closeModal();
        }
    });
});

// ============================================
// WHEEL WIDGET (Ruleta Flotante Siempre Visible)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const wheelWidget = document.getElementById('wheelWidget');
    const wheelToggleBtn = document.getElementById('wheelToggleBtn');
    const wheelPopup = document.getElementById('wheelPopup');
    const wheelPopupClose = document.getElementById('wheelPopupClose');
    const wheelSpinCenter = document.getElementById('wheelSpinCenter');
    const wheelMain = document.getElementById('wheelMain');
    const prizeModal = document.getElementById('prizeModal');
    const prizeCloseBtn = document.getElementById('prizeCloseBtn');
    const prizeText = document.getElementById('prizeText');

    // Solo mostrar en la página principal
    const isHomePage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname === '' ||
        !window.location.pathname.includes('.html');

    if (!wheelWidget || !isHomePage) return;

    let isSpinning = false;
    let isPopupOpen = false;

    // Verificar si ya giró hoy
    const lastSpinDate = localStorage.getItem('lastWheelSpin');
    const today = new Date().toDateString();
    const hasSpunToday = lastSpinDate === today;

    // Si ya giró hoy, cambiar el texto del botón
    if (hasSpunToday && wheelToggleBtn) {
        const toggleText = wheelToggleBtn.querySelector('.wheel-toggle-text');
        if (toggleText) {
            toggleText.textContent = 'Ya jugaste hoy';
        }
        wheelToggleBtn.style.opacity = '0.7';
    }

    // Toggle del popup
    const togglePopup = () => {
        if (hasSpunToday && !isPopupOpen) {
            // Si ya giró hoy, mostrar mensaje
            return;
        }

        isPopupOpen = !isPopupOpen;
        if (wheelPopup) {
            wheelPopup.classList.toggle('active', isPopupOpen);
        }
    };

    if (wheelToggleBtn) {
        wheelToggleBtn.addEventListener('click', togglePopup);
    }

    // Cerrar popup
    const closePopup = () => {
        isPopupOpen = false;
        if (wheelPopup) {
            wheelPopup.classList.remove('active');
        }
    };

    if (wheelPopupClose) {
        wheelPopupClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closePopup();
        });
    }

    // Cerrar modal de premio
    const closePrizeModal = () => {
        if (prizeModal) {
            prizeModal.classList.remove('active');
        }
    };

    if (prizeCloseBtn) {
        prizeCloseBtn.addEventListener('click', closePrizeModal);
    }

    if (prizeModal) {
        prizeModal.querySelector('.prize-modal-backdrop')?.addEventListener('click', closePrizeModal);
    }

    // Función para girar la ruleta (optimizada con GPU acceleration)
    const spinWheel = () => {
        if (isSpinning || hasSpunToday) return;

        isSpinning = true;
        if (wheelSpinCenter) {
            wheelSpinCenter.disabled = true;
        }
        if (wheelMain) {
            wheelMain.classList.add('spinning');
            // Forzar GPU acceleration
            wheelMain.style.willChange = 'transform';
            wheelMain.style.transform = 'translateZ(0)';
        }

        // Siempre termina en "Envío Gratis" (posición 0, 90, 180, o 270 grados)
        // Usamos posición 0 (primer segmento)
        const targetAngle = 0;
        const spins = 5; // Vueltas completas
        const finalAngle = spins * 360 + (360 - targetAngle);

        // Usar requestAnimationFrame para suavizar la animación
        requestAnimationFrame(() => {
            if (wheelMain) {
                wheelMain.style.transform = `translateZ(0) rotate(${finalAngle}deg)`;
            }
        });

        // Después de la animación (3 segundos)
        setTimeout(() => {
            isSpinning = false;
            if (wheelMain) {
                wheelMain.classList.remove('spinning');
                // Limpiar will-change después de la animación para mejor rendimiento
                wheelMain.style.willChange = 'auto';
            }

            // Guardar que ya giró hoy
            localStorage.setItem('lastWheelSpin', today);

            // Mostrar modal de premio
            if (prizeText) {
                prizeText.textContent = 'Envío Gratis';
            }
            closePopup();

            setTimeout(() => {
                if (prizeModal) {
                    prizeModal.classList.add('active');
                }

                // Actualizar botón
                if (wheelToggleBtn) {
                    const toggleText = wheelToggleBtn.querySelector('.wheel-toggle-text');
                    if (toggleText) {
                        toggleText.textContent = 'Ya jugaste hoy';
                    }
                    wheelToggleBtn.style.opacity = '0.7';
                }
            }, 300);
        }, 3000);
    };

    if (wheelSpinCenter) {
        wheelSpinCenter.addEventListener('click', spinWheel);
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isPopupOpen) {
                closePopup();
            }
            if (prizeModal && prizeModal.classList.contains('active')) {
                closePrizeModal();
            }
        }
    });
});

// ============================================
// COMO COMPRAR - STEP ACCORDIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const stepHeaders = document.querySelectorAll('.step-header');

    stepHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const stepNumber = header.getAttribute('data-step');
            const content = document.getElementById(`step-content-${stepNumber}`);

            if (!content) return;

            // Toggle active state
            const isActive = header.classList.contains('active');

            // Toggle current step
            if (isActive) {
                header.classList.remove('active');
                content.classList.remove('expanded');
            } else {
                header.classList.add('active');
                content.classList.add('expanded');
            }
        });
    });

    // Open first step by default
    const firstStep = document.querySelector('.step-header[data-step="1"]');
    if (firstStep) {
        const firstContent = document.getElementById('step-content-1');
        if (firstContent) {
            firstStep.classList.add('active');
            firstContent.classList.add('expanded');
        }
    }
});

// ============================================
// LOAD PRODUCTS FROM SUPABASE
// ============================================

// ============================================
// PROTECCIÓN DE SEGURIDAD
// ============================================



// ===== SUPABASE CONFIG =====
// ===== SUPABASE API BACKEND =====
const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";

// En local y producción usamos la key directa para asegurar que los productos carguen.
// Nota: Esta llave es pública ("anon") y el acceso está controlado por políticas de lectura en Supabase.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

/**
 * Función central de fetch para Supabase.
 * Inyecta las llaves directamente desde el cliente para asegurar el funcionamiento en la web en vivo.
 */
async function secureSupabaseFetch(url, options = {}) {
    const headers = {
        ...(options.headers || {}),
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    };

    // Normalizamos la URL: si empieza con el prefijo del proxy, lo cambiamos por la URL directa
    const cleanUrl = url.startsWith('/api/supabase')
        ? url.replace('/api/supabase', `${SUPABASE_URL}/rest/v1`)
        : url;

    return fetch(cleanUrl, { ...options, headers });
}


const LOCAL_PRODUCTS_PATH = 'data/products.local.json';
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos (era 60 segundos)
const LOCAL_PRODUCT_PLACEHOLDER = '/images/placeholder-product.svg';
const PRODUCT_IMAGE_FALLBACK_SEPARATOR = '||';
const KAKOBUY_IMAGE_FIELD_CANDIDATES = [
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
const SUPABASE_IMAGE_FIELD_CANDIDATES = [
    'supabase_image_url',
    'imagen_url',
    'image_url',
    'image',
    'imagen'
];
const INVALID_KAKOBUY_IMAGE_MARKERS = [
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

let catalogCache = {
    data: null,
    expiresAt: 0,
    promise: null
};

/* ---- localStorage persistence helpers (stale-while-revalidate) ---- */
const LS_CATALOG_KEY = '__rh_catalog_v11'; // v11: fixed local products prices (usd to cny)
const LS_CATALOG_TTL = 24 * 60 * 60 * 1000; // 24 horas
// Purge stale cache from previous versions
try { localStorage.removeItem('__rh_catalog_v10'); localStorage.removeItem('__rh_catalog_v9'); localStorage.removeItem('__rh_catalog_v8'); localStorage.removeItem('__rh_catalog_v7'); localStorage.removeItem('__rh_catalog_v6'); localStorage.removeItem('__rh_catalog_v5'); localStorage.removeItem('__rh_catalog_v4'); localStorage.removeItem('__rh_catalog_v3'); } catch (_) {}

function saveCatalogToLS(products) {
    try {
        const payload = JSON.stringify({ ts: Date.now(), data: products });
        // Comprimir guardando solo los campos que necesitamos para mostrar
        localStorage.setItem(LS_CATALOG_KEY, payload);
    } catch (e) {
        // QuotaExceeded - no bloquear
        try { localStorage.removeItem(LS_CATALOG_KEY); } catch (_) { }
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
}

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
    if (!url || typeof url !== 'string') {
        return '';
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        return '';
    }

    // Proxy Yupoo images to bypass 403 Forbidden anti-hotlinking
    if (trimmedUrl.includes('yupoo.com') && !trimmedUrl.includes('/api/imag')) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const proxyBase = isLocal ? 'https://argenreps.vercel.app' : '';
        const proxyPath = '/api/image';
        return `${proxyBase}${proxyPath}?url=${encodeURIComponent(trimmedUrl)}`;
    }

    return normalizeImgurUrl(trimmedUrl);
}

function isLikelyRenderableImageUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const normalizedUrl = url.trim();
    if (!normalizedUrl) {
        return false;
    }

    if (normalizedUrl.startsWith('/')) {
        return true;
    }

    if (/^data:image\//i.test(normalizedUrl)) {
        return true;
    }

    if (!/^https?:\/\//i.test(normalizedUrl)) {
        return false;
    }

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
    if (!normalizedUrl || !isLikelyRenderableImageUrl(normalizedUrl)) {
        return '';
    }

    const lowerUrl = normalizedUrl.toLowerCase();
    if (INVALID_KAKOBUY_IMAGE_MARKERS.some(marker => lowerUrl.includes(marker))) {
        return '';
    }

    return normalizedUrl;
}

function getValidFallbackProductImage(url) {
    const normalizedUrl = normalizeRemoteImageUrl(url);
    if (!normalizedUrl || !isLikelyRenderableImageUrl(normalizedUrl)) {
        return '';
    }

    return normalizedUrl;
}

function resolveProductImageSources(product) {
    const rawKakobuy = pickFirstNonEmptyFieldValue(product, KAKOBUY_IMAGE_FIELD_CANDIDATES);
    const rawSupabase = pickFirstNonEmptyFieldValue(product, SUPABASE_IMAGE_FIELD_CANDIDATES);

    const sources = [];
    if (rawKakobuy) {
        rawKakobuy.split(',').forEach(s => {
            const url = s.trim();
            const valid = getValidKakobuyProductImage(url);
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
    if (rawSupabase) {
        rawSupabase.split(',').forEach(s => {
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
    if (uniqueSources.length === 0) uniqueSources.push(LOCAL_PRODUCT_PLACEHOLDER);
    return uniqueSources;
}

function buildImageFallbackAttribute(imageSources) {
    return imageSources.slice(1).join(PRODUCT_IMAGE_FALLBACK_SEPARATOR);
}

function handleProductImageError(imgElement) {
    if (!imgElement) return;

    const fallbackQueue = String(imgElement.dataset.fallbackSrcs || '')
        .split(PRODUCT_IMAGE_FALLBACK_SEPARATOR)
        .map(source => source.trim())
        .filter(Boolean);

    const nextSource = fallbackQueue.shift();

    if (nextSource && imgElement.src !== nextSource) {
        imgElement.dataset.fallbackSrcs = fallbackQueue.join(PRODUCT_IMAGE_FALLBACK_SEPARATOR);
        imgElement.src = nextSource;
        return;
    }

    imgElement.onerror = null;
    imgElement.src = LOCAL_PRODUCT_PLACEHOLDER;
    imgElement.classList.add('is-placeholder');
}

// ====================================================================
// AFFILIATE LINK SECURITY CONSTANTS
// Change AFFILIATE_CODE here to update ALL outbound links globally.
// ====================================================================
const AFFILIATE_CODE = 'gonza';
const KAKOBUY_GATEWAY = 'https://www.kakobuy.com/item/details';
const FOREIGN_AFFILIATE_PARAMS = [
    'affcode', 'aff_code', 'aff', 'ref', 'referral',
    'inviteCode', 'invite_code', 'invitation_code',
    'promotionCode', 'promotion_code', 'promo',
    'partner', 'channel', 'from', 'utm_source'
];

// ====================================================================
// cleanDirectLink — ESCENARIO A: Limpieza de links directos y de agentes
// Extrae la URL base de plataforma (Weidian/1688/Taobao) desde cualquier
// formato: links de kakobuy, oopbuy, cssbuy, hubbuy, mulebuy, directos.
// Elimina todos los affiliate codes ajenos con URLSearchParams.
// ====================================================================
function cleanDirectLink(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    let baseProductUrl = null;

    // 1. Kakobuy links: extract the url= parameter
    if (trimmed.includes('kakobuy.com') && (trimmed.includes('details') || trimmed.includes('url='))) {
        const urlParamMatch = trimmed.match(/[?&]url=([^&]+)/);
        if (urlParamMatch && urlParamMatch[1]) {
            try {
                let decoded = decodeURIComponent(urlParamMatch[1]);
                if (decoded.includes('%')) {
                    try { decoded = decodeURIComponent(decoded); } catch (_) {}
                }
                baseProductUrl = decoded;
            } catch (_) {}
        }
    }

    // 2. Other agent links: extract via extractBaseUrlFromAgentLink
    if (!baseProductUrl && (trimmed.includes('hubbuycn.com') || trimmed.includes('mulebuy.com') ||
        trimmed.includes('cssbuy.com') || trimmed.includes('oopbuy.com') || trimmed.includes('hipobuy') || trimmed.includes('litbuy.com'))) {
        baseProductUrl = extractBaseUrlFromAgentLink(trimmed);
    }

    // 3. Direct platform link: use as-is
    if (!baseProductUrl && (trimmed.includes('weidian.com') || trimmed.includes('1688.com') || trimmed.includes('taobao.com'))) {
        baseProductUrl = trimmed;
    }

    if (!baseProductUrl) return trimmed; // Return original if we can't extract

    // 4. Strip ALL foreign affiliate params from the base URL using URLSearchParams
    try {
        const parsed = new URL(baseProductUrl);
        FOREIGN_AFFILIATE_PARAMS.forEach(param => parsed.searchParams.delete(param));
        baseProductUrl = parsed.toString();
    } catch (_) {
        // Regex fallback for malformed URLs
        FOREIGN_AFFILIATE_PARAMS.forEach(param => {
            baseProductUrl = baseProductUrl.replace(new RegExp(`[?&]${param}=[^&]*`, 'gi'), '');
        });
        baseProductUrl = baseProductUrl.replace(/[?&]$/, '');
    }

    return baseProductUrl;
}

// ====================================================================
// resolveShortLink — ESCENARIO B: Links acortadores (ikako.vip / share)
// Los links ikako.vip ocultan la URL real del producto. Esta función
// intenta resolver el redirect para obtener la URL de destino.
// Si falla (CORS), construye un link directo de Kakobuy con el path.
// ====================================================================
async function resolveShortLink(shortUrl) {
    if (!shortUrl || typeof shortUrl !== 'string') return '';
    const trimmed = shortUrl.trim();

    // Only process known shortener domains
    if (!trimmed.includes('ikako.vip') && !trimmed.includes('kakobuy.com/share') && !trimmed.includes('sl.kakobuy.com')) {
        return trimmed;
    }

    // Strategy 1: Try to follow the redirect with fetch (manual redirect)
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(trimmed, {
            method: 'HEAD',
            redirect: 'manual',
            signal: controller.signal
        });
        clearTimeout(timeout);

        // Check for redirect Location header
        const location = response.headers.get('location');
        if (location && (location.includes('weidian.com') || location.includes('1688.com') ||
            location.includes('taobao.com') || location.includes('kakobuy.com'))) {
            // Clean the resolved URL and rebuild with gonza
            return cleanDirectLink(location);
        }
    } catch (_) {
        // CORS or network error — expected for cross-origin shorteners
    }

    // Strategy 2: If ikako.vip, it's Kakobuy's shortener. Try to extract product ID.
    // ikako.vip links typically redirect to kakobuy.com/item/details?url=...
    // Since we can't resolve CORS, return the short URL as-is (the click interceptor will handle it)
    return trimmed;
}

// Unified source URL cleaner — used during product normalization
// Handles both direct links (Escenario A) and marks shorteners for async resolution
function cleanSourceUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    // Shortener links: keep as-is during sync normalization (resolved at click time)
    if (trimmed.includes('ikako.vip') || trimmed.includes('kakobuy.com/share')) {
        return trimmed;
    }

    // Direct/agent links: clean immediately
    return cleanDirectLink(trimmed);
}

function normalizeCatalogProduct(rawProduct, index = 0, source = 'local') {
    if (!rawProduct || typeof rawProduct !== 'object') return null;

    const kakobuyImageUrl = getValidKakobuyProductImage(
        pickFirstNonEmptyFieldValue(rawProduct, KAKOBUY_IMAGE_FIELD_CANDIDATES)
    );
    const supabaseImageUrl = getValidFallbackProductImage(
        pickFirstNonEmptyFieldValue(rawProduct, SUPABASE_IMAGE_FIELD_CANDIDATES)
    );

    const normalized = {
        ...rawProduct,
        id: rawProduct.id ?? `${source}-${index}`,
        _source: source, // 'supabase' (manual) or 'local' (extracted)
        nombre: rawProduct.nombre || rawProduct.name || 'Producto sin nombre',
        categoria: rawProduct.categoria || rawProduct.category || '',
        descripcion: rawProduct.descripcion || rawProduct.description || '',
        calidad: rawProduct.calidad || rawProduct.quality || '',
        precio_cny: parseFloat(
            rawProduct.precio_cny ??
            rawProduct.precio ??
            rawProduct.price_cny ??
            rawProduct.price ??
            0
        ) || 0,
        imagen_url: supabaseImageUrl,
        supabase_image_url: supabaseImageUrl,
        kakobuy_image_url: kakobuyImageUrl,
        source_url: cleanSourceUrl(rawProduct.source_url || rawProduct.url || rawProduct.link || ''),
        created_at: rawProduct.created_at || rawProduct.createdAt || new Date(0).toISOString(),
        activo: rawProduct.activo !== false,
        // Only allow products manually added (supabase) to be featured
        destacado: source === 'supabase' && (rawProduct.destacado === true || rawProduct.destacado === 'true' || rawProduct.destacado === 1),
        qc_images: Array.isArray(rawProduct.qc_images) ? rawProduct.qc_images : []
    };

    // Remove products that have 'sin link' or empty links
    const rawLinkText = String(rawProduct.source_url || rawProduct.url || rawProduct.link || '').toLowerCase();
    if (!normalized.source_url || rawLinkText.includes('sin link')) {
        return null;
    }

    return normalized.activo ? normalized : null;
}

function buildProductDedupKey(product) {
    const sourceUrl = String(product.source_url || '').trim().toLowerCase();
    const nombre = String(product.nombre || '').trim().toLowerCase();
    const precio = String(product.precio_cny || 0).trim();
    return `${sourceUrl}|${nombre}|${precio}`;
}

async function fetchSupabaseCatalogProducts() {
    const headersTemplate = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "count=exact"
    };

    const query = `${SUPABASE_REST_URL}/products_clean?select=*&activo=eq.true&source_url=not.is.null&source_url=neq.&order=created_at.desc`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s para varias llamadas

    let allProducts = [];
    let offset = 0;
    const limit = 1000;
    let fetchMore = true;

    try {
        while (fetchMore) {
            const headers = { ...headersTemplate, "Range": `${offset}-${offset + limit - 1}` };
            const res = await secureSupabaseFetch(query, {
                headers,
                signal: controller.signal,
                cache: 'default'
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(`Supabase error ${res.status}: ${txt}`);
                break; // Stop loading on error but return what we have
            }

            const products = await res.json();

            if (Array.isArray(products) && products.length > 0) {
                allProducts = allProducts.concat(products);
                offset += limit;
                if (products.length < limit) {
                    fetchMore = false;
                }
            } else {
                fetchMore = false;
            }
        }

        return allProducts
            .map((product, index) => normalizeCatalogProduct(product, index, 'supabase'))
            .filter(Boolean);

    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchLocalCatalogProducts() {
    try {
        const res = await fetch(LOCAL_PRODUCTS_PATH, {
            cache: 'default' // Usar HTTP cache del navegador
        });

        if (!res.ok) {
            if (res.status === 404) {
                return [];
            }
            throw new Error(`Local catalog error ${res.status}`);
        }

        const payload = await res.json();
        const products = Array.isArray(payload) ? payload : payload.products;

        if (!Array.isArray(products)) {
            console.warn('Local catalog exists but has an invalid format');
            return [];
        }

        return products
            .map((product, index) => normalizeCatalogProduct(product, index, 'local'))
            .filter(Boolean);
    } catch (error) {
        console.warn('Local catalog could not be loaded:', error);
        return [];
    }
}

async function getActiveCatalogProducts(options = {}) {
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
                        fetchSupabaseCatalogProducts(),
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
                fetchSupabaseCatalogProducts(),
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

// ====================================================================
// sortProducts — Centralized product sorting with hierarchy:
//   Priority 1: Destacado/Recommended (admin ❤️) → always first
//   Priority 2: Manually added via admin (supabase)
//   Priority 3: Extracted from another web (local JSON)
// Within each tier, secondary sort is by the user's selected mode (default newest).
// This is a pure post-fetch sort — it never mutates the data source.
// ====================================================================
function sortProducts(products, sortMode = 'recientes') {
    if (!Array.isArray(products) || products.length === 0) return products;

    // Helper: normalize the destacado flag (Supabase may return bool, string, or int)
    const isDestacado = (p) => p.destacado === true || p.destacado === 'true' || p.destacado === 1;

    // Step 1: Apply the user-selected sort criteria
    const sorted = [...products];

    switch (sortMode) {
        case 'precio-asc':
            sorted.sort((a, b) => parseFloat(a.precio_cny || 0) - parseFloat(b.precio_cny || 0));
            break;
        case 'precio-desc':
            sorted.sort((a, b) => parseFloat(b.precio_cny || 0) - parseFloat(a.precio_cny || 0));
            break;
        case 'nombre-asc':
            sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            break;
        case 'nombre-desc':
            sorted.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
            break;
        case 'recientes':
        default:
            sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            break;
    }

    // Step 2: Separate into the 3 requested tiers
    // This preserves the relative order from Step 1 within each group
    
    // Tier 1: Recommended products (destacado: true)
    const tier1_recommended = sorted.filter(p => isDestacado(p));
    
    // Tier 2: Manually added via admin (supabase) that are not recommended
    const tier2_manual = sorted.filter(p => !isDestacado(p) && p._source === 'supabase');
    
    // Tier 3: Extracted from another web (local json) that are not recommended
    const tier3_extracted = sorted.filter(p => !isDestacado(p) && p._source === 'local');

    // Handle any edge cases (unknown source)
    const tier4_other = sorted.filter(p => !isDestacado(p) && p._source !== 'supabase' && p._source !== 'local');

    return [...tier1_recommended, ...tier2_manual, ...tier3_extracted, ...tier4_other];
}

// Expose globally so product-overrides.js and other scripts can use it
if (typeof window !== 'undefined') {
    window.sortProducts = sortProducts;
}

// Extracted helper so both code paths share the same merge logic
function buildMergedCatalog(supabaseProducts, localProducts) {
    const dedupMap = new Map();
    // Process localProducts FIRST, then supabaseProducts SECOND.
    // This ensures that if a product exists in both, the Supabase (manual) version OVERRIDES the local (extracted) version.
    // Preserving the 'supabase' source and 'destacado' status.
    [...localProducts, ...supabaseProducts].forEach(product => {
        const key = buildProductDedupKey(product);
        dedupMap.set(key, product);
    });
    const merged = [];
    dedupMap.forEach(product => merged.push(product));

    // Use the centralized sortProducts with default 'recientes' mode
    // This applies the full hierarchy: destacado first, then by date
    return sortProducts(merged, 'recientes');
}


// Helper para escapar HTML
function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Helper para formatear precios
function formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return '0.00';
    }
    return parseFloat(price).toFixed(2);
}

// Convertir link base (weidian/1688/taobao) a link del agente seleccionado
// Conversión directa sin usar JadeShip (más rápido y confiable)
async function convertToAgentLink(baseUrl, agent) {
    if (!baseUrl || !baseUrl.trim() || !agent) {
        return '';
    }

    let url = baseUrl.trim();

    // Si el baseUrl es un link de agente, extraer el link base real
    if (url.includes('kakobuy.com') || url.includes('hubbuycn.com') || url.includes('mulebuy.com') || url.includes('cssbuy.com') || url.includes('oopbuy.com') || url.includes('litbuy.com')) {
        const extractedBase = extractBaseUrlFromAgentLink(url);
        if (extractedBase && (extractedBase.includes('weidian.com') || extractedBase.includes('1688.com') || extractedBase.includes('taobao.com'))) {
            url = extractedBase;
        } else {
            return '';
        }
    }

    // Verificar que sea un link base válido (si no, lo devolvemos tal cual para que el usuario al menos pueda hacer click)
    if (!url.includes('weidian.com') && !url.includes('1688.com') && !url.includes('taobao.com')) {
        return url;
    }

    // Extraer información del link base
    let productId = '';
    let platform = '';

    // Detectar plataforma y extraer ID
    // Weidian: https://weidian.com/item.html?itemID=7616832901
    const weidianMatch = url.match(/weidian\.com\/item\.html\?itemID=(\d+)/i);
    if (weidianMatch) {
        productId = weidianMatch[1];
        platform = 'WEIDIAN';
    }

    // 1688: https://detail.1688.com/offer/729540245968.html
    const ali1688Match = url.match(/1688\.com\/offer\/(\d+)/i);
    if (ali1688Match) {
        productId = ali1688Match[1];
        platform = 'ALI_1688';
    }

    // Taobao: https://item.taobao.com/item.htm?id=123456789
    const taobaoMatch = url.match(/taobao\.com\/item\.htm\?id=(\d+)/i);
    if (taobaoMatch) {
        productId = taobaoMatch[1];
        platform = 'TAOBAO';
    }

    if (!productId) {
        return '';
    }

    // Convertir según el agente
    switch (agent) {
        case 'KakoBuy':
        case 'Kakobuy':
        case 'kakobuy':
            // https://www.kakobuy.com/item/details?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7616832901&affcode=gonza
            const encodedUrl = encodeURIComponent(url);
            return `https://www.kakobuy.com/item/details?url=${encodedUrl}&affcode=gonza`;

        case 'CssBuy':
        case 'CSSBuy':
        case 'cssbuy':
            // Formato: item-{productId}.html?promotionCode=gonza
            if (productId) {
                return `https://www.cssbuy.com/item-${productId}.html?promotionCode=gonza`;
            }
            return url;

        case 'Oopbuy':
        case 'OOPBuy':
        case 'oopbuy':
            const platformLower = platform.toLowerCase();
            let oopbuyPlatform = platformLower;
            if (platform === 'ALI_1688') {
                oopbuyPlatform = '1688';
            } else if (platform === 'TAOBAO') {
                oopbuyPlatform = 'taobao';
            }
            return `https://oopbuy.com/product/${oopbuyPlatform}/${productId}?inviteCode=gonza`;

        case 'Hubbuy':
        case 'hubbuy':
            const encodedHubbuyUrl = encodeURIComponent(url);
            return `https://www.hubbuycn.com/product/item?url=${encodedHubbuyUrl}=product_link&invitation_code=gonza`;

        case 'MuleBuy':
        case 'Mulebuy':
        case 'mulebuy':
            return `https://mulebuy.com/product?id=${productId}&platform=${platform}&ref=gonza`;

        case 'LitBuy':
        case 'Litbuy':
        case 'litbuy':
            let litbuyPlatformId = '1'; // Default: Taobao
            if (platform === 'WEIDIAN') {
                litbuyPlatformId = '2';
            } else if (platform === 'ALI_1688') {
                litbuyPlatformId = '0';
            }
            return `https://litbuy.com/product/${litbuyPlatformId}/${productId}?inviteCode=GONZA`;

        default:
            // Si no coincide con ningún agente, retornar link original
            return url;
    }
}

// ====================================================================
// transformLink — Unified affiliate enforcer
// Takes ANY link format and returns Kakobuy with affcode=gonza.
// Delegates to cleanDirectLink for extraction and cleanup.
// ====================================================================
function transformLink(inputUrl) {
    if (!inputUrl || typeof inputUrl !== 'string') return '';
    const url = inputUrl.trim();
    if (!url || url === '#' || url.startsWith('javascript:')) return '';

    // If it's a shortener, we can't resolve synchronously — return empty
    // (the async click interceptor handles these)
    if (url.includes('ikako.vip') || url.includes('kakobuy.com/share')) return '';

    // Extract and clean the base platform URL
    const cleanBase = cleanDirectLink(url);
    if (!cleanBase || cleanBase === url) {
        // cleanDirectLink couldn't extract a platform URL
        // Check if the cleaned URL is actually a platform URL now
        if (!cleanBase || (!cleanBase.includes('weidian.com') && !cleanBase.includes('1688.com') && !cleanBase.includes('taobao.com'))) {
            return '';
        }
    }

    // Build the final Kakobuy link with affcode=gonza
    const finalBase = cleanBase.includes('weidian.com') || cleanBase.includes('1688.com') || cleanBase.includes('taobao.com')
        ? cleanBase : '';
    if (!finalBase) return '';

    const encodedBase = encodeURIComponent(finalBase);
    return `${KAKOBUY_GATEWAY}?url=${encodedBase}&affcode=${AFFILIATE_CODE}`;
}

// Expose globally
if (typeof window !== 'undefined') {
    window.transformLink = transformLink;
    window.cleanDirectLink = cleanDirectLink;
    window.resolveShortLink = resolveShortLink;
    window.AFFILIATE_CODE = AFFILIATE_CODE;
}

// ====================================================================
// Click Interceptor — Last line of defense
// Handles TWO scenarios:
//   1. Foreign affcodes → block, clean, redirect with gonza
//   2. Shortener links (ikako.vip) → resolve async, then redirect
// ====================================================================
document.addEventListener('click', function affiliateGuard(e) {
    const link = e.target.closest('a[data-agent-link]');
    if (!link) return;

    const currentHref = link.getAttribute('href');
    if (!currentHref || currentHref === '#' || currentHref.startsWith('javascript:')) return;

    // --- ESCENARIO B: Shortener link detected ---
    if (currentHref.includes('ikako.vip') || currentHref.includes('kakobuy.com/share') || currentHref.includes('sl.kakobuy.com')) {
        e.preventDefault();
        e.stopPropagation();

        // Show loading state on button
        const btnText = link.querySelector('.rs-btn-magic-text');
        const originalText = btnText ? btnText.textContent : link.textContent;
        if (btnText) btnText.textContent = 'Abriendo...';

        resolveShortLink(currentHref).then(resolvedUrl => {
            let finalUrl;
            if (resolvedUrl && resolvedUrl !== currentHref &&
                (resolvedUrl.includes('weidian.com') || resolvedUrl.includes('1688.com') || resolvedUrl.includes('taobao.com'))) {
                // Successfully resolved — build Kakobuy link with gonza
                finalUrl = `${KAKOBUY_GATEWAY}?url=${encodeURIComponent(resolvedUrl)}&affcode=${AFFILIATE_CODE}`;
            } else {
                // Couldn't resolve — open the shortener directly (still safer than moonreps)
                finalUrl = currentHref;
            }
            link.href = finalUrl;
            if (btnText) btnText.textContent = originalText;
            window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }).catch(() => {
            if (btnText) btnText.textContent = originalText;
            window.open(currentHref, '_blank', 'noopener,noreferrer');
        });
        return;
    }

    // --- ESCENARIO A: Foreign affcode detected ---
    const foreignAffcode = currentHref.match(/[?&]affcode=(?!gonza\b)([^&]+)/i);
    if (!foreignAffcode) return; // Clean link — allow navigation

    e.preventDefault();
    e.stopPropagation();

    const sanitized = transformLink(currentHref);
    if (sanitized) {
        link.href = sanitized;
        window.open(sanitized, '_blank', 'noopener,noreferrer');
    }
}, true); // Capture phase

// Normalizar URLs de Imgur al formato directo de imagen
function normalizeImgurUrl(url) {
    if (!url || typeof url !== 'string') {
        return url;
    }

    const originalUrl = url.trim();

    // Si no es Imgur, retornar tal cual
    if (!originalUrl.includes('imgur.com')) {
        return originalUrl;
    }

    // Si ya es formato directo (i.imgur.com), asegurar extensión
    if (originalUrl.includes('i.imgur.com')) {
        if (!originalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return originalUrl + '.jpg';
        }
        return originalUrl;
    }

    // Convertir imgur.com/XXXXX a i.imgur.com/XXXXX.jpg
    // Maneja: imgur.com/XXXXX, imgur.com/a/XXXXX, imgur.com/gallery/XXXXX
    const imgurMatch = originalUrl.match(/imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)(?:\.[a-z]+)?/);
    if (imgurMatch) {
        return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }

    return originalUrl;
}

// Función para mapear categorías basándose en el nombre y descripción del producto
function mapProductCategory(product) {
    const nombre = (product.nombre || '').toLowerCase();
    const categoria = (product.categoria || '').toLowerCase();
    const descripcion = (product.descripcion || '').toLowerCase();
    const textoCompleto = `${nombre} ${categoria} ${descripcion}`;

    // Conjuntos
    if (textoCompleto.includes('conjunto') || textoCompleto.includes('set') || textoCompleto.includes('tracksuit')) {
        return 'conjuntos';
    }

    // Calzado (Zapatillas) - Evitar falsos positivos
    const tieneZapatilla = textoCompleto.includes('zapatilla') || textoCompleto.includes('zapatillas') || textoCompleto.includes('sneaker') || textoCompleto.includes('shoe') || textoCompleto.includes('calzado');
    const palabrasExcluidasCalzado = ['box', 'caja', 'storage', 'cleaner', 'limpiador', 'brush', 'lace', 'cordón', 'insole', 'plantilla', 'sock', 'calcetín'];
    const tieneExcluidasCalzado = palabrasExcluidasCalzado.some(palabra => textoCompleto.includes(palabra));
    if (tieneZapatilla && !tieneExcluidasCalzado) {
        return 'zapatillas';
    }

    // Ropa Superior Específica
    if (textoCompleto.includes('campera') || textoCompleto.includes('jacket') || textoCompleto.includes('windbreaker') || textoCompleto.includes('puffer') || textoCompleto.includes('chaqueta') || textoCompleto.includes('abrigo') || textoCompleto.includes('chaleco') || textoCompleto.includes('parka')) {
        return 'camperas';
    }
    if (textoCompleto.includes('buzo') || textoCompleto.includes('hoodie') || textoCompleto.includes('sweater') || textoCompleto.includes('suéter') || textoCompleto.includes('sudadera') || textoCompleto.includes('pullover') || textoCompleto.includes('crewneck') || textoCompleto.includes('zip up') || textoCompleto.includes('zip-up')) {
        return 'buzos';
    }
    if (textoCompleto.includes('remera') || textoCompleto.includes('tee') || textoCompleto.includes('camiseta') || textoCompleto.includes('shirt') || textoCompleto.includes('t-shirt') || textoCompleto.includes('tshirt') || textoCompleto.includes('polera') || textoCompleto.includes('chomba') || textoCompleto.includes('jersey') || textoCompleto.includes('top')) {
        return 'remeras';
    }

    // Ropa Inferior Específica
    if (textoCompleto.includes('jean') || textoCompleto.includes('denim')) {
        return 'jeans';
    }
    if (textoCompleto.includes('short') || textoCompleto.includes('bermuda')) {
        return 'shorts';
    }
    if (textoCompleto.includes('pantalon') || textoCompleto.includes('pantalón') || textoCompleto.includes('pantalones') || textoCompleto.includes('pants') || textoCompleto.includes('jogger') || textoCompleto.includes('trouser') || textoCompleto.includes('cargo') || textoCompleto.includes('sweatpants') || textoCompleto.includes('ropa-inferior') || textoCompleto.includes('ropa inferior')) {
        return 'pantalones';
    }

    // Accesorios Específicos
    if (textoCompleto.includes('gorra') || textoCompleto.includes('cap') || textoCompleto.includes('hat') || textoCompleto.includes('beanie') || textoCompleto.includes('sombrero') || textoCompleto.includes('bucket')) {
        return 'gorras';
    }
    if (textoCompleto.includes('lente') || textoCompleto.includes('glasses') || textoCompleto.includes('sunglasses') || textoCompleto.includes('gafas') || textoCompleto.includes('anteojos')) {
        return 'lentes';
    }
    if (textoCompleto.includes('bolso') || textoCompleto.includes('bag') || textoCompleto.includes('mochila') || textoCompleto.includes('backpack') || textoCompleto.includes('cartera') || textoCompleto.includes('wallet') || textoCompleto.includes('bandolera') || textoCompleto.includes('purse')) {
        return 'bolsos';
    }

    // Si dice ropa superior y no fue capturado antes
    if (textoCompleto.includes('ropa-superior') || textoCompleto.includes('ropa superior')) {
        return 'remeras'; // Por defecto
    }

    // Por defecto, accesorios
    return 'accesorios';
}

// Renderizar productos en el grid (optimizado con DocumentFragment)
function renderProducts(products) {
    const grid = document.querySelector('.products-grid') || document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid not found in renderProducts');
        return;
    }

    console.log('Rendering products:', products?.length || 0);

    // Usar DocumentFragment para mejor rendimiento (batch DOM updates)
    const fragment = document.createDocumentFragment();

    if (!products || !products.length) {
        console.warn('No products to render');
        grid.innerHTML = `<p style="color:#fff; opacity:.8;">No hay productos todavía.</p>`;
        return;
    }

    for (const p of products) {
        // Skip products without a valid link functionally validated
        const srcUrl = (p.source_url || '').trim();
        if (!srcUrl || srcUrl === 'N/A' || srcUrl === 'null' || srcUrl.length < 5) continue;

        const strictBaseUrl = typeof extractBaseUrlFromAgentLink === 'function' ? extractBaseUrlFromAgentLink(srcUrl) : srcUrl;
        let isValidLink = false;
        if (strictBaseUrl && (strictBaseUrl.includes('weidian.com') || strictBaseUrl.includes('1688.com') || strictBaseUrl.includes('taobao.com') || strictBaseUrl.includes('ikako.vip') || strictBaseUrl.includes('sl.kakobuy.com'))) {
            isValidLink = true;
        } else if (srcUrl.includes('weidian.com') || srcUrl.includes('1688.com') || srcUrl.includes('taobao.com') || srcUrl.includes('ikako.vip') || srcUrl.includes('sl.kakobuy.com')) {
            isValidLink = true;
        }

        if (!isValidLink) continue; // NEVER render dead product links

        // Handle multiple images for carousel
        let rawImageSources = resolveProductImageSources(p);
        let allImages = [];
        rawImageSources.forEach(src => {
            if (src) {
                src.split(',').forEach(s => {
                    s = s.trim();
                    if (s) {
                        if (!allImages.includes(s) && s !== LOCAL_PRODUCT_PLACEHOLDER) {
                            allImages.push(s);
                        }
                    }
                });
            }
        });
        if (allImages.length === 0) allImages.push(LOCAL_PRODUCT_PLACEHOLDER);

        const imagenUrl = allImages[0];
        const fallbackSources = allImages.slice(1).join(PRODUCT_IMAGE_FALLBACK_SEPARATOR);

        // Serialize array for carousel
        const imagesJsonEscaped = escapeHtml(JSON.stringify(allImages));

        const card = document.createElement("article");
        // Maintain product-card class for existing JS, but add Argenreps card class structure
        card.className = "product-card card slide-up";

        // Mapear categoría usando la función inteligente
        const mappedCategory = mapProductCategory(p);
        card.setAttribute('data-category', mappedCategory);
        card.setAttribute('data-quality', (p.calidad || '').toLowerCase());

        // Solo usar source_url (link base) - ya no tenemos links JSONB
        card.setAttribute('data-base-url', p.source_url || '');

        // Usar innerHTML solo una vez por card (más eficiente)
        const precioFormateado = formatPrice(p.precio_cny || 0);
        const nombreEscapado = escapeHtml(p.nombre);
        const categoriaEscapada = escapeHtml(p.categoria || '');
        const calidadBadge = p.calidad ? `<span class="badge-quality product-quality">${escapeHtml(p.calidad)}</span>` : '';
        const imagenEscapada = escapeHtml(imagenUrl);
        const fallbackEscapado = escapeHtml(fallbackSources);

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${imagenEscapada}" alt="${nombreEscapado}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback-srcs="${fallbackEscapado}" data-images="${imagesJsonEscaped}" class="card-img carousel-img" onerror="handleProductImageError(this)" onmouseenter="startImageCarousel(this)" onmouseleave="stopImageCarousel(this)">
                ${p.destacado ? '<span class="featured-badge">DESTACADO</span>' : ''}
            </div>

            <div class="card-body">
                <span class="card-cat">${categoriaEscapada}</span>
                <h3 class="card-name">${nombreEscapado}</h3>
                <div class="card-price price-cny" data-price-cny="${p.precio_cny || 0}">¥${p.precio_cny || 0}</div>
                <a class="card-btn" href="javascript:void(0);" target="_blank" rel="noopener noreferrer" data-agent-link>Ver Producto</a>
            </div>
        `;

        fragment.appendChild(card);
    }

    // Limpiar grid y agregar todos los elementos de una vez (mejor rendimiento)
    grid.innerHTML = "";
    grid.appendChild(fragment);

    // Re-inicializar animaciones de scroll para los nuevos productos
    initScrollAnimations();

    // Actualizar links y precios después de renderizar (usar requestAnimationFrame para mejor rendimiento)
    requestAnimationFrame(() => {
        updateProductLinks();
        const savedCurrency = localStorage.getItem('selectedCurrency') || 'CNY';
        updateProductPrices(savedCurrency);
        // Adjuntar listeners de QC después de renderizar
        attachQCListeners();
    });
}

async function loadDatabaseStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalCategoriesEl = document.getElementById('totalCategories');
    const totalQualityEl = document.getElementById('totalQuality');
    const lastUpdateEl = document.getElementById('lastUpdate');

    if (!totalProductsEl) return;

    try {
        const products = await getActiveCatalogProducts();
        const totalProducts = products.length;

        const categories = new Set();
        products.forEach(p => {
            if (p.categoria) {
                categories.add(p.categoria);
            }
        });
        const totalCategories = categories.size;

        const quality1to1 = products.filter(p =>
            p.calidad && p.calidad.toLowerCase().includes('1:1')
        ).length;

        let lastUpdate = 'N/A';
        if (products.length > 0) {
            const sortedProducts = products
                .filter(p => p.created_at)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (sortedProducts.length > 0) {
                const lastDate = new Date(sortedProducts[0].created_at);
                const now = new Date();
                const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    lastUpdate = 'Hoy';
                } else if (diffDays === 1) {
                    lastUpdate = 'Ayer';
                } else if (diffDays < 7) {
                    lastUpdate = `Hace ${diffDays} días`;
                } else {
                    lastUpdate = lastDate.toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short'
                    });
                }
            }
        }

        animateValue(totalProductsEl, 0, totalProducts, 1000);
        animateValue(totalCategoriesEl, 0, totalCategories, 1000);
        animateValue(totalQualityEl, 0, quality1to1, 1000);

        if (lastUpdateEl) {
            lastUpdateEl.textContent = lastUpdate;
        }
    } catch (error) {
        console.error('Error loading database stats:', error);
        if (totalProductsEl) totalProductsEl.textContent = '1,500+';
        if (totalCategoriesEl) totalCategoriesEl.textContent = '6+';
        if (totalQualityEl) totalQualityEl.textContent = '500+';
        if (lastUpdateEl) lastUpdateEl.textContent = 'Reciente';
    }
}

async function loadProductsFromAPI(page = 1, pageSize = 36, filters = {}) {
    let products = await getActiveCatalogProducts();

    if (filters.quality) {
        const qualityFilter = filters.quality.toLowerCase();
        products = products.filter(product =>
            String(product.calidad || '').toLowerCase() === qualityFilter
        );
    }

    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
        products = products.filter(product => {
            const price = parseFloat(product.precio_cny || 0);
            // Si el maximo es 5000, considerarlo infinito para productos muy caros
            if (filters.priceMax >= 5000) {
                return price >= filters.priceMin;
            }
            return price >= filters.priceMin && price <= filters.priceMax;
        });
    }

    if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        products = products.filter(product =>
            String(product.nombre || '').toLowerCase().includes(searchTerm) ||
            String(product.descripcion || '').toLowerCase().includes(searchTerm) ||
            String(product.categoria || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filters.brand) {
        let brandNormalized = filters.brand.toLowerCase().trim();
        const brandSearchMap = {
            'acne-studios': 'acne',
            'saint-laurent': 'saint laurent',
            'enfants-riches-deprimes': 'enfants riches',
            'lostkidsclub2000': 'lost kids',
            'martine-rose': 'martine rose',
            'sin-marca': null,
            'alo': 'alo',
            'balenciaga': 'balenciaga',
            'burberry': 'burberry',
            'chai': 'chai',
            'gymshark': 'gymshark',
            'jordan': 'jordan',
            'longchamp': 'longchamp',
            'mowalola': 'mowalola',
            'nike': 'nike',
            'palace': 'palace',
            'supreme': 'supreme',
            'synaworld': 'synaworld',
            'valley': 'valley'
        };

        if (brandSearchMap.hasOwnProperty(brandNormalized)) {
            brandNormalized = brandSearchMap[brandNormalized];
        }

        if (brandNormalized) {
            products = products.filter(product =>
                String(product.nombre || '').toLowerCase().includes(brandNormalized)
            );
        }
    }

    if (filters.category && filters.category !== 'all' && products.length > 0) {
        const filterCategoryNormalized = filters.category.toLowerCase();
        products = products.filter(product => mapProductCategory(product) === filterCategoryNormalized);
    }

    // Apply centralized sort with destacado hierarchy
    products = sortProducts(products, filters.sort || 'recientes');

    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
        products: paginatedProducts || [],
        totalCount,
        totalPages: totalPages || 1,
        currentPage: page
    };
}

if (typeof window !== 'undefined') {
    window.loadProductsFromAPI = loadProductsFromAPI;
}

// Cargar productos con paginación
async function loadProductsPage(page = 1, filters = {}) {
    const grid = document.querySelector('.products-grid') || document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid not found');
        return;
    }

    if (typeof loadProductsFromAPI !== 'function') {
        console.error('loadProductsFromAPI function not available');
        grid.innerHTML = '<p style="color: #fff; text-align: center; padding: 2rem;">Error: función no disponible. Recarga la página.</p>';
        return;
    }

    try {
        // Visual loading state
        if (grid) grid.style.opacity = '0.5';

        // Mostrar estado de carga (solo si el grid está vacío)
        if (!grid.querySelector('.product-card')) {
            grid.innerHTML = '<p style="color: #fff; text-align: center; padding: 2rem;">Cargando productos...</p>';
        }

        console.log('Loading products page:', page, 'filters:', filters);
        const result = await loadProductsFromAPI(page, PRODUCTS_PER_PAGE, filters);
        console.log('Products loaded:', result.products?.length || 0, 'products');

        if (!result || !result.products) {
            throw new Error('No se recibieron productos del servidor');
        }

        currentPage = result.currentPage;
        totalPages = result.totalPages;
        currentFilters = filters;

        // Expose updated state to window
        if (typeof window !== 'undefined') {
            window.currentPage = currentPage;
            window.currentFilters = currentFilters;
        }

        // Sync URL with current state
        try {
            const url = new URL(window.location);
            url.searchParams.set('page', currentPage);
            if (filters.category && filters.category !== 'all') {
                url.searchParams.set('category', filters.category);
            } else {
                url.searchParams.delete('category');
            }
            if (filters.search) {
                url.searchParams.set('search', filters.search);
            } else {
                url.searchParams.delete('search');
            }
            window.history.pushState({ page: currentPage, filters }, '', url);
        } catch (urlErr) {
            console.warn('Could not update URL state:', urlErr);
        }

        // Usar requestAnimationFrame para renderizado suave
        requestAnimationFrame(() => {
            if (grid) grid.style.opacity = '1';
            renderProducts(result.products);
            updatePaginationControls();

            // Actualizar precios según la configuración guardada
            const savedCurrency = localStorage.getItem('selectedCurrency') || 'CNY';
            updateProductPrices(savedCurrency);
        });
    } catch (e) {
        console.error('Error loading products:', e);
        // Mostrar error pero permitir que la página continúe funcionando
        grid.innerHTML = `
            <div style="color:#fff; text-align:center; opacity:.9; padding:40px;">
                <div style="font-size:22px; margin-bottom:10px;">Error al cargar productos</div>
                <div style="opacity:.7; margin-bottom:20px;">${e.message || 'Error desconocido'}</div>
                <div style="opacity:.5; margin-bottom:20px; font-size:12px;">Abre la consola (F12) para más detalles</div>
                <button onclick="location.reload()" style="padding:10px 20px; background:#dc2626; color:#fff; border:none; border-radius:5px; cursor:pointer;">Recargar página</button>
            </div>`;
    }
}

// Actualizar controles de paginación
function updatePaginationControls() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Botón Anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '← Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadProductsPage(currentPage - 1, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-btn';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => {
            loadProductsPage(1, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(firstBtn);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i.toString();
        pageBtn.addEventListener('click', () => {
            loadProductsPage(i, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-btn';
        lastBtn.textContent = totalPages.toString();
        lastBtn.addEventListener('click', () => {
            loadProductsPage(totalPages, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(lastBtn);
    }

    // Botón Siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Siguiente →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadProductsPage(currentPage + 1, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// ============================================
// METEORS ANIMATION (Infiner template)
// ============================================
function initMeteors() {
    const meteorsContainer = document.getElementById('meteorsContainer');
    if (!meteorsContainer) return;

    // Reducir número de meteors para mejor rendimiento
    const numberOfMeteors = 5;

    for (let i = 0; i < numberOfMeteors; i++) {
        const meteor = document.createElement('span');
        meteor.className = 'meteor';

        const left = Math.floor(Math.random() * 120);
        const top = Math.floor(Math.random() * 20) - 30;
        const delay = Math.random() * 12;
        const duration = Math.floor(Math.random() * 4 + 3);

        meteor.style.left = left + '%';
        meteor.style.top = top + '%';
        meteor.style.animationDelay = delay + 's';
        meteor.style.animationDuration = duration + 's';

        meteorsContainer.appendChild(meteor);
    }
}

// Initialize meteors when DOM is ready
function initMeteorsOnReady() {
    if (document.getElementById('meteorsContainer')) {
        initMeteors();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeteorsOnReady);
} else {
    initMeteorsOnReady();
}

// También intentar inicializar después de un pequeño delay por si acaso
setTimeout(initMeteorsOnReady, 100);

function buildFiltersFromURLParams(urlParams) {
    const filters = {};

    const search = urlParams.get('search');
    const category = urlParams.get('category');
    const quality = urlParams.get('quality');
    const brand = urlParams.get('brand');
    const sort = urlParams.get('sort');

    if (search && search.trim()) filters.search = search.trim();
    if (category && category.trim()) filters.category = category.trim();
    if (quality && quality.trim()) filters.quality = quality.trim();
    if (brand && brand.trim()) filters.brand = brand.trim();
    if (sort && sort.trim()) filters.sort = sort.trim();

    return filters;
}

function syncProductFilterUIFromURL(urlParams) {
    const search = urlParams.get('search');
    const category = urlParams.get('category');
    const quality = urlParams.get('quality');
    const brand = urlParams.get('brand');
    const sort = urlParams.get('sort');

    const searchInput = document.getElementById('productSearch');
    if (searchInput && search) {
        searchInput.value = search;
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect && sort) {
        sortSelect.value = sort;
    }

    const qualityButtons = document.querySelectorAll('.quality-btn');
    if (qualityButtons.length) {
        qualityButtons.forEach(button => {
            const isActive = quality && button.getAttribute('data-quality') === quality;
            button.classList.toggle('active', !!isActive);
        });
    }

    const brandButtons = document.querySelectorAll('.brand-btn');
    if (brandButtons.length) {
        brandButtons.forEach(button => {
            const brandValue = button.getAttribute('data-brand') || '';
            button.classList.toggle('active', !!brand && brandValue === brand);
        });
    }

    if (category) {
        const categoryButtons = document.querySelectorAll('.category-btn-modern');
        if (categoryButtons.length) {
            categoryButtons.forEach(button => {
                const isActive = button.getAttribute('data-category') === category;
                button.classList.toggle('active', isActive);
                if (isActive) {
                    button.style.background = '#dc2626';
                    button.style.borderColor = '#dc2626';
                    button.style.color = '#ffffff';
                } else {
                    button.style.background = '';
                    button.style.borderColor = '';
                    button.style.color = '';
                }
            });
        }
    }
}

async function initModernFilters() {
    const container = document.getElementById('categoriesContainerModern');
    if (!container) return;

    try {
        const products = await getActiveCatalogProducts();
        if (!products.length) return;

        const categoryCounts = {};
        const categoryMap = {
            'all': 'Todos los Productos',
            'calzado': 'Zapatillas',
            'ropa-superior': 'Remeras',
            'ropa-inferior': 'Pantalones',
            'accesorios': 'Accesorios',
            'conjuntos': 'Conjuntos'
        };

        let totalCount = 0;
        products.forEach(product => {
            totalCount++;
            const mappedCategory = mapProductCategory(product);
            if (mappedCategory && mappedCategory !== 'all') {
                categoryCounts[mappedCategory] = (categoryCounts[mappedCategory] || 0) + 1;
            }
        });

        container.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'category-btn-modern active';
        allBtn.setAttribute('data-category', 'all');
        allBtn.innerHTML = `Todos los Productos <span class="category-badge">${totalCount}</span>`;
        allBtn.style.background = '#dc2626';
        allBtn.style.border = 'none';
        allBtn.style.color = '#ffffff';
        allBtn.style.fontWeight = '600';
        allBtn.style.borderRadius = '20px';
        allBtn.style.padding = '0.5rem 1rem';
        container.appendChild(allBtn);

        const categories = ['calzado', 'ropa-superior', 'ropa-inferior', 'accesorios', 'conjuntos'];
        categories.forEach(cat => {
            const count = categoryCounts[cat] || 0;
            if (count > 0) {
                const btn = document.createElement('button');
                btn.className = 'category-btn-modern';
                btn.setAttribute('data-category', cat);
                btn.innerHTML = `${categoryMap[cat]} <span class="category-badge">${count}</span>`;
                btn.style.background = 'transparent';
                btn.style.border = 'none';
                btn.style.color = '';
                container.appendChild(btn);
            }
        });

        const modernButtons = container.querySelectorAll('.category-btn-modern');
        modernButtons.forEach(button => {
            button.addEventListener('click', () => {
                modernButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                });

                button.classList.add('active');
                button.style.background = '#dc2626';
                button.style.borderColor = '#dc2626';
                button.style.color = '#ffffff';

                setTimeout(() => {
                    const filters = buildFiltersFromUI();
                    loadProductsPage(1, filters);
                }, 10);
            });
        });

        syncProductFilterUIFromURL(new URLSearchParams(window.location.search));
    } catch (error) {
        console.error('Error loading category filters:', error);
    }
}

// ============================================
// HOME FEATURED PRODUCTS STABLE LOADER
// ============================================

const HOME_FEATURED_TIMEOUT_MS = 12000;
const HOME_FEATURED_SKELETON_COUNT = 4;

function isHomeFeaturedDebugEnabled() {
    const hostname = window.location.hostname || '';
    const params = new URLSearchParams(window.location.search);
    return hostname === 'localhost' || hostname === '127.0.0.1' || params.has('debugFeatured');
}

function logHomeFeatured(level, message, payload) {
    const prefix = '[home-featured]';

    if (level === 'error') {
        console.error(prefix, message, payload || '');
        return;
    }

    if (!isHomeFeaturedDebugEnabled()) {
        return;
    }

    const logger = typeof console[level] === 'function' ? console[level] : console.log;
    logger(prefix, message, payload || '');
}

function getHomeFeaturedGrid() {
    return document.getElementById('homeFeaturedGrid');
}

function setHomeFeaturedGridState(state) {
    const featuredGrid = getHomeFeaturedGrid();
    if (!featuredGrid) return;

    featuredGrid.dataset.featuredState = state;
    featuredGrid.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
}

function buildHomeFeaturedSkeletonMarkup(count = HOME_FEATURED_SKELETON_COUNT) {
    return Array.from({ length: count }, () => `
        <article class="home-v2-loading-card home-v2-loading-skeleton" aria-hidden="true">
            <div class="home-v2-skeleton-media"></div>
            <div class="home-v2-skeleton-lines">
                <span class="home-v2-skeleton-line home-v2-skeleton-line-sm"></span>
                <span class="home-v2-skeleton-line"></span>
                <span class="home-v2-skeleton-line home-v2-skeleton-line-md"></span>
                <span class="home-v2-skeleton-line home-v2-skeleton-line-btn"></span>
            </div>
        </article>
    `).join('');
}

function renderHomeFeaturedSkeletons() {
    const featuredGrid = getHomeFeaturedGrid();
    if (!featuredGrid) return;

    setHomeFeaturedGridState('loading');
    featuredGrid.innerHTML = buildHomeFeaturedSkeletonMarkup();
}

function buildStableHomeFallbackThumb(label, background = '#f4f4f5') {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
            <rect width="600" height="600" rx="36" fill="${background}" />
            <circle cx="300" cy="240" r="96" fill="rgba(17,24,39,0.06)" />
            <text x="300" y="368" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="46" font-weight="700">${label}</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildHomeFeaturedFallbackCards() {
    if (!Array.isArray(FINAL_HOME_FEATURED_FALLBACKS)) {
        return '';
    }

    return FINAL_HOME_FEATURED_FALLBACKS.map(item => `
        <article class="home-featured-card">
            <div class="home-featured-media">
                <img src="${buildStableHomeFallbackThumb(item.label, item.background)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
            </div>
            <div class="home-featured-content">
                <div class="home-featured-meta">${escapeHtml(item.category)}</div>
                <h3 class="home-featured-name">${escapeHtml(item.name)}</h3>
                <div class="home-featured-price">${escapeHtml(item.detail)}</div>
                <a href="${item.href}" class="home-featured-link">Abrir seccion</a>
            </div>
        </article>
    `).join('');
}

function renderHomeFeaturedState(type, message) {
    const featuredGrid = getHomeFeaturedGrid();
    if (!featuredGrid) return;

    const normalizedType = type === 'error' ? 'error' : 'empty';
    const defaultMessage = normalizedType === 'error'
        ? 'No se pudieron cargar los productos ahora.'
        : 'No hay productos destacados disponibles.';
    const fallbackCards = buildHomeFeaturedFallbackCards();

    setHomeFeaturedGridState(normalizedType);
    featuredGrid.innerHTML = `
        <div class="home-v2-product-status is-${normalizedType}">${escapeHtml(message || defaultMessage)}</div>
        ${fallbackCards}
    `;
}

function getHomeFeaturedImageSources(product) {
    if (typeof resolveProductImageSources === 'function') {
        return resolveProductImageSources(product);
    }

    const placeholder = typeof LOCAL_PRODUCT_PLACEHOLDER === 'string'
        ? LOCAL_PRODUCT_PLACEHOLDER
        : 'images/placeholder-product.svg';

    return [
        product?.kakobuy_image_url,
        product?.imagen_url,
        product?.supabase_image_url,
        placeholder
    ].filter((source, index, list) => source && list.indexOf(source) === index);
}

function createHomeFeaturedCard(product) {
    const imageSources = getHomeFeaturedImageSources(product);
    const primaryImage = imageSources[0] || (typeof LOCAL_PRODUCT_PLACEHOLDER === 'string' ? LOCAL_PRODUCT_PLACEHOLDER : 'images/placeholder-product.svg');
    const fallbackSources = typeof buildImageFallbackAttribute === 'function'
        ? buildImageFallbackAttribute(imageSources)
        : imageSources.slice(1).join('||');
    const productName = escapeHtml(product?.nombre || 'Producto sin nombre');
    const category = escapeHtml(product?.categoria || 'Catalogo');
    const formattedPrice = formatPrice(product?.precio_cny || 0);

    const card = document.createElement('article');
    card.className = 'home-featured-card';
    card.setAttribute('data-base-url', product?.source_url || '');
    card.innerHTML = `
        <div class="home-featured-media">
            <img
                src="${primaryImage}"
                alt="${productName}"
                loading="lazy"
                decoding="async"
                data-fallback-srcs="${escapeHtml(fallbackSources)}"
                onerror="handleProductImageError(this)"
            >
        </div>
        <div class="home-featured-overlay">
            <span class="home-featured-name">${productName}</span>
            <span class="home-featured-price">$${formattedPrice}</span>
        </div>
    `;

    return card;
}

function pickFeaturedProducts(products) {
    if (!Array.isArray(products)) {
        logHomeFeatured('warn', 'Expected an array for featured products but received a different shape.', products);
        return [];
    }

    const validProducts = products.filter(product => product && typeof product === 'object');
    if (!validProducts.length) {
        return [];
    }

    // Prioritize products marked as 'destacado' (recommended via admin heart button)
    // Use loose check to handle boolean true, string "true", or any truthy value from Supabase
    const isDestacado = (p) => p.destacado === true || p.destacado === 'true' || p.destacado === 1;
    const recommended = validProducts.filter(p => isDestacado(p));
    const nonRecommended = validProducts.filter(p => !isDestacado(p));

    if (recommended.length >= 12) {
        return [...recommended].sort(() => Math.random() - 0.5).slice(0, 12);
    }

    const shuffledOthers = [...nonRecommended].sort(() => Math.random() - 0.5);
    return [...recommended, ...shuffledOthers].slice(0, 12);
}

async function getFeaturedProductsWithTimeout() {
    return Promise.race([
        getActiveCatalogProducts({ forceRefresh: true }),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Featured products timed out after ${HOME_FEATURED_TIMEOUT_MS}ms`)), HOME_FEATURED_TIMEOUT_MS);
        })
    ]);
}

async function loadFeaturedProducts() {
    const featuredGrid = getHomeFeaturedGrid();
    if (!featuredGrid) {
        return [];
    }

    const startedAt = Date.now();
    renderHomeFeaturedSkeletons();

    try {
        const products = await getFeaturedProductsWithTimeout();

        if (!Array.isArray(products)) {
            logHomeFeatured('warn', 'Featured products payload is not an array.', products);
            renderHomeFeaturedState('empty', 'No hay productos destacados disponibles.');
            return [];
        }

        logHomeFeatured('info', `Featured products payload received (${products.length}).`);

        const selectedProducts = pickFeaturedProducts(products);
        if (!selectedProducts.length) {
            logHomeFeatured('warn', 'Featured products query resolved with an empty array.');
            renderHomeFeaturedState('empty', 'No hay productos destacados disponibles.');
            return [];
        }

        const fragment = document.createDocumentFragment();

        selectedProducts.forEach((product, index) => {
            try {
                fragment.appendChild(createHomeFeaturedCard(product));
            } catch (cardError) {
                logHomeFeatured('error', `Failed to render featured product card at index ${index}.`, cardError);
            }
        });

        if (!fragment.childNodes.length) {
            renderHomeFeaturedState('error', 'No se pudieron cargar los productos ahora.');
            return [];
        }

        featuredGrid.innerHTML = '';
        featuredGrid.appendChild(fragment);
        setHomeFeaturedGridState('success');

        if (typeof updateProductLinks === 'function') {
            updateProductLinks();
        }

        logHomeFeatured('info', `Featured products rendered in ${Date.now() - startedAt}ms.`);
        window.__featuredProductsDebug = {
            state: 'success',
            total: products.length,
            rendered: selectedProducts.length,
            renderedAt: new Date().toISOString()
        };

        return selectedProducts;
    } catch (error) {
        logHomeFeatured('error', 'Error loading featured products.', error);
        renderHomeFeaturedState('error', 'No se pudieron cargar los productos ahora.');
        window.__featuredProductsDebug = {
            state: 'error',
            error: error?.message || String(error),
            renderedAt: new Date().toISOString()
        };
        return [];
    }
}

async function initProductLoading() {
    try {
        const grid = document.querySelector('.products-grid') || document.getElementById('products-grid');
        const isProductsPage = window.location.pathname.includes('productos.html') ||
            window.location.pathname.endsWith('productos.html') ||
            window.location.href.includes('productos.html') ||
            !!grid;

        if (isProductsPage && grid) {
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = parseInt(urlParams.get('page'), 10) || 1;
            const filtersFromURL = buildFiltersFromURLParams(urlParams);

            syncProductFilterUIFromURL(urlParams);
            await loadProductsPage(pageFromUrl, filtersFromURL);
        }

        const isHomePage = window.location.pathname.includes('index.html') ||
            window.location.pathname.endsWith('/') ||
            window.location.pathname === '' ||
            (!window.location.pathname.includes('.html') && !isProductsPage);

        if (isHomePage && getHomeFeaturedGrid()) {
            await loadFeaturedProducts();
        }
    } catch (error) {
        logHomeFeatured('error', 'Error in initProductLoading.', error);

        if (getHomeFeaturedGrid()) {
            renderHomeFeaturedState('error', 'No se pudieron cargar los productos ahora.');
        }
    }
}

let hasStableFeaturedBootstrapped = false;

function bootstrapStableFeaturedProducts() {
    if (hasStableFeaturedBootstrapped) return;
    hasStableFeaturedBootstrapped = true;

    initProductLoading().catch(error => {
        logHomeFeatured('error', 'Unhandled error while bootstrapping featured products.', error);
        if (getHomeFeaturedGrid()) {
            renderHomeFeaturedState('error', 'No se pudieron cargar los productos ahora.');
        }
    });

    // Initialize category filters on productos page
    if (document.getElementById('categoriesContainerModern')) {
        setTimeout(() => {
            initModernFilters();
        }, 200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapStableFeaturedProducts, { once: true });
} else {
    setTimeout(bootstrapStableFeaturedProducts, 0);
}

// Carousel Logic
window.startImageCarousel = function (img) {
    try {
        const imagesRaw = img.getAttribute('data-images');
        if (!imagesRaw) return;
        const unescaped = imagesRaw.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const images = JSON.parse(unescaped);
        if (images.length <= 1) return;
        img.dataset.origSrc = img.src;
        let i = 0;
        img.carouselInterval = setInterval(() => {
            i = (i + 1) % images.length;
            img.src = images[i];
        }, 1000);
    } catch (e) {
        console.error('Carousel error', e);
    }
};
window.stopImageCarousel = function (img) {
    if (img.carouselInterval) {
        clearInterval(img.carouselInterval);
        img.carouselInterval = null;
    }
    if (img.dataset.origSrc) {
        img.src = img.dataset.origSrc;
    }
};

window.changeCarouselImage = function (e, btn, direction) {
    e.preventDefault();
    e.stopPropagation();
    const wrap = btn.closest('.card-img-wrap');
    const img = wrap.querySelector('.card-img');
    const imagesRaw = img.getAttribute('data-images');
    if (!imagesRaw) return;

    const unescaped = imagesRaw.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const images = JSON.parse(unescaped);
    if (images.length <= 1) return;

    let currentIdx = parseInt(wrap.getAttribute('data-current') || '0');
    currentIdx += direction;
    if (currentIdx >= images.length) currentIdx = 0;
    if (currentIdx < 0) currentIdx = images.length - 1;

    wrap.setAttribute('data-current', currentIdx);
    img.src = images[currentIdx];

    const dots = wrap.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIdx);
    });
};
