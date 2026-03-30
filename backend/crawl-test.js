const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const urls = [
    'https://opennana.com/api/prompts?page=1&pageSize=3',
    'https://opennana.com/api/prompt/list',
    'https://opennana.com/api/gallery',
    'https://opennana.com/api/v1/prompts',
  ];
  for (const url of urls) {
    const { status, body } = await get(url);
    console.log(`\n=== ${url} ===`);
    console.log(`Status: ${status}`);
    console.log(body.substring(0, 400));
  }
}

main().catch(console.error);
