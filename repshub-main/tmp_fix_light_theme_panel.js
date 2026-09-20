const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

css = css.replace(
    /:root\[data-theme="light"\]\s+\.config-panel-content\s*\{[^}]+\}/,
    `:root[data-theme="light"] .config-panel-content { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-color: rgba(15,23,42,0.1) !important; box-shadow: 0 16px 48px rgba(15,23,42,0.12) !important; }`
);

fs.writeFileSync('style.css', css, 'utf8');
console.log('style.css updated config panel light theme!');
