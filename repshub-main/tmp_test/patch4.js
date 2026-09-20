const fs = require('fs');
['productos.html', 'index.html'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/script\.js\?v=\d+/g, 'script.js?v=' + Date.now().toString().slice(-4));
    content = content.replace(/product-overrides\.js\?v=\d+/g, 'product-overrides.js?v=' + Date.now().toString().slice(-4));
    fs.writeFileSync(file, content);
});
