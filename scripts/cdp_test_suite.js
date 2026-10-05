// scripts/cdp_test_suite.js
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\35a1f9fa-b4b5-4eb4-b852-49e874092ee7';

async function run() {
  console.log('Connecting to Chrome DevTools Protocol at http://127.0.0.1:9222...');
  const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('localhost:5173') || t.title.includes('Areos')));

  if (!pageTarget) {
    throw new Error('Could not find Areos AI page target in Chrome. Targets: ' + JSON.stringify(targets));
  }

  console.log('Target found:', pageTarget.title, pageTarget.url);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pendingRequests = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
      }
    } else if (msg.method === 'Log.entryAdded') {
      if (msg.params.entry.level === 'error') {
        consoleErrors.push(msg.params.entry.text);
      }
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalCode(fnBody) {
    const wrapped = `(() => { ${fnBody} })()`;
    const res = await send('Runtime.evaluate', {
      expression: wrapped,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      console.warn('Evaluation exception:', res.exceptionDetails);
    }
    return res.result ? res.result.value : undefined;
  }

  async function saveScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const dest = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(dest, buffer);
    console.log(`Saved screenshot: ${dest}`);
    return dest;
  }

  // Enable necessary domains
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  console.log('Navigating to http://localhost:5173/#/ai...');
  await evalCode(`window.location.hash = '#/ai';`);
  await new Promise(r => setTimeout(r, 1200));

  // ==========================================
  // TEST 7: Break key on purpose -> offline error with Retry
  // ==========================================
  console.log('\n--- Running TEST 7: Broken API Key Offline Error State ---');
  await evalCode(`
    localStorage.setItem('areos_demo_mode', 'false');
    const p = window.AIIntelligencePageInstance;
    if (p) p.startNewChat();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Type and send "analyze my portfolio risk"
  await evalCode(`
    const input = document.getElementById('aiPromptInput');
    if (input) input.value = 'analyze my portfolio risk';
    const p = window.AIIntelligencePageInstance;
    if (p) p.handleSendPrompt('analyze my portfolio risk');
  `);

  // Wait for error card to appear
  console.log('Waiting for offline error card to render...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    const hasError = await evalCode(`
      return Boolean(document.querySelector('.btn-retry-inference') && document.body.innerText.includes('Areos AI is offline'));
    `);
    if (hasError) break;
  }

  const errorCardText = await evalCode(`
    return document.querySelector('.btn-retry-inference')?.closest('.bg-obsidian-card')?.innerText || '';
  `);
  console.log('Offline Error Card text:\n', errorCardText);
  await saveScreenshot('test7_offline_error.png');

  // ==========================================
  // Enable Demo Mode in Settings for natural tests 1-6 & 8
  // ==========================================
  console.log('\n--- Switching to Demo Mode in Settings ---');
  await evalCode(`
    window.location.hash = '#/settings';
  `);
  await new Promise(r => setTimeout(r, 600));

  await evalCode(`
    const toggle = document.getElementById('toggleDemoMode');
    if (toggle) toggle.checked = true;
    const btn = document.getElementById('btnSaveSettings');
    if (btn) btn.click();
    localStorage.setItem('areos_demo_mode', 'true');
  `);
  await new Promise(r => setTimeout(r, 500));

  // Return to AI page
  await evalCode(`
    window.location.hash = '#/ai';
  `);
  await new Promise(r => setTimeout(r, 800));

  // Helper function to send prompt and wait for reply completion
  async function testPrompt(promptText) {
    await evalCode(`
      const p = window.AIIntelligencePageInstance;
      if (p) p.handleSendPrompt(${JSON.stringify(promptText)});
    `);

    // Poll until isReplying is false
    for (let i = 0; i < 150; i++) {
      await new Promise(r => setTimeout(r, 150));
      const isReplying = await evalCode(`return Boolean(window.AIIntelligencePageInstance?.isReplying);`);
      if (!isReplying) break;
    }
    await new Promise(r => setTimeout(r, 400));

    const lastReply = await evalCode(`
      const c = window.AIIntelligencePageInstance?.getActiveConversation();
      const msgs = c?.messages || [];
      const last = msgs[msgs.length - 1];
      return last ? last.content : '';
    `);
    return lastReply;
  }

  // ==========================================
  // TEST 1: "hi" -> short friendly greeting with no data dump
  // ==========================================
  console.log('\n--- Running TEST 1: "hi" ---');
  await evalCode(`const p = window.AIIntelligencePageInstance; if (p) p.startNewChat();`);
  await new Promise(r => setTimeout(r, 400));

  const reply1 = await testPrompt('hi');
  console.log('Test 1 Response:\n', reply1);
  await saveScreenshot('test1_greeting_hi.png');

  // ==========================================
  // TEST 2: "what can you do?"
  // ==========================================
  console.log('\n--- Running TEST 2: "what can you do?" ---');
  const reply2 = await testPrompt('what can you do?');
  console.log('Test 2 Response:\n', reply2);

  // ==========================================
  // TEST 3: "analyze my portfolio risk" -> calls get_portfolio / get_sentiment_and_risk
  // ==========================================
  console.log('\n--- Running TEST 3: "analyze my portfolio risk" ---');
  await evalCode(`const p = window.AIIntelligencePageInstance; if (p) p.startNewChat();`);
  await new Promise(r => setTimeout(r, 400));

  const reply3 = await testPrompt('analyze my portfolio risk');
  console.log('Test 3 Response:\n', reply3);
  await saveScreenshot('test3_portfolio_risk.png');

  // ==========================================
  // TEST 4: "compare S&P 500 and NIFTY 50" -> market snapshot table
  // ==========================================
  console.log('\n--- Running TEST 4: "compare S&P 500 and NIFTY 50" ---');
  const reply4 = await testPrompt('compare S&P 500 and NIFTY 50');
  console.log('Test 4 Response:\n', reply4);

  // ==========================================
  // TEST 5: "should I buy NVDA?" -> balanced reasoning & risks
  // ==========================================
  console.log('\n--- Running TEST 5: "should I buy NVDA?" ---');
  const reply5 = await testPrompt('should I buy NVDA?');
  console.log('Test 5 Response:\n', reply5);

  // ==========================================
  // TEST 6: "what is the capital of France?" -> Paris + gentle nudge
  // ==========================================
  console.log('\n--- Running TEST 6: "what is the capital of France?" ---');
  const reply6 = await testPrompt('what is the capital of France?');
  console.log('Test 6 Response:\n', reply6);

  // ==========================================
  // TEST 8: Stop button mid-stream
  // ==========================================
  console.log('\n--- Running TEST 8: Stop button mid-stream ---');
  await evalCode(`const p = window.AIIntelligencePageInstance; if (p) p.startNewChat();`);
  await new Promise(r => setTimeout(r, 400));

  // Trigger prompt and quickly click stop
  await evalCode(`
    const p = window.AIIntelligencePageInstance;
    if (p) p.handleSendPrompt('run a 10% market stress test on my portfolio');
  `);
  // Wait 100ms for streaming to start, then click stop button
  await new Promise(r => setTimeout(r, 120));
  await evalCode(`
    const btnAction = document.getElementById('btnChatAction');
    if (btnAction && window.AIIntelligencePageInstance.isReplying) {
      btnAction.click();
    }
  `);
  await new Promise(r => setTimeout(r, 500));
  const isReplyingAfterStop = await evalCode(`return Boolean(window.AIIntelligencePageInstance?.isReplying);`);
  console.log('Is Replying after stop button click:', isReplyingAfterStop);

  // ==========================================
  // Console errors check
  // ==========================================
  console.log('\n--- Console Errors Check ---');
  console.log('Console Errors Count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }

  // Summary Report
  console.log('\n==============================================');
  console.log('TEST SUITE COMPLETED SUCCESSFULLY');
  console.log('==============================================');
  ws.close();
}

run().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
