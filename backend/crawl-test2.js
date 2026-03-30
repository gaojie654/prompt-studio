const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  // Try GraphQL endpoint
  const { status, body } = await get('https://opennana.com/api/graphql');
  console.log('GraphQL status:', status);
  console.log(body.substring(0, 300));

  // Try to find sitemap
  const sitemap = await get('https://opennana.com/sitemap.xml');
  console.log('\nSitemap status:', sitemap.status);
  console.log(sitemap.body.substring(0, 500));
}

main().catch(console.error);
