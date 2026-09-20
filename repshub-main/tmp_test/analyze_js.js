const fs = require('fs');
const https = require('https');

async function downloadAndSearch() {
    console.log("Fetching https://argenreps.vercel.app/ ...");
    try {
        const res = await fetch("https://argenreps.vercel.app/");
        const html = await res.text();
        
        const scriptRegex = /src="(\/_next\/static\/chunks\/[^"]+)"/g;
        let match;
        const urls = [];
        while ((match = scriptRegex.exec(html)) !== null) {
            urls.push("https://argenreps.vercel.app" + match[1]);
        }
        
        console.log(`Found ${urls.length} JS files. Downloading and searching...`);
        
        for (const url of urls) {
            try {
                const jsRes = await fetch(url);
                const js = await jsRes.text();
                
                // Search for interesting keywords
                if (js.includes('supabase.co')) {
                    console.log(`\nFound 'supabase.co' in ${url}:`);
                    const matches = js.match(/.{0,50}supabase\.co.{0,50}/g);
                    console.log(matches);
                }
                if (js.includes('api/')) {
                    const apiMatches = js.match(/['"]\/?[a-z0-9_/-]*api\/[a-z0-9_/-]*['"]/gi);
                    if (apiMatches) {
                        console.log(`\nFound 'api/' endpoints in ${url}:`);
                        console.log([...new Set(apiMatches)]);
                    }
                }
                
                const jsonMatches = js.match(/['"]https?:\/\/[^'"]+\.json['"]/gi);
                if (jsonMatches) {
                    console.log(`\nFound JSON URLs in ${url}:`);
                    console.log([...new Set(jsonMatches)]);
                }
                
            } catch (e) {
                console.error(`Error fetching ${url}:`, e);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}
downloadAndSearch();
