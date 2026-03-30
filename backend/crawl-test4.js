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
  const { body: sitemap } = await get('https://opennana.com/sitemap.xml');
  const urls = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
  const allUrls = urls.map(u => u.replace(/<\/?loc>/g, ''));

  console.log('All URLs:');
  allUrls.slice(0, 20).forEach(u => console.log(' ', u));

  // Fetch a gallery page
  const galleryUrl = allUrls.find(u => u.includes('awesome-prompt-gallery') && u.length > 'https://opennana.com/awesome-prompt-gallery'.length + 5);
  if (galleryUrl) {
    console.log('\n\nFetching gallery:', galleryUrl);
    const { status, body } = await get(galleryUrl);
    console.log('Status:', status, 'Body length:', body.length);

    // Look for __NEXT_DATA__
    const nextData = body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextData) {
      try {
        const json = JSON.parse(nextData[1]);
        console.log('\nNEXT_DATA keys:', Object.keys(json));
        const pageProps = json.props?.pageProps || {};
        console.log('pageProps keys:', Object.keys(pageProps));
        if (pageProps.prompts) {
          console.log('Found prompts array, length:', pageProps.prompts.length);
          console.log('Sample prompt:', JSON.stringify(pageProps.prompts[0], null, 2).substring(0, 500));
        }
        if (pageProps.list) {
          console.log('Found list array, length:', pageProps.list.length);
        }
      } catch(e) {
        console.log('Parse NEXT_DATA error:', e.message);
      }
    } else {
      console.log('No __NEXT_DATA__ found');
      // Check for prompt IDs in URL patterns
      const promptIds = body.match(/prompt-(\d+)/gi) || [];
      console.log('Prompt ID patterns:', [...new Set(promptIds)].slice(0, 10));
    }
  }
}

main().catch(console.error);
