export const config = {
    api: {
        responseLimit: '8mb',
    },
};

export default async function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const parsedUrl = new URL(url);
        
        // Prevent recursive proxying or proxying internal APIs
        if (parsedUrl.hostname.includes('repshub')) {
            return res.status(403).send('Invalid url');
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        };

        // Specific referer required by Yupoo to bypass 403 Forbidden anti-hotlinking
        if (parsedUrl.hostname.includes('yupoo.com')) {
            // Dynamic referer based on the subdomain of the image
            // Some images are on x.yupoo.com, others on photo.yupoo.com or pic.yupoo.com
            const subdomain = parsedUrl.hostname.split('.')[0];
            if (subdomain && subdomain !== 'yupoo') {
                headers['Referer'] = `https://${subdomain}.yupoo.com/`;
            } else {
                headers['Referer'] = 'https://x.yupoo.com/';
            }
        }

        const fetchRes = await fetch(url, { 
            headers,
            redirect: 'follow'
        });
        
        if (!fetchRes.ok) {
            console.error(`Fetch failed for ${url}: ${fetchRes.status} ${fetchRes.statusText}`);
            // If Yupoo returns 403, we might want to try another referer or just pass it through
            return res.status(fetchRes.status).send(`Failed to fetch image: ${fetchRes.status}`);
        }

        const contentType = fetchRes.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Heavily cache images at the CDN edge (1 year)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        const buffer = await fetchRes.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
    } catch (e) {
        console.error('Image Proxy Error:', e);
        return res.status(500).send('Internal Server Error fetching image');
    }
}
