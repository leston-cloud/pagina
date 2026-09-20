const KAKOBUY_FIELDS = ['kakobuy_image_url'];
const FALLBACK_FIELDS = ['imagen_url', 'image_url', 'imagen'];
const LOCAL_PLACEHOLDER = '/placeholder.svg';

function pickFirstNonEmptyFieldValue(obj, fields) {
    for (const field of fields) {
        if (obj[field] && typeof obj[field] === 'string' && obj[field].trim() !== '') {
            return obj[field].trim();
        }
    }
    return '';
}

function normalizeRemoteImageUrl(url) {
    return 'https://proxy?url=' + encodeURIComponent(url);
}

function getValidKakobuyProductImage(url) { return normalizeRemoteImageUrl(url); }
function getValidFallbackProductImage(url) { return normalizeRemoteImageUrl(url); }

function resolveProductImageSources(product) {
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
}

const product = {
    nombre: '75¥ queen money tee',
    imagen_url: 'https://photo.yupoo.com/goat-official/ee791d16/medium.jpg,https://photo.yupoo.com/goat-official/f0d1dac7/medium.jpeg,https://photo.yupoo.com/goat-official/7f19080d/medium.jpg'
};

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

console.log("allImages:", allImages);
console.log("length:", allImages.length);
