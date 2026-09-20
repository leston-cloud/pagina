const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Replace standard Light Theme root variables
css = css.replace(
    /:\s*root\[data-theme="light"\]\s*\{[\s\S]*?--glow-strong:[^}]+\}/,
    `:root[data-theme="light"] {
  --bg: #f8fafc;
  --bg-card: rgba(255, 255, 255, 0.7); 
  --bg-card-2: rgba(255, 255, 255, 0.95);
  --bg-dark: #e2e8f0;           
  --text: #0f172a;               
  --text-light: #ffffff;         
  --muted: #64748b;              
  --muted-2: rgba(15,23,42,.85); 

  --border: rgba(15,23,42,.08);
  --border-2: rgba(15,23,42,.05);
  --border-light: rgba(15,23,42,.03); 

  --shadow-sm: 0 2px 10px rgba(15,23,42,.04);
  --shadow-md: 0 8px 30px rgba(15,23,42,.08);
  --shadow-lg: 0 12px 40px rgba(15,23,42,.12);
  --glow: 0 0 0 4px rgba(220,38,38,.08);
  --glow-strong: 0 0 0 6px rgba(220,38,38,.12), 0 8px 30px rgba(220,38,38,.15);
}`
);

// Replace radial gradients which have red tints
css = css.replace(
    /:root\[data-theme="light"\]\s+body::before\s*\{[\s\S]*?#f5f5f5;\s*\}/,
    `:root[data-theme="light"] body::before {
  background: 
    radial-gradient(1000px 600px at 50% 0%, rgba(15,23,42,.03), rgba(0,0,0,0) 70%),
    radial-gradient(800px 500px at 20% 20%, rgba(15,23,42,.02), rgba(0,0,0,0) 60%),
    #f8fafc;
}`
);

// Replace header scrolled red border
css = css.replace(
    /:root\[data-theme="light"\]\s+\.header\.scrolled\s*\{[\s\S]*?border-bottom-color:[^}]+\}/,
    `:root[data-theme="light"] .header.scrolled {
  box-shadow: 0 4px 20px rgba(15,23,42,.06);
  border-bottom-color: rgba(15,23,42,.1);
}`
);

fs.writeFileSync('style.css', css, 'utf8');
console.log('style.css updated with regex replacement!');
