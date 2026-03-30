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
  // Get sitemap to find all prompt URLs
  const { body: sitemap } = await get('https://opennana.com/sitemap.xml');
  const urls = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
  const allUrls = urls.map(u => u.replace(/<\/?loc>/g, ''));

  console.log(`Total URLs in sitemap: ${allUrls.length}`);

  // Filter prompt gallery URLs
  const promptUrls = allUrls.filter(u => u.includes('/prompt-'));
  const galleryUrls = allUrls.filter(u => u.includes('/awesome-prompt-gallery') && !u.includes('/prompt-'));

  console.log(`Prompt detail pages: ${promptUrls.length}`);
  console.log(`Gallery pages: ${galleryUrls.length}`);
  console.log('\nFirst 5 prompt URLs:');
  promptUrls.slice(0, 5).forEach(u => console.log(' ', u));

  // Fetch one prompt page to understand structure
  if (promptUrls.length > 0) {
    const { status, body } = await get(promptUrls[0]);
    console.log(`\n=== Fetching: ${promptUrls[0]} ===`);
    console.log(`Status: ${status}`);
    console.log(`Body length: ${body.length}`);

    // Look for image URLs
    const imgMatches = body.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/gi) || [];
    console.log('\nImage URLs found:', imgMatches.slice(0, 5));

    // Look for prompt text
    const promptMatches = body.match(/"prompt"\s*:\s*"([^"]+)"/gi) || [];
    console.log('\nPrompt patterns found:', promptMatches.slice(0, 3));

    // Look for JSON data in __NEXT_DATA__
    const nextDataMatch = body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const json = JSON.parse(nextDataMatch[1]);
        console.log('\nNEXT_DATA props keys:', Object.keys(json.props || {}));
        console.log('NEXT_DATA page:', json.page);
      } catch(e) {
        console.log('Failed to parse NEXT_DATA');
      }
    }
  }
}

main().catch(console.error);
