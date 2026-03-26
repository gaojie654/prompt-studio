const https = require('https');

const options = {
  hostname: 'api.siliconflow.cn',
  path: '/v1/models',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk-elpfeaiktwilqglwtlsztdnjwcvbsmtztjzqjgvvciebgxdc'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data);
    models.data.forEach(m => {
      console.log(m.id);
    });
  });
});
req.end();
