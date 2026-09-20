const SUPABASE_URL = "https://szohpkcgubckxoauspmr.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2hwa2NndWJja3hvYXVzcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTMwNTksImV4cCI6MjA4NTAyOTA1OX0.bSbr61juTNd0Y4LchHjT2YbvCl-uau2GN83V-2HhkWE";

async function main() {
    const url = `${SUPABASE_URL}/rest/v1/products_clean?select=id,nombre,created_at&order=created_at.desc&limit=45`;
    const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const data = await res.json();
    console.log("Los 45 que se MANTIENEN:");
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.nombre}`));
}
main();
