const fs = require('fs');

async function extractData() {
    console.log("Fetching https://argenreps.vercel.app/ ...");
    try {
        const res = await fetch("https://argenreps.vercel.app/");
        const html = await res.text();
        
        // Next.js app router often embeds data in scripts or we can just search for keywords
        // Let's try to extract JSON-like strings that look like arrays of products.
        // Products usually have "nombre", "precio", "url", "imagen", "category", etc.
        
        // Find strings that look like JSON arrays
        const regex = /\[.*?\]/g;
        let match;
        let largestArray = [];
        
        // Or we can just look for the words
        const keywordMatches = html.match(/nombre.{1,50}precio/gi);
        if (keywordMatches) {
            console.log("Found keywords:");
            console.log(keywordMatches.slice(0, 5));
        }

        // Just dump the first 1000 characters of the script blocks
        const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        let matchScript;
        while ((matchScript = scriptRegex.exec(html)) !== null) {
            const content = matchScript[1];
            if (content.includes('nombre') || content.includes('precio') || content.includes('Weidian') || content.includes('Taobao') || content.includes('1688') || content.includes('category')) {
                console.log("Found potential data in script block:");
                console.log(content.substring(0, 1000) + "...");
                
                // Save it to a file to inspect
                fs.writeFileSync('tmp_test/argenreps_data.txt', content);
                break;
            }
        }
        
        // Sometimes data is in __NEXT_DATA__ if it's pages router
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
        if (nextDataMatch) {
            console.log("Found __NEXT_DATA__");
            fs.writeFileSync('tmp_test/argenreps_next_data.json', nextDataMatch[1]);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}
extractData();
