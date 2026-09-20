async function getImages() {
    const res = await fetch('https://argenreps.vercel.app/');
    const text = await res.text();
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(text)) !== null) {
        urls.push(match[1]);
    }
    console.log(urls.slice(0, 10));
}
getImages();
