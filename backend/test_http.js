const http = require('http');

http.get('http://localhost:5000/api/reports/analytics', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
