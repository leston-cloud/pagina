const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://loganhere.x.yupoo.com/albums/130198642?uid=1');
fetch(url).then(r=>r.text()).then(t => { 
    const match = t.match(/data-src="([^"]+)"/g); 
    console.log(match ? match.slice(0,5) : 'none');
}).catch(console.error);
