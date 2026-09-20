const fs = require('fs');
const path = require('path');

const scriptStr = `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-0N938PXJ1R"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-0N938PXJ1R');
    </script>
`;

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has this specific tag to avoid duplicates
    if (content.includes('id=G-0N938PXJ1R')) {
        console.log(`Skipped ${file} (already contains tag)`);
        return;
    }
    
    // Replace <head> with <head> + script
    if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>${scriptStr}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`No <head> tag found in ${file}`);
    }
});
