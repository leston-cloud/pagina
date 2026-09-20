const url = 'https://loganhere.x.yupoo.com/albums/130198642?uid=1';
fetch(url).then(r=>r.text()).then(t => { 
    // console.log(t.substring(0, 1000));
    // Find all image URLs from data-src or src inside image-wrap or just .jpg/.png links
    const matches = Array.from(t.matchAll(/data-src=\"([^\"]+)\"/g));
    const urls = matches.map(m => m[1]);
    console.log(urls.length > 0 ? urls.slice(0,5) : 'none');
    
    // Check if it's returning empty because of anti-bot
    if (urls.length === 0) {
        const otherMatches = Array.from(t.matchAll(/src=\"([^\"]+\.jpe?g|png)\"/gi));
        console.log(otherMatches.map(m => m[1]).slice(0, 5));
    }
}).catch(console.error);
