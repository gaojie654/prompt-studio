const https = require('https');

const body = JSON.stringify({
  model: 'Kwai-Kolors/Kolors',
  prompt: 'A cute cat',
  image_size: '1024x1024',
  n: 1
});

const options = {
  hostname: 'api.siliconflow.cn',
  path: '/v1/images/generations',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-elpfeaiktwilqglwtlsztdnjwcvbsmtztjzqjgvvciebgxdc',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
