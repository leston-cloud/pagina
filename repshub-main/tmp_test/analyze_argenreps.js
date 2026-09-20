const fs = require('fs');

async function scrape() {
    console.log("Fetching https://argenreps.vercel.app/ ...");
    try {
        const res = await fetch("https://argenreps.vercel.app/");
        const html = await res.text();
        
        // Find all script tags
        const scriptRegex = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
        const scripts = html.match(scriptRegex);
        
        console.log(`Found ${scripts?.length || 0} scripts.`);
        if (scripts) {
            scripts.forEach((s, i) => {
                if (s.includes('src=')) {
                    console.log(`Script ${i}: ${s.match(/src="([^"]+)"/)?.[1] || s.match(/src='([^']+)'/)?.[1]}`);
                } else if (s.length > 50) {
                    console.log(`Script ${i} (inline): ${s.substring(0, 50)}...`);
                }
            });
        }

        // Look for Supabase config
        const supabaseUrlMatch = html.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/i);
        const supabaseKeyMatch = html.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/i);
        
        if (supabaseUrlMatch) console.log("Supabase URL:", supabaseUrlMatch[1]);
        if (supabaseKeyMatch) console.log("Supabase Key:", supabaseKeyMatch[1]);

    } catch (e) {
        console.error("Error:", e);
    }
}
scrape();
