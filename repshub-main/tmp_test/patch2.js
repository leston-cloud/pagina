const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');
    const oldFunc = `function resolveProductImageSources(product) {
    const kakobuyImage = getValidKakobuyProductImage(
        pickFirstNonEmptyFieldValue(product, KAKOBUY_IMAGE_FIELD_CANDIDATES)
    );
    const supabaseImage = getValidFallbackProductImage(
        pickFirstNonEmptyFieldValue(product, SUPABASE_IMAGE_FIELD_CANDIDATES)
    );

    return [kakobuyImage, supabaseImage, LOCAL_PRODUCT_PLACEHOLDER]
        .filter((source, index, array) => source && array.indexOf(source) === index);
}`;
    const newFunc = `function resolveProductImageSources(product) {
    const rawKakobuy = pickFirstNonEmptyFieldValue(product, KAKOBUY_IMAGE_FIELD_CANDIDATES);
    const rawSupabase = pickFirstNonEmptyFieldValue(product, SUPABASE_IMAGE_FIELD_CANDIDATES);
    
    const sources = [];
    if (rawKakobuy) {
        rawKakobuy.split(',').forEach(s => {
            const valid = getValidKakobuyProductImage(s.trim());
            if (valid) sources.push(valid);
        });
    }
    if (rawSupabase) {
        rawSupabase.split(',').forEach(s => {
            const valid = getValidFallbackProductImage(s.trim());
            if (valid) sources.push(valid);
        });
    }

    const uniqueSources = sources.filter((source, index, array) => source && array.indexOf(source) === index);
    if (uniqueSources.length === 0) uniqueSources.push(LOCAL_PRODUCT_PLACEHOLDER);
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

patch('script.js');
