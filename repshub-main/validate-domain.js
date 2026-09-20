// API endpoint para validar dominios autorizados
// Solo permite acceso desde dominios autorizados

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            ok: false, 
            error: 'Method not allowed' 
        });
    }
    
    try {
        const { domain, origin } = req.body;
        
        // Lista de dominios autorizados (repshub.vercel.app es el dominio principal)
        const AUTHORIZED_DOMAINS = [
            'repshub.vercel.app',
            'www.repshub.vercel.app',
            'repshub1.vercel.app',
            'www.repshub1.vercel.app',
            'fashionreps.vercel.app',
            'www.fashionreps.vercel.app',
            'localhost',
            '127.0.0.1'
        ];
        
        // Validar dominio u origen
        const domainToCheck = domain || origin || '';
        const isValidDomain = AUTHORIZED_DOMAINS.some(authorized => {
            return domainToCheck.includes(authorized) || 
                   domainToCheck === authorized ||
                   domainToCheck.endsWith('.' + authorized);
        });
        
        if (!isValidDomain) {
            return res.status(403).json({
                ok: false,
                authorized: false,
                error: 'Dominio no autorizado'
            });
        }
        
        // Generar token de sesión temporal (válido por 1 hora)
        const sessionToken = Buffer.from(`${Date.now()}-${domainToCheck}`).toString('base64');
        
        return res.status(200).json({
            ok: true,
            authorized: true,
            domain: domainToCheck,
            sessionToken: sessionToken,
            expiresAt: Date.now() + (60 * 60 * 1000) // 1 hora
        });
        
    } catch (error) {
        console.error('Error validating domain:', error);
        return res.status(500).json({
            ok: false,
            error: 'Error interno del servidor'
        });
    }
}
