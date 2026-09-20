async function dbg() {
    const res = await fetch("https://moonreps.vercel.app/_next/data/7312KcPvA0bO68E7_cYcF/index.json");
    const data = await res.json();
    console.log(Object.keys(data));
    console.log(Object.keys(data.pageProps));
    // Let's print a sample product if it exists somewhere
    if(data.pageProps.allProducts) {
        console.log("Found allProducts arrays");
    } else {
        console.log("No allProducts... inspecting keys deeply.");
        const findProducts = JSON.stringify(data).substring(0, 1000);
        console.log("Dump:", findProducts);
    }
}
dbg();
