const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// ============================================================
// 1. ADD CSS (insert new CSS before :root block)
// ============================================================
const cssInsertAfter = '    .discord-btn {\n      font-size: 0.85rem !important;\n      padding: 0.4rem 0.8rem !important;\n    }';
const newCSS = `
    /* ===== DISCORD FLOATING BUTTON ===== */
    .discord-float { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    .discord-float-tooltip { background: rgba(10,10,20,0.92); color: #fff; font-size: 0.78rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 8px; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(6px); transition: opacity 0.2s ease, transform 0.2s ease; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .discord-float:hover .discord-float-tooltip { opacity: 1; transform: translateY(0); }
    .discord-float-btn { width: 52px; height: 52px; border-radius: 14px; background: #5865F2; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 24px rgba(88,101,242,0.5), 0 2px 8px rgba(0,0,0,0.3); transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; cursor: pointer; text-decoration: none; border: none; outline: none; }
    .discord-float-btn:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 10px 32px rgba(88,101,242,0.65), 0 4px 12px rgba(0,0,0,0.3); background: #4752C4; }
    .discord-float-btn svg { width: 26px; height: 26px; fill: #fff; }
    /* ===== AGENT PROMO CAROUSEL ===== */
    .rs-promo-carousel { width: 100%; max-width: 420px; animation: rs-fade-up 0.7s ease 0.75s both; }
    .rs-promo-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 1.25rem 1.4rem 1rem; display: none; flex-direction: column; gap: 0.7rem; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.35); position: relative; overflow: hidden; }
    .rs-promo-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%); pointer-events: none; }
    .rs-promo-card.active { display: flex; }
    .rs-promo-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .rs-promo-brand { display: flex; align-items: center; gap: 0.6rem; }
    .rs-promo-logo { width: 38px; height: 38px; border-radius: 10px; object-fit: contain; background: #fff; padding: 3px; flex-shrink: 0; }
    .rs-promo-name { font-size: 0.95rem; font-weight: 800; color: #fff; line-height: 1; }
    .rs-promo-sub { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-top: 0.15rem; }
    .rs-promo-badge { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.28rem 0.65rem; border-radius: 100px; flex-shrink: 0; }
    .rs-promo-badge-recommended { background: rgba(220,38,38,0.15); color: #ef4444; border: 1px solid rgba(220,38,38,0.3); }
    .rs-promo-badge-verified { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
    .rs-promo-badge-free { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .rs-promo-desc { font-size: 0.82rem; color: rgba(255,255,255,0.75); line-height: 1.5; }
    .rs-promo-cta { display: inline-flex; align-items: center; gap: 0.4rem; background: #fff; color: #000; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.55rem 1.1rem; border-radius: 100px; text-decoration: none; transition: background 0.2s ease, transform 0.15s ease; align-self: flex-start; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .rs-promo-cta:hover { background: #f0f0f0; transform: translateY(-1px); }
    .rs-promo-dots { display: flex; justify-content: center; gap: 0.45rem; padding-top: 0.25rem; }
    .rs-promo-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.25); cursor: pointer; transition: background 0.2s ease, transform 0.2s ease; border: none; outline: none; padding: 0; }
    .rs-promo-dot.active { background: #fff; transform: scale(1.3); }
    @media (max-width: 640px) { .rs-promo-carousel { max-width: 100%; } .discord-float { bottom: 1rem; right: 1rem; } .discord-float-btn { width: 46px; height: 46px; border-radius: 12px; } }`;

// Normalize line endings for search, but preserve original
const normalised = content.replace(/\r\n/g, '\n');

if (!normalised.includes('.discord-float {')) {
    // Find the position after the discord-btn block
    const marker = '    .discord-btn {\n      font-size: 0.85rem !important;\n      padding: 0.4rem 0.8rem !important;\n    }';
    const idx = normalised.indexOf(marker);
    if (idx === -1) {
        console.error('CSS marker not found!');
        process.exit(1);
    }
    const insertPos = idx + marker.length;
    const newNorm = normalised.slice(0, insertPos) + '\n' + newCSS + normalised.slice(insertPos);
    content = newNorm.replace(/\n/g, '\r\n');
    console.log('CSS inserted OK');
} else {
    console.log('CSS already present, skipping');
}

// ============================================================
// 2. ADD PROMO CAROUSEL HTML in hero section
// ============================================================
const norm2 = content.replace(/\r\n/g, '\n');

if (!norm2.includes('rsPromoCarousel')) {
    const agentBlockEnd = '                    <span class="rs-agent-stack-text">16 agentes soportados</span>\n                </div>\n\n            </div>';
    const idx2 = norm2.indexOf(agentBlockEnd);
    if (idx2 === -1) {
        console.error('Agent block end not found!');
        // Show nearby content
        const agentIdx = norm2.indexOf('rs-agent-stack-text');
        console.log('nearby:', JSON.stringify(norm2.slice(Math.max(0, agentIdx - 10), agentIdx + 200)));
        process.exit(1);
    }
    const promoHTML = `                    <span class="rs-agent-stack-text">16 agentes soportados</span>
                </div>

                <!-- Agent Promo Carousel -->
                <div class="rs-promo-carousel" id="rsPromoCarousel">
                    <!-- Card 1: KakoBuy -->
                    <div class="rs-promo-card active">
                        <div class="rs-promo-header">
                            <div class="rs-promo-brand">
                                <img src="images/kakobuylogo.png" alt="KakoBuy" class="rs-promo-logo">
                                <div>
                                    <div class="rs-promo-name">KAKOBUY</div>
                                    <div class="rs-promo-sub">Agente #1 en Latam</div>
                                </div>
                            </div>
                            <span class="rs-promo-badge rs-promo-badge-recommended">RECOMENDADO</span>
                        </div>
                        <p class="rs-promo-desc">Obtén $410 en cupones + $15 extra con el código <strong>"LATAM15"</strong></p>
                        <a href="https://ikako.vip/r/gonza" target="_blank" rel="noopener noreferrer" class="rs-promo-cta">RECLAMAR</a>
                    </div>
                    <!-- Card 2: OopBuy -->
                    <div class="rs-promo-card">
                        <div class="rs-promo-header">
                            <div class="rs-promo-brand">
                                <img src="images/oopbuylogo.png" alt="OopBuy" class="rs-promo-logo">
                                <div>
                                    <div class="rs-promo-name">OOPBUY</div>
                                    <div class="rs-promo-sub">Agente verificado</div>
                                </div>
                            </div>
                            <span class="rs-promo-badge rs-promo-badge-verified">VERIFICADO</span>
                        </div>
                        <p class="rs-promo-desc">Registrate y accedé a envíos especiales y tarifas preferenciales con tu primer pedido.</p>
                        <a href="https://www.oopbuy.com/" target="_blank" rel="noopener noreferrer" class="rs-promo-cta">REGISTRARSE</a>
                    </div>
                    <!-- Card 3: Discord -->
                    <div class="rs-promo-card">
                        <div class="rs-promo-header">
                            <div class="rs-promo-brand">
                                <div style="width:38px;height:38px;border-radius:10px;background:#5865F2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="#fff"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg>
                                </div>
                                <div>
                                    <div class="rs-promo-name">DISCORD</div>
                                    <div class="rs-promo-sub">Comunidad RepsHub</div>
                                </div>
                            </div>
                            <span class="rs-promo-badge rs-promo-badge-free">GRATIS</span>
                        </div>
                        <p class="rs-promo-desc">Unite a nuestra comunidad. Finds exclusivos, reviews y soporte en tiempo real.</p>
                        <a href="https://discord.gg/repshub" target="_blank" rel="noopener noreferrer" class="rs-promo-cta">UNIRME</a>
                    </div>
                    <!-- Dots -->
                    <div class="rs-promo-dots" id="rsPromoDots">
                        <button class="rs-promo-dot active" data-idx="0" aria-label="Slide 1"></button>
                        <button class="rs-promo-dot" data-idx="1" aria-label="Slide 2"></button>
                        <button class="rs-promo-dot" data-idx="2" aria-label="Slide 3"></button>
                    </div>
                </div>

            </div>`;
    const newNorm2 = norm2.slice(0, idx2) + promoHTML + norm2.slice(idx2 + agentBlockEnd.length);
    content = newNorm2.replace(/\n/g, '\r\n');
    console.log('Carousel HTML inserted OK');
} else {
    console.log('Carousel HTML already present, skipping');
}

// ============================================================
// 3. ADD CAROUSEL JS before closing </body>
// ============================================================
const norm3 = content.replace(/\r\n/g, '\n');

if (!norm3.includes('goTo(current + 1)')) {
    const scriptMarker = '    <script defer src="script.js?v=4"></script>\n    <script defer src="product-overrides.js"></script>';
    const idx3 = norm3.indexOf(scriptMarker);
    if (idx3 === -1) {
        console.error('Script marker not found!');
        process.exit(1);
    }
    const carouselJS = `    <script defer src="script.js?v=4"></script>
    <script defer src="product-overrides.js"></script>

    <!-- Promo Carousel Logic -->
    <script>
    (function() {
        var cards = document.querySelectorAll('#rsPromoCarousel .rs-promo-card');
        var dots  = document.querySelectorAll('#rsPromoDots .rs-promo-dot');
        if (!cards.length) return;
        var current = 0, timer;
        function goTo(idx) {
            cards[current].classList.remove('active');
            dots[current].classList.remove('active');
            current = (idx + cards.length) % cards.length;
            cards[current].classList.add('active');
            dots[current].classList.add('active');
        }
        function autoPlay() { timer = setInterval(function() { goTo(current + 1); }, 4000); }
        dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                clearInterval(timer);
                goTo(parseInt(dot.getAttribute('data-idx')));
                autoPlay();
            });
        });
        var carousel = document.getElementById('rsPromoCarousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', function() { clearInterval(timer); });
            carousel.addEventListener('mouseleave', autoPlay);
        }
        autoPlay();
    })();
    </script>`;
    const newNorm3 = norm3.slice(0, idx3) + carouselJS + norm3.slice(idx3 + scriptMarker.length);
    content = newNorm3.replace(/\n/g, '\r\n');
    console.log('Carousel JS inserted OK');
} else {
    console.log('Carousel JS already present, skipping');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! File saved.');
