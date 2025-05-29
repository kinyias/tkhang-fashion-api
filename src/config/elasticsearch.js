const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.BONSAI_URL, // Your Bonsai.io Elasticsearch URL

  // For free tier, keep requests minimal
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: false
});

module.exports = client;