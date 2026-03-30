const { crawlOpennana } = require('./src/services/opennana-crawler.service');

crawlOpennana()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err.message, err.stack));
