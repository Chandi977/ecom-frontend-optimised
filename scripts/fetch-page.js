const http = require('http');

const run = () => {
  http.get('http://localhost:3000/corrugated-boxes', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('HEADERS:', res.headers);
      if (data.includes('Showing')) {
        console.log('Found Showing:');
        const idx = data.indexOf('Showing');
        console.log(data.substring(idx - 50, idx + 100));
      } else {
        console.log('Showing not found in HTML');
      }
      if (data.includes('Sorry')) {
        console.log('Found Sorry:');
        const idx = data.indexOf('Sorry');
        console.log(data.substring(idx - 50, idx + 100));
      }
    });
  }).on('error', (err) => {
    console.error('Fetch Error:', err.message);
  });
};

run();
