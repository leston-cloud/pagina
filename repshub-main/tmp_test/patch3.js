const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');
    const newFunc = `function resolveProductImageSources(product) {
    const rawKakobuy = pickFirstNonEmptyFieldValue(product, KAKOBUY_FIELDS);
    const rawFallback = pickFirstNonEmptyFieldValue(product, FALLBACK_FIELDS);
    
    const sources = [];
    if (rawKakobuy) {
        rawKakobuy.split(',').forEach(s => {
            const valid = getValidKakobuyProductImage(s.trim());
            if (valid) sources.push(valid);
        });
    }
    if (rawFallback) {
        rawFallback.split(',').forEach(s => {
            const valid = getValidFallbackProductImage(s.trim());
            if (valid) sources.push(valid);
        });
    }

    const uniqueSources = sources.filter((source, index, array) => source && array.indexOf(source) === index);
    if (uniqueSources.length === 0) uniqueSources.push(LOCAL_PLACEHOLDER);
    return uniqueSources;
  }`;
    // Replace by matching the regex
    const regex = /function resolveProductImageSources\(product\) \{[\s\S]*?\.filter\(\(source, index, array\) => source && array\.indexOf\(source\) === index\);\s*\}/;
    if (regex.test(content)) {
        content = content.replace(regex, newFunc);
        fs.writeFileSync(file, content);
        console.log("Patched", file);
    } else {
        console.log("Could not find match in", file);
    }
}

patch('product-overrides.js');
