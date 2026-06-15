import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.result);
        }
      }
    });
  }

  connect() {
    return new Promise((resolve) => {
      this.ws.on('open', resolve);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const pages = await httpGet('http://127.0.0.1:9222/json');
  const page = pages.find(p => p.type === 'page');
  
  if (!page) {
    throw new Error("No active browser pages found.");
  }
  
  console.log(`Connecting to page ${page.id}...`);
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  
  console.log("Navigating to http://localhost:8080...");
  await client.send('Page.navigate', { url: 'http://localhost:8080' });
  await sleep(4000);
  
  console.log("Capturing screenshot...");
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  
  const dest = '/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/cdp_screenshot.png';
  fs.writeFileSync(dest, buffer);
  console.log(`Screenshot saved to ${dest}`);
  
  client.close();
}

main().catch(console.error);
