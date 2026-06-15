import http from 'http';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const pages = await httpGet('http://127.0.0.1:9222/json');
  console.log("=== Open Tabs ===");
  pages.forEach((p, i) => {
    console.log(`Tab #${i + 1}:`);
    console.log(`  Title: ${p.title}`);
    console.log(`  URL:   ${p.url}`);
    console.log(`  Type:  ${p.type}`);
    console.log(`  Id:    ${p.id}`);
  });
}

main().catch(console.error);
