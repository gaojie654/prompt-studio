const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const login = await request('POST', '/api/v1/admin/login', { email: 'admin@promptstudio.com', password: 'admin123' });
  console.log('Login:', login.status, login.data.code === 0 ? 'OK' : 'FAIL');
  if (login.data.code !== 0) { console.log(login.data); return; }

  const token = login.data.data.accessToken;
  console.log('Token:', token.substring(0, 30) + '...');

  const prompts = await request('GET', '/api/v1/admin/prompts?page=1&limit=5', null, token);
  console.log('\nPrompts API:', prompts.status);
  if (prompts.data.code !== 0) { console.log(prompts.data); return; }
  console.log('Total:', prompts.data.data.pagination.total);
  console.log('First prompt:', JSON.stringify(prompts.data.data.prompts?.[0])?.substring(0, 300));
}

main().catch(console.error);
