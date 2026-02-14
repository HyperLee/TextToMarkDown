
const { chromium, firefox, webkit, devices } = require('playwright');
const path = require('path');
const helpers = require('C:/GitHubFolder/TextToMarkDown/.github/skills/playwright-skill/lib/helpers');

// 測試計畫環境變數
process.env.PW_TEST_PLAN = "{\"title\":\"TextToMarkDown 完整功能測試 (修正後)\",\"description\":\"驗證 turndown.js 修正後所有功能正常運作\",\"steps\":[\"頁面載入與 UI 元素\",\"TurndownService 載入驗證\",\"純文字轉換\",\"字元計數\",\"空白輸入驗證\",\"空白字元驗證\",\"特殊字元轉義\",\"HTML 轉 Markdown (核心修正)\",\"HTML 表格轉換 (GFM)\",\"複製空白警告\",\"複製成功\",\"Mermaid 偵測\",\"Markdown 原樣輸出\",\"項目符號正規化\",\"按鈕樣式\"]}";

// Extra headers from environment variables (if configured)
const __extraHeaders = helpers.getExtraHeadersFromEnv();

/**
 * Utility to merge environment headers into context options.
 * Also enables video and screenshot recording for the report.
 * @param {Object} options - Context options
 * @returns {Object} Options with extraHTTPHeaders and recording options merged in
 */
function getContextOptionsWithHeaders(options = {}) {
  const reportDir = process.env.PW_REPORT_DIR || path.join(process.cwd(), 'playwright-report-media');
  
  return {
    ...options,
    recordVideo: options.recordVideo || {
      dir: path.join(reportDir, 'videos/'),
      size: { width: 1280, height: 720 }
    },
    extraHTTPHeaders: {
      ...__extraHeaders,
      ...(options.extraHTTPHeaders || {})
    }
  };
}

(async () => {
  const startTime = Date.now();
  let status = '成功';
  let errorAnalysis = null;
  let pageContext = { url: 'N/A', title: 'N/A', statusCode: 'N/A' };
  const stats = { passed: 0, failed: 0, total: 0, steps: [] };

  // 輔助函式：記錄步驟與統計
  const logStep = async (name, success = true, options = {}) => {
    const icon = success ? '✅' : '❌';
    const reason = options.reason || '';
    const behavior = options.behavior || '';
    
    let logMsg = icon + ' [步驟] ' + name;
    if (behavior) logMsg += ' | 行為: ' + behavior;
    if (reason) logMsg += ' | 理由: ' + reason;
    
    console.log(logMsg);
    
    stats.total++;
    stats.steps.push({ 
      name, 
      success, 
      behavior: behavior,
      reason: reason
    });
    
    if (success) {
      stats.passed++;
    } else {
      stats.failed++;
      status = '失敗';
    }
  };
  global.logStep = logStep;
  global.stats = stats;

    // 解析測試計畫
    let testPlan = null;
    try {
      if (process.env.PW_TEST_PLAN) {
        // 直接解析環境變數
        testPlan = JSON.parse(process.env.PW_TEST_PLAN);
      }
    } catch (e) {
      // 如果解析失敗，嘗試處理轉義的換行符
      try {
        const rawPlan = process.env.PW_TEST_PLAN.replace(/\\n/g, '\n');
        testPlan = JSON.parse(rawPlan);
      } catch (e2) {
        // 仍然失敗則不處理
      }
    }

  // 取得當前執行的原始程式碼
  const rawTestCode = JSON.parse("\"const TARGET_URL = 'http://localhost:5000';\\r\\n\\r\\nconst browser = await helpers.launchBrowser();\\r\\nconst context = await helpers.createContext(browser);\\r\\nconst page = await helpers.createPage(context);\\r\\n\\r\\ntry {\\r\\n  // ============================================================\\r\\n  // Test 1: Page load and UI elements verification\\r\\n  // ============================================================\\r\\n  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });\\r\\n  await page.waitForLoadState('domcontentloaded');\\r\\n  await helpers.takeScreenshot(page, '01-page-loaded');\\r\\n\\r\\n  const title = await page.title();\\r\\n  await logStep('頁面載入成功', title.includes('Text to Markdown'), {\\r\\n    behavior: `頁面標題: \\\"${title}\\\"`,\\r\\n    reason: '驗證應用程式能正常啟動並載入'\\r\\n  });\\r\\n\\r\\n  // Check all critical UI elements exist\\r\\n  const elements = await page.evaluate(() => ({\\r\\n    inputText: !!document.getElementById('inputText'),\\r\\n    outputText: !!document.getElementById('outputText'),\\r\\n    convertBtn: !!document.getElementById('convertBtn'),\\r\\n    copyBtn: !!document.getElementById('copyBtn'),\\r\\n    charCount: !!document.getElementById('charCount'),\\r\\n    outputReadonly: document.getElementById('outputText')?.hasAttribute('readonly')\\r\\n  }));\\r\\n\\r\\n  await logStep('所有 UI 元素存在', Object.values(elements).every(Boolean), {\\r\\n    behavior: JSON.stringify(elements),\\r\\n    reason: '驗證頁面所有必要的互動元素已正確渲染且 output 為唯讀'\\r\\n  });\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 2: TurndownService loaded (fix verification)\\r\\n  // ============================================================\\r\\n  const turndownLoaded = await page.evaluate(() => typeof TurndownService !== 'undefined');\\r\\n  await logStep('TurndownService 載入成功 (domino 修正驗證)', turndownLoaded, {\\r\\n    behavior: `TurndownService available: ${turndownLoaded}`,\\r\\n    reason: '驗證 turndown.js 修正後能在瀏覽器中正確初始化'\\r\\n  });\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 3: Plain text conversion\\r\\n  // ============================================================\\r\\n  const plainTextInput = `This is a heading\\r\\n- Item one\\r\\n- Item two\\r\\n- Item three\\r\\n\\r\\nThis is a normal paragraph.`;\\r\\n\\r\\n  await page.fill('#inputText', plainTextInput);\\r\\n  await helpers.takeScreenshot(page, '02-plain-text-input');\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const plainTextOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const hasListOutput = plainTextOutput.includes('- Item one');\\r\\n  await logStep('純文字轉換 Markdown', plainTextOutput.length > 0 && hasListOutput, {\\r\\n    behavior: `輸出長度: ${plainTextOutput.length}, 包含列表: ${hasListOutput}`,\\r\\n    reason: '驗證純文字能正確轉換為 Markdown 格式'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '03-plain-text-output');\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 4: Character count updates\\r\\n  // ============================================================\\r\\n  const charCountText = await page.$eval('#charCount', el => el.textContent);\\r\\n  const expectedLen = [...plainTextInput].length;\\r\\n  await logStep('字元計數正確更新', charCountText.includes(expectedLen.toString()), {\\r\\n    behavior: `顯示: \\\"${charCountText}\\\", 預期包含: ${expectedLen}`,\\r\\n    reason: '驗證字元計數器能即時反映輸入長度'\\r\\n  });\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 5: Empty input validation\\r\\n  // ============================================================\\r\\n  await page.fill('#inputText', '');\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const emptyAlert = await page.$('.alert-warning');\\r\\n  await logStep('空白輸入顯示警告', !!emptyAlert, {\\r\\n    behavior: `警告元素存在: ${!!emptyAlert}`,\\r\\n    reason: '驗證空白輸入時會顯示適當的驗證錯誤訊息'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '04-empty-input-warning');\\r\\n  await page.waitForTimeout(3500);\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 6: Whitespace-only input validation\\r\\n  // ============================================================\\r\\n  await page.fill('#inputText', '   \\\\n\\\\n   ');\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const wsAlert = await page.$('.alert-warning');\\r\\n  await logStep('空白字元輸入顯示警告', !!wsAlert, {\\r\\n    behavior: `警告元素存在: ${!!wsAlert}`,\\r\\n    reason: '驗證只有空白字元的輸入也會觸發驗證'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '05-whitespace-warning');\\r\\n  await page.waitForTimeout(3500);\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 7: Special characters escaping\\r\\n  // ============================================================\\r\\n  const specialInput = 'Price is $5.00 and use #channel for info [see docs]';\\r\\n  await page.fill('#inputText', specialInput);\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const specialOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const hasEscaping = specialOutput.includes('\\\\\\\\#') || specialOutput.includes('\\\\\\\\[') || specialOutput.includes('\\\\\\\\.');\\r\\n  await logStep('特殊字元正確轉義', hasEscaping, {\\r\\n    behavior: `輸出: \\\"${specialOutput}\\\"`,\\r\\n    reason: '驗證純文字轉換時會適當轉義 Markdown 特殊字元'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '06-special-chars-escaped');\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 8: HTML to Markdown conversion (core fix test)\\r\\n  // ============================================================\\r\\n  await page.fill('#inputText', '');\\r\\n  await page.evaluate(() => { window.UIController._lastPasteData = null; });\\r\\n\\r\\n  const htmlContent = '<h1>Hello World</h1><p>This is a <strong>bold</strong> paragraph with a <a href=\\\"https://example.com\\\">link</a>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';\\r\\n\\r\\n  await page.evaluate((html) => {\\r\\n    window.UIController._lastPasteData = { type: 'html', data: html };\\r\\n    document.getElementById('inputText').value = 'Hello World - This is bold with a link.';\\r\\n  }, htmlContent);\\r\\n\\r\\n  // Ensure MarkdownConverter is initialized\\r\\n  await page.evaluate(() => {\\r\\n    if (window.MarkdownConverter && window.MarkdownConverter.init) {\\r\\n      window.MarkdownConverter.init();\\r\\n    }\\r\\n  });\\r\\n\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const htmlOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const hasHeading = htmlOutput.includes('# Hello World');\\r\\n  const hasBold = htmlOutput.includes('**bold**');\\r\\n  const hasLink = htmlOutput.includes('[link](https://example.com)');\\r\\n  const hasList = htmlOutput.includes('Item 1') && htmlOutput.includes('Item 2');\\r\\n  await logStep('HTML 轉換 Markdown (Turndown 修正驗證)', hasHeading && hasBold && hasLink, {\\r\\n    behavior: `heading: ${hasHeading}, bold: ${hasBold}, link: ${hasLink}, list: ${hasList}`,\\r\\n    reason: '驗證 HTML 內容能正確轉換為 Markdown（此為 domino 修正後的核心驗證）'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '07-html-to-markdown');\\r\\n\\r\\n  // Clear paste data for subsequent tests\\r\\n  await page.evaluate(() => { window.UIController._lastPasteData = null; });\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 9: HTML table conversion (GFM plugin)\\r\\n  // ============================================================\\r\\n  const tableHtml = '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr><tr><td>Bob</td><td>25</td></tr></tbody></table>';\\r\\n  await page.evaluate((html) => {\\r\\n    window.UIController._lastPasteData = { type: 'html', data: html };\\r\\n    document.getElementById('inputText').value = 'Name | Age\\\\nAlice | 30\\\\nBob | 25';\\r\\n  }, tableHtml);\\r\\n\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const tableOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const hasTable = tableOutput.includes('|') && tableOutput.includes('Name') && tableOutput.includes('Alice');\\r\\n  await logStep('HTML 表格轉換 Markdown (GFM)', hasTable, {\\r\\n    behavior: `輸出: \\\"${tableOutput.substring(0, 120)}\\\"`,\\r\\n    reason: '驗證 GFM plugin 能正確將 HTML 表格轉為 Markdown 表格語法'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '08-table-conversion');\\r\\n  await page.evaluate(() => { window.UIController._lastPasteData = null; });\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 10: Copy button - empty output warning\\r\\n  // ============================================================\\r\\n  await page.fill('#inputText', '');\\r\\n  await page.$eval('#outputText', el => { el.value = ''; });\\r\\n  await page.click('#copyBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const copyWarning = await page.$('.alert-warning');\\r\\n  await logStep('空白輸出複製顯示警告', !!copyWarning, {\\r\\n    behavior: `警告元素存在: ${!!copyWarning}`,\\r\\n    reason: '驗證沒有輸出時複製按鈕會顯示適當警告'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '09-copy-empty-warning');\\r\\n  await page.waitForTimeout(3500);\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 11: Copy button - success\\r\\n  // ============================================================\\r\\n  await page.fill('#inputText', 'Test copy content');\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: TARGET_URL });\\r\\n  await page.click('#copyBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const copySuccess = await page.$('.alert-success');\\r\\n  await logStep('複製成功提示', !!copySuccess, {\\r\\n    behavior: `成功提示存在: ${!!copySuccess}`,\\r\\n    reason: '驗證複製按鈕能正常運作並顯示成功訊息'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '10-copy-success');\\r\\n  await page.waitForTimeout(3500);\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 12: Mermaid diagram detection\\r\\n  // ============================================================\\r\\n  const mermaidInput = `graph TD\\r\\n    A[Start] --> B{Decision}\\r\\n    B -->|Yes| C[OK]\\r\\n    B -->|No| D[End]`;\\r\\n\\r\\n  await page.fill('#inputText', mermaidInput);\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const mermaidOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const hasMermaidFence = mermaidOutput.includes('```mermaid');\\r\\n  await logStep('Mermaid 語法偵測與包裝', hasMermaidFence, {\\r\\n    behavior: `包含 \\\\`\\\\`\\\\`mermaid: ${hasMermaidFence}`,\\r\\n    reason: '驗證 Mermaid 圖表語法能被偵測並自動包裝在 code fence 中'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '11-mermaid-detected');\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 13: Already-Markdown passthrough\\r\\n  // ============================================================\\r\\n  const alreadyMdInput = `# Heading\\r\\n\\r\\nThis is a paragraph with **bold** text.\\r\\n\\r\\n- List item 1\\r\\n- List item 2\\r\\n\\r\\n[Link](https://example.com)`;\\r\\n\\r\\n  await page.fill('#inputText', alreadyMdInput);\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const alreadyMdOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const passthrough = alreadyMdOutput.includes('# Heading') && alreadyMdOutput.includes('**bold**');\\r\\n  await logStep('已有 Markdown 格式偵測 (原樣輸出)', passthrough, {\\r\\n    behavior: `保留 heading: ${alreadyMdOutput.includes('# Heading')}, 保留 bold: ${alreadyMdOutput.includes('**bold**')}`,\\r\\n    reason: '驗證已經是 Markdown 格式的輸入會原樣輸出，不會重複轉義'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '12-already-markdown');\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 14: Unicode bullet normalization\\r\\n  // ============================================================\\r\\n  const bulletInput = `• First item\\r\\n• Second item\\r\\n‧ Third item`;\\r\\n\\r\\n  await page.fill('#inputText', bulletInput);\\r\\n  await page.click('#convertBtn');\\r\\n  await page.waitForTimeout(500);\\r\\n\\r\\n  const bulletOutput = await page.$eval('#outputText', el => el.value);\\r\\n  const normalized = bulletOutput.includes('- First item') && bulletOutput.includes('- Third item');\\r\\n  await logStep('項目符號正規化為 Markdown 列表', normalized, {\\r\\n    behavior: `輸出: \\\"${bulletOutput}\\\"`,\\r\\n    reason: '驗證 Unicode 項目符號 (•, ‧) 能正確轉換為 Markdown 列表語法 (-)'\\r\\n  });\\r\\n  await helpers.takeScreenshot(page, '13-bullet-normalization');\\r\\n\\r\\n  // ============================================================\\r\\n  // Test 15: Convert button text and styling\\r\\n  // ============================================================\\r\\n  const btnText = await page.$eval('#convertBtn', el => el.textContent.trim());\\r\\n  const btnClass = await page.$eval('#convertBtn', el => el.classList.contains('btn-primary'));\\r\\n  await logStep('轉換按鈕文字與樣式正確', btnText === 'Convert to Markdown' && btnClass, {\\r\\n    behavior: `按鈕文字: \\\"${btnText}\\\", btn-primary: ${btnClass}`,\\r\\n    reason: '驗證轉換按鈕的顯示文字和視覺樣式符合設計'\\r\\n  });\\r\\n\\r\\n  // ============================================================\\r\\n  // Final screenshot\\r\\n  // ============================================================\\r\\n  await helpers.takeScreenshot(page, '14-test-complete');\\r\\n\\r\\n  console.log('\\\\n========================================');\\r\\n  console.log(`📊 測試總結: ${stats.passed} 通過 / ${stats.failed} 失敗 / ${stats.total} 總計`);\\r\\n  console.log('========================================');\\r\\n\\r\\n} catch (err) {\\r\\n  await helpers.takeScreenshot(page, 'error-state');\\r\\n  throw err;\\r\\n} finally {\\r\\n  await browser.close();\\r\\n}\\r\\n\"");

  try {
    // 監聽 response 以取得最後的狀態碼
    const setupPageContext = (page) => {
      page.on('response', response => {
        if (response.url() === page.url()) {
          pageContext.statusCode = response.status();
        }
      });
    };

    const execute = async () => {
      // 在 code 執行前注入 context 追蹤
      const TARGET_URL = 'http://localhost:5000';

const browser = await helpers.launchBrowser();
const context = await helpers.createContext(browser);
const page = await helpers.createPage(context);

try {
  // ============================================================
  // Test 1: Page load and UI elements verification
  // ============================================================
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await page.waitForLoadState('domcontentloaded');
  await helpers.takeScreenshot(page, '01-page-loaded');

  const title = await page.title();
  await logStep('頁面載入成功', title.includes('Text to Markdown'), {
    behavior: `頁面標題: "${title}"`,
    reason: '驗證應用程式能正常啟動並載入'
  });

  // Check all critical UI elements exist
  const elements = await page.evaluate(() => ({
    inputText: !!document.getElementById('inputText'),
    outputText: !!document.getElementById('outputText'),
    convertBtn: !!document.getElementById('convertBtn'),
    copyBtn: !!document.getElementById('copyBtn'),
    charCount: !!document.getElementById('charCount'),
    outputReadonly: document.getElementById('outputText')?.hasAttribute('readonly')
  }));

  await logStep('所有 UI 元素存在', Object.values(elements).every(Boolean), {
    behavior: JSON.stringify(elements),
    reason: '驗證頁面所有必要的互動元素已正確渲染且 output 為唯讀'
  });

  // ============================================================
  // Test 2: TurndownService loaded (fix verification)
  // ============================================================
  const turndownLoaded = await page.evaluate(() => typeof TurndownService !== 'undefined');
  await logStep('TurndownService 載入成功 (domino 修正驗證)', turndownLoaded, {
    behavior: `TurndownService available: ${turndownLoaded}`,
    reason: '驗證 turndown.js 修正後能在瀏覽器中正確初始化'
  });

  // ============================================================
  // Test 3: Plain text conversion
  // ============================================================
  const plainTextInput = `This is a heading
- Item one
- Item two
- Item three

This is a normal paragraph.`;

  await page.fill('#inputText', plainTextInput);
  await helpers.takeScreenshot(page, '02-plain-text-input');
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const plainTextOutput = await page.$eval('#outputText', el => el.value);
  const hasListOutput = plainTextOutput.includes('- Item one');
  await logStep('純文字轉換 Markdown', plainTextOutput.length > 0 && hasListOutput, {
    behavior: `輸出長度: ${plainTextOutput.length}, 包含列表: ${hasListOutput}`,
    reason: '驗證純文字能正確轉換為 Markdown 格式'
  });
  await helpers.takeScreenshot(page, '03-plain-text-output');

  // ============================================================
  // Test 4: Character count updates
  // ============================================================
  const charCountText = await page.$eval('#charCount', el => el.textContent);
  const expectedLen = [...plainTextInput].length;
  await logStep('字元計數正確更新', charCountText.includes(expectedLen.toString()), {
    behavior: `顯示: "${charCountText}", 預期包含: ${expectedLen}`,
    reason: '驗證字元計數器能即時反映輸入長度'
  });

  // ============================================================
  // Test 5: Empty input validation
  // ============================================================
  await page.fill('#inputText', '');
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const emptyAlert = await page.$('.alert-warning');
  await logStep('空白輸入顯示警告', !!emptyAlert, {
    behavior: `警告元素存在: ${!!emptyAlert}`,
    reason: '驗證空白輸入時會顯示適當的驗證錯誤訊息'
  });
  await helpers.takeScreenshot(page, '04-empty-input-warning');
  await page.waitForTimeout(3500);

  // ============================================================
  // Test 6: Whitespace-only input validation
  // ============================================================
  await page.fill('#inputText', '   \n\n   ');
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const wsAlert = await page.$('.alert-warning');
  await logStep('空白字元輸入顯示警告', !!wsAlert, {
    behavior: `警告元素存在: ${!!wsAlert}`,
    reason: '驗證只有空白字元的輸入也會觸發驗證'
  });
  await helpers.takeScreenshot(page, '05-whitespace-warning');
  await page.waitForTimeout(3500);

  // ============================================================
  // Test 7: Special characters escaping
  // ============================================================
  const specialInput = 'Price is $5.00 and use #channel for info [see docs]';
  await page.fill('#inputText', specialInput);
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const specialOutput = await page.$eval('#outputText', el => el.value);
  const hasEscaping = specialOutput.includes('\\#') || specialOutput.includes('\\[') || specialOutput.includes('\\.');
  await logStep('特殊字元正確轉義', hasEscaping, {
    behavior: `輸出: "${specialOutput}"`,
    reason: '驗證純文字轉換時會適當轉義 Markdown 特殊字元'
  });
  await helpers.takeScreenshot(page, '06-special-chars-escaped');

  // ============================================================
  // Test 8: HTML to Markdown conversion (core fix test)
  // ============================================================
  await page.fill('#inputText', '');
  await page.evaluate(() => { window.UIController._lastPasteData = null; });

  const htmlContent = '<h1>Hello World</h1><p>This is a <strong>bold</strong> paragraph with a <a href="https://example.com">link</a>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';

  await page.evaluate((html) => {
    window.UIController._lastPasteData = { type: 'html', data: html };
    document.getElementById('inputText').value = 'Hello World - This is bold with a link.';
  }, htmlContent);

  // Ensure MarkdownConverter is initialized
  await page.evaluate(() => {
    if (window.MarkdownConverter && window.MarkdownConverter.init) {
      window.MarkdownConverter.init();
    }
  });

  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const htmlOutput = await page.$eval('#outputText', el => el.value);
  const hasHeading = htmlOutput.includes('# Hello World');
  const hasBold = htmlOutput.includes('**bold**');
  const hasLink = htmlOutput.includes('[link](https://example.com)');
  const hasList = htmlOutput.includes('Item 1') && htmlOutput.includes('Item 2');
  await logStep('HTML 轉換 Markdown (Turndown 修正驗證)', hasHeading && hasBold && hasLink, {
    behavior: `heading: ${hasHeading}, bold: ${hasBold}, link: ${hasLink}, list: ${hasList}`,
    reason: '驗證 HTML 內容能正確轉換為 Markdown（此為 domino 修正後的核心驗證）'
  });
  await helpers.takeScreenshot(page, '07-html-to-markdown');

  // Clear paste data for subsequent tests
  await page.evaluate(() => { window.UIController._lastPasteData = null; });

  // ============================================================
  // Test 9: HTML table conversion (GFM plugin)
  // ============================================================
  const tableHtml = '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr><tr><td>Bob</td><td>25</td></tr></tbody></table>';
  await page.evaluate((html) => {
    window.UIController._lastPasteData = { type: 'html', data: html };
    document.getElementById('inputText').value = 'Name | Age\nAlice | 30\nBob | 25';
  }, tableHtml);

  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const tableOutput = await page.$eval('#outputText', el => el.value);
  const hasTable = tableOutput.includes('|') && tableOutput.includes('Name') && tableOutput.includes('Alice');
  await logStep('HTML 表格轉換 Markdown (GFM)', hasTable, {
    behavior: `輸出: "${tableOutput.substring(0, 120)}"`,
    reason: '驗證 GFM plugin 能正確將 HTML 表格轉為 Markdown 表格語法'
  });
  await helpers.takeScreenshot(page, '08-table-conversion');
  await page.evaluate(() => { window.UIController._lastPasteData = null; });

  // ============================================================
  // Test 10: Copy button - empty output warning
  // ============================================================
  await page.fill('#inputText', '');
  await page.$eval('#outputText', el => { el.value = ''; });
  await page.click('#copyBtn');
  await page.waitForTimeout(500);

  const copyWarning = await page.$('.alert-warning');
  await logStep('空白輸出複製顯示警告', !!copyWarning, {
    behavior: `警告元素存在: ${!!copyWarning}`,
    reason: '驗證沒有輸出時複製按鈕會顯示適當警告'
  });
  await helpers.takeScreenshot(page, '09-copy-empty-warning');
  await page.waitForTimeout(3500);

  // ============================================================
  // Test 11: Copy button - success
  // ============================================================
  await page.fill('#inputText', 'Test copy content');
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: TARGET_URL });
  await page.click('#copyBtn');
  await page.waitForTimeout(500);

  const copySuccess = await page.$('.alert-success');
  await logStep('複製成功提示', !!copySuccess, {
    behavior: `成功提示存在: ${!!copySuccess}`,
    reason: '驗證複製按鈕能正常運作並顯示成功訊息'
  });
  await helpers.takeScreenshot(page, '10-copy-success');
  await page.waitForTimeout(3500);

  // ============================================================
  // Test 12: Mermaid diagram detection
  // ============================================================
  const mermaidInput = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]`;

  await page.fill('#inputText', mermaidInput);
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const mermaidOutput = await page.$eval('#outputText', el => el.value);
  const hasMermaidFence = mermaidOutput.includes('```mermaid');
  await logStep('Mermaid 語法偵測與包裝', hasMermaidFence, {
    behavior: `包含 \`\`\`mermaid: ${hasMermaidFence}`,
    reason: '驗證 Mermaid 圖表語法能被偵測並自動包裝在 code fence 中'
  });
  await helpers.takeScreenshot(page, '11-mermaid-detected');

  // ============================================================
  // Test 13: Already-Markdown passthrough
  // ============================================================
  const alreadyMdInput = `# Heading

This is a paragraph with **bold** text.

- List item 1
- List item 2

[Link](https://example.com)`;

  await page.fill('#inputText', alreadyMdInput);
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const alreadyMdOutput = await page.$eval('#outputText', el => el.value);
  const passthrough = alreadyMdOutput.includes('# Heading') && alreadyMdOutput.includes('**bold**');
  await logStep('已有 Markdown 格式偵測 (原樣輸出)', passthrough, {
    behavior: `保留 heading: ${alreadyMdOutput.includes('# Heading')}, 保留 bold: ${alreadyMdOutput.includes('**bold**')}`,
    reason: '驗證已經是 Markdown 格式的輸入會原樣輸出，不會重複轉義'
  });
  await helpers.takeScreenshot(page, '12-already-markdown');

  // ============================================================
  // Test 14: Unicode bullet normalization
  // ============================================================
  const bulletInput = `• First item
• Second item
‧ Third item`;

  await page.fill('#inputText', bulletInput);
  await page.click('#convertBtn');
  await page.waitForTimeout(500);

  const bulletOutput = await page.$eval('#outputText', el => el.value);
  const normalized = bulletOutput.includes('- First item') && bulletOutput.includes('- Third item');
  await logStep('項目符號正規化為 Markdown 列表', normalized, {
    behavior: `輸出: "${bulletOutput}"`,
    reason: '驗證 Unicode 項目符號 (•, ‧) 能正確轉換為 Markdown 列表語法 (-)'
  });
  await helpers.takeScreenshot(page, '13-bullet-normalization');

  // ============================================================
  // Test 15: Convert button text and styling
  // ============================================================
  const btnText = await page.$eval('#convertBtn', el => el.textContent.trim());
  const btnClass = await page.$eval('#convertBtn', el => el.classList.contains('btn-primary'));
  await logStep('轉換按鈕文字與樣式正確', btnText === 'Convert to Markdown' && btnClass, {
    behavior: `按鈕文字: "${btnText}", btn-primary: ${btnClass}`,
    reason: '驗證轉換按鈕的顯示文字和視覺樣式符合設計'
  });

  // ============================================================
  // Final screenshot
  // ============================================================
  await helpers.takeScreenshot(page, '14-test-complete');

  console.log('\n========================================');
  console.log(`📊 測試總結: ${stats.passed} 通過 / ${stats.failed} 失敗 / ${stats.total} 總計`);
  console.log('========================================');

} catch (err) {
  await helpers.takeScreenshot(page, 'error-state');
  throw err;
} finally {
  await browser.close();
}

    };
    await execute();
  } catch (err) {
    status = '失敗';
    
    // 取得最後一個日誌步驟
    const lastStep = executionLogs.filter(log => log.includes('[步驟') || log.includes('🚀')).pop() || '程式執行初期';
    
    // 分析錯誤類型與責任歸屬
    let errorType = '邏輯或執行錯誤';
    let suggestion = '檢查程式碼邏輯是否正確。';
    let attribution = '測試腳本錯誤 (Script Error)';
    let sourceCode = '無法取得源碼資訊';

    // 嘗試從 stack trace 擷取行號與原始碼片段
    if (err.stack) {
      const tempFileMatch = err.stack.match(/.temp-execution-[d]+.js:(d+):(d+)/);
      if (tempFileMatch) {
        const lineNum = parseInt(tempFileMatch[1]);
        const tempFilePath = path.join(SKILL_DIR, err.stack.match(/.temp-execution-[d]+.js/)[0]);
        if (fs.existsSync(tempFilePath)) {
          const content = fs.readFileSync(tempFilePath, 'utf8').split('\n');
          const start = Math.max(0, lineNum - 3);
          const end = Math.min(content.length, lineNum + 2);
          sourceCode = content.slice(start, end).map((line, idx) => {
            const currentLine = start + idx + 1;
            return currentLine + ': ' + line + (currentLine === lineNum ? ' <--- 錯誤發生在此處' : '');
          }).join('\n');
        }
      }
    }
    
    const msg = err.message.toLowerCase();
    
    if (msg.includes('timeout')) {
      errorType = '逾時錯誤 (Timeout)';
      if (msg.includes('navigation') || pageContext.statusCode >= 500) {
        attribution = '網站伺服器異常 (Site Server Error)';
        suggestion = '網站回應過慢或伺服器崩潰。請檢查網站後端狀態。';
      } else if (msg.includes('waiting for selector') || msg.includes('waiting for locator')) {
        attribution = '網站內容未如期出現 (Site Content Missing)';
        suggestion = '腳本在等元件，但網站沒把它生出來。可能是功能壞了，或 UI 流程變了。';
      } else {
        attribution = '測試腳本等待邏輯不足 (Script Wait Logic Error)';
        suggestion = '建議優化等待邏輯，或增加 timeout 容錯時間。';
      }
    } else if (msg.includes('selector') || msg.includes('locator')) {
      errorType = '選擇器失效 (Selector Error)';
      attribution = '網站 UI 變更 (Site UI Changed)';
      suggestion = '網站可能改版了，導致原本的 ID 或 Class 消失。請重新檢查頁面結構。';
    } else if (msg.includes('is not a function')) {
      errorType = '腳本語法錯誤 (Script Syntax Error)';
      attribution = '開發者撰寫錯誤 (Script Code Error)';
      suggestion = '腳本呼叫了不存在的 API。這 100% 是測試代碼的問題，請修正程式碼。';
    } else if (msg.includes('detached') || msg.includes('visibility')) {
      errorType = '競爭條件 (Race Condition)';
      attribution = '網站前端行為不穩定 (Site Flaky UI)';
      suggestion = '網站元件閃現或被遮擋。建議增加頁面穩定性的檢查點。';
    } else if (pageContext.statusCode >= 400) {
       errorType = 'HTTP ' + pageContext.statusCode + ' 錯誤';
       attribution = '網站環境/權限問題 (Site Environment Error)';
       suggestion = '網站本身回傳錯誤。請確認網址正確且權限正常。';
     }
    
    errorAnalysis = {
      lastStep: lastStep,
      type: errorType,
      attribution: attribution,
      message: err.message,
      suggestion: suggestion,
      sourceCode: sourceCode,
      context: pageContext
    };

    console.error('\n❌ 自動化錯誤：' + err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2) + ' 秒';
    
    // 從環境變數中取得 AI 總結說明（如果有）
    const aiInsight = process.env.PW_AI_INSIGHT || '';
    
    await helpers.generateHtmlReport({
      logs: global.executionLogs || [],
      status: status,
      duration: duration,
      aiInsight: aiInsight,
      errorAnalysis: errorAnalysis,
      testPlan: testPlan,
      stats: stats,
      testCode: rawTestCode
    });
  }
})();
