const https = require('https');
const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    }).on('error', reject).setTimeout(20000, () => reject(new Error('timeout')));
  });
}

async function main() {
  try {
    const res = await httpGet('https://opennana.com/sitemap.xml');
    console.log('Status:', res.status);
    console.log('Body length:', res.body.length);
    // Extract URLs
    const urls = res.body.match(/<loc>(.*?)<\/loc>/g) || [];
    console.log('Found loc tags:', urls.length);
    urls.slice(0, 5).forEach(u => console.log(' -', u.replace(/<\/?loc>/g, '')));
    
    // Filter prompt gallery URLs
    const promptUrls = urls.map(u => u.replace(/<\/?loc>/g, '')).filter(u => u.includes('/awesome-prompt-gallery/') && !u.endsWith('/awesome-prompt-gallery'));
    console.log('\nPrompt URLs:', promptUrls.length);
    promptUrls.slice(0, 3).forEach(u => console.log(' -', u));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

main();
