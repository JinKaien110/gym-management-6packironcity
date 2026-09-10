const dns = require('dns');

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);

console.log('DNS servers set to Cloudflare/Google');