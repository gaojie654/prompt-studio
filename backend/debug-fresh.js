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
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject).setTimeout(20000, () => reject(new Error('timeout')));
  });
}

function parseRsc(html) {
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  const parts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const s = m[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r')
        .replace(/\\'/g, "'").replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
      parts.push(s);
    } catch(e) {}
  }
  return parts.join('');
}

async function main() {
  const url = 'https://opennana.com/awesome-prompt-gallery/platinum-hair-lazy-fashion';
  const body = await httpGet(url);
  const rsc = parseRsc(body);
  console.log('RSC length:', rsc.length);
  
  // Check for key markers
  console.log('Has "$L1c":', rsc.includes('"$L1c"'));
  console.log('Has "$L1d":', rsc.includes('$L1d'));
  console.log('Has "中文提示词":', rsc.includes('中文提示词'));
  console.log('Has "application/ld+json":', rsc.includes('application/ld+json'));
  console.log('Has schema.org:', rsc.includes('schema.org'));
  console.log('Has __html:', rsc.includes('__html'));
  
  // Check HTML for JSON-LD directly
  const ldMatch = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  console.log('\nJSON-LD in HTML:', ldMatch ? 'FOUND' : 'NOT FOUND');
  if (ldMatch) {
    try {
      const json = JSON.parse(ldMatch[1]);
      console.log('name:', json.name);
      console.log('image:', json.image ? 'yes' : 'no');
    } catch(e) {
      console.log('JSON parse error:', e.message);
    }
  }
}

main().catch(console.error);
