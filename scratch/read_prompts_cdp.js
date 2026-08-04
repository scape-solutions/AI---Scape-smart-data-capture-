import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function httpPut(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
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
  console.log("Fetching active pages...");
  let pages = await httpGet('http://127.0.0.1:9222/json');
  let page = pages.find(p => p.type === 'page');
  
  if (!page) {
    console.log("No active pages. Opening a new tab...");
    page = await httpPut('http://127.0.0.1:9222/json/new?url=http://localhost:8080');
    // Wait for the new page to be listed
    await sleep(1000);
    pages = await httpGet('http://127.0.0.1:9222/json');
    page = pages.find(p => p.type === 'page');
  }
  
  if (!page) {
    throw new Error("Could not find or open a browser page.");
  }
  
  console.log(`Connecting to page: ${page.id} via WebSocket...`);
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  console.log("Connected to CDP WebSocket!");
  
  console.log("Enabling Page and Runtime domains...");
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  
  console.log("Navigating to http://localhost:8080...");
  await client.send('Page.navigate', { url: 'http://localhost:8080' });
  
  // Wait for load
  console.log("Waiting 3 seconds for page load...");
  await sleep(3000);
  
  console.log("Clicking splash screen if visible...");
  const clickRes = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const card = document.querySelector('h1')?.parentElement;
        if (card) {
          card.click();
          return "Clicked splash screen card";
        }
        return "Splash screen card not found";
      })()
    `,
    returnByValue: true
  });
  console.log(`Click result: ${clickRes.result.value}`);
  
  console.log("Waiting 3 seconds for page transition...");
  await sleep(3000);

  console.log("Capturing page screenshot after splash click...");
  const postClickScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/after_click_splash.png', Buffer.from(postClickScreenshot.data, 'base64'));
  console.log("Screenshot saved to after_click_splash.png");
  
  console.log("Switching to SUPER USER mode...");
  const switchRes = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const superUserBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Super User');
        if (superUserBtn) {
          superUserBtn.click();
          return "Clicked Super User button";
        }
        return "Super User button not found (might already be superuser or not loaded)";
      })()
    `,
    returnByValue: true
  });
  console.log(`Switch Result: ${switchRes.result.value}`);
  await sleep(1500);
  
  console.log("Clicking 'Edit AI Prompts'...");
  const editRes = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('Edit AI Prompts'));
        if (editBtn) {
          editBtn.click();
          return "Clicked Edit AI Prompts button";
        }
        return "Edit AI Prompts button not found";
      })()
    `,
    returnByValue: true
  });
  console.log(`Edit Click Result: ${editRes.result.value}`);
  await sleep(2000);
  
  // Now let's extract prompts by switching tabs and reading textarea
  console.log("Extracting prompts...");
  const extractRes = await client.send('Runtime.evaluate', {
    expression: `
      async function extract() {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const results = {};
        
        const tab1 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('Project Information Advice'));
        // Tab 1: Project Information Advice
        if (tab1) {
          tab1.click();
          await sleep(500);
          results.externalAdvice = document.querySelector('textarea')?.value || '';
        }
        
        // Tab 2: Technical Evaluation
        const tab2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('Technical Evaluation'));
        if (tab2) {
          tab2.click();
          await sleep(500);
          results.evaluatorDraft = document.querySelector('textarea')?.value || '';
        }
        
        // Tab 3: AI Chat Assistant
        const tab3 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes('AI Chat Assistant'));
        if (tab3) {
          tab3.click();
          await sleep(500);
          results.autoFill = document.querySelector('textarea')?.value || '';
        }
        
        return results;
      }
      extract();
    `,
    awaitPromise: true,
    returnByValue: true
  });
  
  const extracted = extractRes.result.value;
  console.log("Extracted Prompt Data Keys:", Object.keys(extracted || {}));
  
  if (extracted) {
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_evaluatorDraftPrompt.md', extracted.evaluatorDraft || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_externalAdvicePrompt.md', extracted.externalAdvice || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_autoFillPrompt.md', extracted.autoFill || '');
    console.log("SUCCESS: Prompts saved to files!");
  } else {
    console.log("Failed to extract prompts.");
  }
  
  client.close();
}

main().catch(console.error);
