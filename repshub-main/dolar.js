// Vercel Serverless Function to fetch dollar rate
// This avoids CORS issues by fetching server-side

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    
    try {
        // Fetch from the upstream API
        const response = await fetch('https://api-dolar-argentina.herokuapp.com/api/dolaroficial', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Upstream API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract the dollar rate
        let dolarOficial = null;
        if (data.venta) {
            dolarOficial = parseFloat(data.venta);
        } else if (data.compra) {
            // Fallback to compra if venta is not available
            dolarOficial = parseFloat(data.compra);
        }
        
        if (!dolarOficial || isNaN(dolarOficial)) {
            throw new Error('Invalid dollar rate in API response');
        }
        
        // Set cache headers (5 minutes)
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        
        // Return success
        return res.status(200).json({
            ok: true,
            dolar_oficial: dolarOficial
        });
        
    } catch (error) {
        console.error('Error fetching dollar rate:', error);
        
        // Return error response
        return res.status(500).json({
            ok: false,
            error: error.message || 'Failed to fetch dollar rate'
        });
    }
}
