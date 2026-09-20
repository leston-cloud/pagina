const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\mateo\\.gemini\\antigravity\\brain\\af1c7495-fbc5-4dd2-ab12-07e7d98ee7e4\\.system_generated\\steps\\156\\content.md';
const outputPath = 'C:\\Users\\mateo\\OneDrive\\Escritorio\\repshub-main\\data\\products.local.json';

// Leer el archivo de contenido
let content = fs.readFileSync(inputPath, 'utf8');

// Extraer el JSON (está después de las 4 primeras líneas)
const lines = content.split('\n');
const jsonStartIndex = lines.findIndex(line => line.startsWith('['));
if (jsonStartIndex === -1) {
    console.error('No se encontró JSON en el archivo');
    process.exit(1);
}
const rawJson = lines.slice(jsonStartIndex).join('\n');

try {
    const products = JSON.parse(rawJson);
    console.log(`Leídos ${products.length} productos de MoonReps`);

    const migratedProducts = products.map((p, index) => {
        // Mapear campos de MoonReps al formato esperado por Kakosheet
        // User affcode: gonza
        
        let buyLink = p.buyLink || '';
        // Intentar reemplazar códigos de referido si están visibles
        buyLink = buyLink.replace(/affcode=[^&]+/g, 'affcode=gonza');
        buyLink = buyLink.replace(/inviteCode=[^&]+/g, 'inviteCode=gonza');
        buyLink = buyLink.replace(/invitation_code=[^&]+/g, 'invitation_code=gonza');
        buyLink = buyLink.replace(/ref=[^&]+/g, 'ref=gonza');

        return {
            id: `moon-${p.id || index}`,
            nombre: p.name || 'Producto sin nombre',
            categoria: p.category || '',
            precio_cny: parseFloat(p.price) || 0,
            kakobuy_image_url: (p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls[0] : '',
            source_url: buyLink,
            created_at: p.created_at || new Date().toISOString(),
            activo: true,
            destacado: p.featured === true,
            qc_images: p.imageUrls || []
        };
    });

    fs.writeFileSync(outputPath, JSON.stringify(migratedProducts, null, 2));
    console.log(`Migración completada. ${migratedProducts.length} productos guardados en ${outputPath}`);

} catch (e) {
    console.error('Error al procesar JSON:', e);
}
