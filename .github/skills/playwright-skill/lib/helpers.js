// playwright-helpers.js
// Playwright 自動化重複使用的工具函式

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 從環境變數解析額外的 HTTP 標頭。
 * 支援兩種格式：
 * - PW_HEADER_NAME + PW_HEADER_VALUE：單個標頭（簡單且常見的情況）
 * - PW_EXTRA_HEADERS：多個標頭的 JSON 物件（進階）
 * 若兩者皆設定，則以單個標頭格式優先。
 * @returns {Object|null} 標頭物件，若未設定則為 null
 */
function getExtraHeadersFromEnv() {
  const headerName = process.env.PW_HEADER_NAME;
  const headerValue = process.env.PW_HEADER_VALUE;

  if (headerName && headerValue) {
    return { [headerName]: headerValue };
  }

  const headersJson = process.env.PW_EXTRA_HEADERS;
  if (headersJson) {
    try {
      const parsed = JSON.parse(headersJson);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      console.warn('PW_EXTRA_HEADERS 必須是 JSON 物件，忽略中...');
    } catch (e) {
      console.warn('無法將 PW_EXTRA_HEADERS 解析為 JSON：', e.message);
    }
  }

  return null;
}

/**
 * 使用標準配置啟動瀏覽器
 * @param {string} browserType - 'chromium', 'firefox', 或 'webkit'
 * @param {Object} options - 額外的啟動選項
 */
async function launchBrowser(browserType = 'chromium', options = {}) {
  const defaultOptions = {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  
  const browsers = { chromium, firefox, webkit };
  const browser = browsers[browserType];
  
  if (!browser) {
    throw new Error(`無效的瀏覽器類型：${browserType}`);
  }
  
  return await browser.launch({ ...defaultOptions, ...options });
}

/**
 * 建立具有視口與使用者代理的新頁面
 * @param {Object} context - 瀏覽器上下文
 * @param {Object} options - 頁面選項
 */
async function createPage(context, options = {}) {
  const page = await context.newPage();
  
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  
  if (options.userAgent) {
    await page.setExtraHTTPHeaders({
      'User-Agent': options.userAgent
    });
  }
  
  // 設定預設逾時
  page.setDefaultTimeout(options.timeout || 30000);
  
  return page;
}

/**
 * 智慧等待頁面就緒
 * @param {Object} page - Playwright 頁面
 * @param {Object} options - 等待選項
 */
async function waitForPageReady(page, options = {}) {
  const waitOptions = {
    waitUntil: options.waitUntil || 'networkidle',
    timeout: options.timeout || 30000
  };
  
  try {
    await page.waitForLoadState(waitOptions.waitUntil, { 
      timeout: waitOptions.timeout 
    });
  } catch (e) {
    console.warn('頁面載入逾時，繼續執行...');
  }
  
  // 若提供選擇器，則額外等待動態內容
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { 
      timeout: options.timeout 
    });
  }
}

/**
 * 具有重試邏輯的安全點擊
 * @param {Object} page - Playwright 頁面
 * @param {string} selector - 元件選擇器
 * @param {Object} options - 點擊選項
 */
async function safeClick(page, selector, options = {}) {
  const maxRetries = options.retries || 3;
  const retryDelay = options.retryDelay || 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { 
        state: 'visible',
        timeout: options.timeout || 5000 
      });
      await page.click(selector, {
        force: options.force || false,
        timeout: options.timeout || 5000
      });
      return true;
    } catch (e) {
      if (i === maxRetries - 1) {
        console.error(`在 ${maxRetries} 次嘗試後仍無法點擊 ${selector}`);
        throw e;
      }
      console.log(`正在重試點擊 ${selector} (${i + 1}/${maxRetries})`);
      await page.waitForTimeout(retryDelay);
    }
  }
}

/**
 * 安全的文字輸入，在輸入前先清除內容
 * @param {Object} page - Playwright 頁面
 * @param {string} selector - 輸入框選擇器
 * @param {string} text - 要輸入的文字
 * @param {Object} options - 輸入選項
 */
async function safeType(page, selector, text, options = {}) {
  await page.waitForSelector(selector, { 
    state: 'visible',
    timeout: options.timeout || 10000 
  });
  
  if (options.clear !== false) {
    await page.fill(selector, '');
  }
  
  if (options.slow) {
    await page.type(selector, text, { delay: options.delay || 100 });
  } else {
    await page.fill(selector, text);
  }
}

/**
 * 從多個元件提取文字
 * @param {Object} page - Playwright 頁面
 * @param {string} selector - 元件選擇器
 */
async function extractTexts(page, selector) {
  await page.waitForSelector(selector, { timeout: 10000 });
  return await page.$$eval(selector, elements => 
    elements.map(el => el.textContent?.trim()).filter(Boolean)
  );
}

/**
 * 帶有時間戳記的截圖
 * @param {Object} page - Playwright 頁面
 * @param {string} name - 截圖名稱
 * @param {Object} options - 截圖選項
 */
async function takeScreenshot(page, name, options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseDir = process.env.PW_REPORT_DIR || path.join(process.cwd(), 'playwright-report-media');
  const reportDir = path.join(baseDir, 'screenshots');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `${name}-${timestamp}.png`;
  const filePath = path.join(reportDir, filename);
  
  await page.screenshot({
    path: filePath,
    fullPage: options.fullPage !== false,
    ...options
  });
  
  console.log(`截圖已儲存：${filePath}`);
  return filePath;
}

/**
 * 處理身份驗證
 * @param {Object} page - Playwright 頁面
 * @param {Object} credentials - 使用者名稱與密碼
 * @param {Object} selectors - 登入表單選擇器
 */
async function authenticate(page, credentials, selectors = {}) {
  const defaultSelectors = {
    username: 'input[name="username"], input[name="email"], #username, #email',
    password: 'input[name="password"], #password',
    submit: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("登入")'
  };
  
  const finalSelectors = { ...defaultSelectors, ...selectors };
  
  await safeType(page, finalSelectors.username, credentials.username);
  await safeType(page, finalSelectors.password, credentials.password);
  await safeClick(page, finalSelectors.submit);
  
  // 等待導航或成功指示器
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.waitForSelector(selectors.successIndicator || '.dashboard, .user-menu, .logout, .user-profile', { timeout: 10000 })
  ]).catch(() => {
    console.log('登入可能已完成但未觸發導航');
  });
}

/**
 * 捲動頁面
 * @param {Object} page - Playwright 頁面
 * @param {string} direction - 'down', 'up', 'top', 'bottom'
 * @param {number} distance - 捲動像素（用於 up/down）
 */
async function scrollPage(page, direction = 'down', distance = 500) {
  switch (direction) {
    case 'down':
      await page.evaluate(d => window.scrollBy(0, d), distance);
      break;
    case 'up':
      await page.evaluate(d => window.scrollBy(0, -d), distance);
      break;
    case 'top':
      await page.evaluate(() => window.scrollTo(0, 0));
      break;
    case 'bottom':
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      break;
  }
  await page.waitForTimeout(500); // 等待捲動動畫
}

/**
 * 提取表格資料
 * @param {Object} page - Playwright 頁面
 * @param {string} tableSelector - 表格選擇器
 */
async function extractTableData(page, tableSelector) {
  await page.waitForSelector(tableSelector);
  
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return null;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => 
      th.textContent?.trim()
    );
    
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (headers.length > 0) {
        return cells.reduce((obj, cell, index) => {
          obj[headers[index] || `column_${index}`] = cell.textContent?.trim();
          return obj;
        }, {});
      } else {
        return cells.map(cell => cell.textContent?.trim());
      }
    });
    
    return { headers, rows };
  }, tableSelector);
}

/**
 * 等待並關閉 Cookie 橫幅
 * @param {Object} page - Playwright 頁面
 * @param {number} timeout - 最大等待時間
 */
async function handleCookieBanner(page, timeout = 3000) {
  const commonSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("I agree")',
    'button:has-text("接受")',
    'button:has-text("同意")',
    '.cookie-accept',
    '#cookie-accept',
    '[data-testid="cookie-accept"]'
  ];
  
  for (const selector of commonSelectors) {
    try {
      const element = await page.waitForSelector(selector, { 
        timeout: timeout / commonSelectors.length,
        state: 'visible'
      });
      if (element) {
        await element.click();
        console.log('Cookie 橫幅已關閉');
        return true;
      }
    } catch (e) {
      // 繼續嘗試下一個選擇器
    }
  }
  
  return false;
}

/**
 * 使用指數退避演算法重試函式
 * @param {Function} fn - 要重試的函式
 * @param {number} maxRetries - 最大重試次數
 * @param {number} initialDelay - 初始延遲（毫秒）
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`第 ${i + 1} 次嘗試失敗，將於 ${delay} 毫秒後重試...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * 建立具有常用設定的瀏覽器上下文
 * @param {Object} browser - 瀏覽器執行個體
 * @param {Object} options - 上下文選項
 */
async function createContext(browser, options = {}) {
  const envHeaders = getExtraHeadersFromEnv();

  // 將環境變數中的標頭與傳入的選項合併
  const mergedHeaders = {
    ...envHeaders,
    ...options.extraHTTPHeaders
  };

  const reportDir = process.env.PW_REPORT_DIR || path.join(process.cwd(), 'playwright-report-media');

  const defaultOptions = {
    viewport: { width: 1280, height: 720 },
    userAgent: options.mobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      : undefined,
    permissions: options.permissions || [],
    geolocation: options.geolocation,
    locale: options.locale || 'zh-TW',
    timezoneId: options.timezoneId || 'Asia/Taipei',
    recordVideo: options.recordVideo || {
      dir: path.join(reportDir, 'videos/'),
      size: { width: 1280, height: 720 }
    },
    // 僅在有標頭時才包含 extraHTTPHeaders
    ...(Object.keys(mergedHeaders).length > 0 && { extraHTTPHeaders: mergedHeaders })
  };

  return await browser.newContext({ ...defaultOptions, ...options });
}

/**
 * 在常用連接埠上偵測執行中的開發伺服器
 * @param {Array<number>} customPorts - 額外要檢查的連接埠
 * @returns {Promise<Array>} 偵測到的伺服器 URL 陣列
 */
async function detectDevServers(customPorts = []) {
  const http = require('http');

  // 常見的開發伺服器連接埠
  const commonPorts = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234];
  const allPorts = [...new Set([...commonPorts, ...customPorts])];

  const detectedServers = [];

  console.log('🔍 正在檢查執行中的開發伺服器...');

  for (const port of allPorts) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 500
        }, (res) => {
          if (res.statusCode < 500) {
            detectedServers.push(`http://localhost:${port}`);
            console.log(`  ✅ 在連接埠 ${port} 發現伺服器`);
          }
          resolve();
        });

        req.on('error', () => resolve());
        req.on('timeout', () => {
          req.destroy();
          resolve();
        });

        req.end();
      });
    } catch (e) {
      // 連接埠不可用，繼續執行
    }
  }

  if (detectedServers.length === 0) {
    console.log('  ❌ 未偵測到開發伺服器');
  }

  return detectedServers;
}

/**
 * 生成精美的 HTML 報告，包含圖片與影片連結
 * @param {Object} summary - 包含文字總結與日誌的物件
 */
async function generateHtmlReport(summary = {}) {
  const reportDir = process.env.PW_REPORT_DIR || path.join(process.cwd(), 'playwright-report-media');
  const screenshotDir = path.join(reportDir, 'screenshots');
  const videoDir = path.join(reportDir, 'videos');
  
  const executionLogs = summary.logs || [];
  const status = summary.status || '未知';
  const duration = summary.duration || 'N/A';
  const aiInsight = summary.aiInsight || '';
  const errorAnalysis = summary.errorAnalysis || null;
  const testPlan = summary.testPlan || null;
  const stats = summary.stats || { passed: 0, failed: 0, total: 0 };
  const testCode = summary.testCode || '';
  
  // 確保目錄存在
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  let screenshots = [];
  if (fs.existsSync(screenshotDir)) {
    screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
  }
  
  let videos = [];
  if (fs.existsSync(videoDir)) {
    videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  }

  // 簡單的 Markdown 格式化處理 (將換行符號轉為 <br>, 粗體轉為 <strong>)
  const formattedAiInsight = aiInsight
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)/gm, '• $1');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright 自動化測試報告</title>
    <!-- Highlight.js 語法高亮 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
    <style>
        body { font-family: "Microsoft JhengHei", sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #f4f7f6; }
        h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h2 { color: #2980b9; border-left: 5px solid #3498db; padding-left: 10px; margin-top: 0; }
        .summary-box { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-item { flex: 1; background: #ebf5fb; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #d6eaf8; }
        .summary-label { font-size: 14px; color: #5dade2; font-weight: bold; display: block; }
        .summary-value { font-size: 18px; color: #2e86c1; font-weight: bold; }
        
        /* 測試計畫區塊 */
        .test-plan { background: #fdfcfe; border: 1px solid #dcdde1; border-left: 6px solid #6c5ce7; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .test-plan-header { font-weight: bold; color: #6c5ce7; margin-bottom: 12px; font-size: 18px; border-bottom: 1px dashed #dcdde1; padding-bottom: 8px; }
        .test-plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .test-plan-item { background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #f1f2f6; }
        .test-plan-label { font-weight: bold; color: #2f3542; margin-bottom: 5px; display: block; font-size: 14px; }
        .test-plan-content { font-size: 13px; white-space: pre-wrap; color: #57606f; }

        .log-container { background: #2d3436; color: #dfe6e9; padding: 15px; border-radius: 8px; font-family: "Consolas", monospace; font-size: 13px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
        .ai-insight { background: #fffdf0; border: 1px solid #ffeaa7; border-left: 6px solid #fdcb6e; padding: 20px; border-radius: 8px; margin-bottom: 25px; color: #2d3436; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .ai-insight-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: #e17055; font-weight: bold; font-size: 18px; border-bottom: 1px dashed #fdcb6e; padding-bottom: 8px; }
        .ai-insight-content { line-height: 1.8; font-size: 15px; }
        .ai-insight-content strong { color: #d63031; }
        .error-analysis { background: #fff5f5; border: 1px solid #feb2b2; border-left: 6px solid #f56565; padding: 20px; border-radius: 8px; margin-bottom: 25px; color: #2d3436; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .error-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: #c53030; font-weight: bold; font-size: 18px; border-bottom: 1px dashed #feb2b2; padding-bottom: 8px; }
        .error-content { line-height: 1.6; font-size: 14px; }
        .error-content b { color: #c53030; }
        .error-attribution { margin: 10px 0; padding: 10px; border-radius: 4px; font-weight: bold; display: inline-block; }
        .attr-site { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; }
        .attr-script { background: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
        .error-code-block { background: #1a202c; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: "Consolas", monospace; font-size: 13px; margin: 10px 0; overflow-x: auto; white-space: pre; }
        .test-code-block { background: #1a202c; border-radius: 8px; margin-top: 15px; border: 1px solid #4a5568; }
        .test-code-header { background: #2d3748; color: #e2e8f0; padding: 8px 15px; font-size: 14px; font-weight: bold; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .error-suggestion { margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px; border: 1px solid #feb2b2; color: #742a2a; font-size: 13px; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .media-item { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff; }
        .media-item img, .media-item video { width: 100%; height: auto; display: block; }
        .media-caption { padding: 10px; font-size: 14px; background: #eee; border-top: 1px solid #ddd; word-break: break-all; }
        .no-data { text-align: center; color: #7f8c8d; font-style: italic; }
        .timestamp { text-align: right; font-size: 12px; color: #95a5a6; }
        .nav-link { display: inline-block; margin-bottom: 10px; color: #3498db; text-decoration: none; font-weight: bold; }
        .nav-link:hover { text-decoration: underline; }
        .status-success { color: #27ae60; }
        .status-error { color: #c0392b; }

        /* 步驟詳情區塊 */
        .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px; }
        .steps-column { background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #dcdde1; }
        .steps-header { font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid; }
        .steps-header.success { color: #27ae60; border-color: #27ae60; }
        .steps-header.error { color: #c0392b; border-color: #c0392b; }
        .step-item { padding: 12px; border-bottom: 1px solid #f1f2f6; font-size: 14px; }
        .step-item:last-child { border-bottom: none; }
        .step-main { display: flex; align-items: center; gap: 8px; font-weight: bold; margin-bottom: 4px; }
        .step-details { padding-left: 24px; font-size: 12px; color: #636e72; line-height: 1.4; }
        .step-detail-row { margin-top: 2px; display: flex; gap: 4px; }
        .step-detail-label { font-weight: bold; color: #2d3436; min-width: 40px; }
    </style>
</head>
<body>
    <a href="../latest-report.html" class="nav-link">← 返回報告列表 / 最新報告</a>
    <h1>🎭 Playwright 自動化測試報告</h1>
    
    <div class="section">
        <h2>總結說明 (Summary)</h2>
        ${testPlan ? `
        <div class="test-plan">
            <div class="test-plan-header">📋 測試計畫詳情 (Test Plan)</div>
            <div class="test-plan-grid">
                <div class="test-plan-item">
                    <span class="test-plan-label">🎯 測試目的 (Purpose)</span>
                    <div class="test-plan-content">${testPlan.purpose || '未定義'}</div>
                </div>
                <div class="test-plan-item">
                    <span class="test-plan-label">🛤️ 測試流程 (Workflow)</span>
                    <div class="test-plan-content">${testPlan.workflow || '未定義'}</div>
                </div>
                <div class="test-plan-item">
                    <span class="test-plan-label">⚙️ 測試行為 (Behaviors)</span>
                    <div class="test-plan-content">${testPlan.behaviors || '未定義'}</div>
                </div>
            </div>
        </div>
        ` : ''}
        ${errorAnalysis ? `
        <div class="error-analysis">
            <div class="error-header">🔍 測試失敗原因探究 (Failure Root Cause Analysis)</div>
            <div class="error-content">
                <div class="error-attribution ${errorAnalysis.attribution.includes('Site') || errorAnalysis.attribution.includes('網站') ? 'attr-site' : 'attr-script'}">
                    🚩 責任歸屬：${errorAnalysis.attribution}
                </div>
                <p><b>📍 錯誤位置：</b>${errorAnalysis.lastStep || '未知步驟'}</p>
                <p><b>⚠️ 錯誤類型：</b>${errorAnalysis.type}</p>
                
                ${errorAnalysis.sourceCode ? `
                <p><b>💻 出錯程式碼片段：</b></p>
                <div class="error-code-block"><pre><code class="language-javascript">${errorAnalysis.sourceCode}</code></pre></div>
                ` : ''}

                ${errorAnalysis.context ? `
                <div class="summary-box" style="background: #fff; margin-top: 10px; border: 1px solid #feb2b2;">
                    <div class="summary-item">
                        <div class="summary-label">出錯時 URL</div>
                        <div class="summary-value" style="font-size: 12px;">${errorAnalysis.context.url}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">HTTP 狀態碼</div>
                        <div class="summary-value" style="color: ${errorAnalysis.context.statusCode >= 400 ? '#e17055' : '#2ecc71'}">
                            ${errorAnalysis.context.statusCode}
                        </div>
                    </div>
                </div>
                ` : ''}

                <p><b>📝 詳細訊息：</b>${errorAnalysis.message}</p>
                <div class="error-suggestion">
                    <b>💡 修復建議：</b><br>
                    ${errorAnalysis.suggestion}
                </div>
            </div>
        </div>` : ''}
        ${aiInsight ? `
        <div class="ai-insight">
            <div class="ai-insight-header">🤖 AI 測試深度分析與資源 (AI Insight & Resources)</div>
            <div class="ai-insight-content">
                ${formattedAiInsight}
                
                ${(screenshots.length > 0 || videos.length > 0) ? `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #fdcb6e; font-size: 13px; color: #636e72;">
                    <strong>📦 本次測試產出的媒體資源：</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${screenshots.map(s => `<li>🖼️ 截圖: <a href="screenshots/${s}" target="_blank" style="color: #636e72;">${s}</a></li>`).join('')}
                        ${videos.map(v => `<li>🎥 影片: <a href="videos/${v}" target="_blank" style="color: #636e72;">${v}</a></li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>` : ''}
        <div class="summary-box">
            <div class="summary-item">
                <span class="summary-label">執行狀態</span>
                <span class="summary-value ${status === '成功' ? 'status-success' : 'status-error'}">${status}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">執行耗時</span>
                <span class="summary-value">${duration}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">多步驟統計</span>
                <span class="summary-value">
                    <span class="status-success">${stats.passed} 過測</span> / 
                    <span class="status-error">${stats.failed} 失敗</span> (共 ${stats.total} 步)
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">媒體檔案</span>
                <span class="summary-value">${screenshots.length} 截圖 / ${videos.length} 影片</span>
            </div>
        </div>

        ${testCode ? `
        <div class="test-code-block">
            <div class="test-code-header">
                <span>💻 本次執行測試程式碼 (Test Code)</span>
                <span style="font-weight: normal; font-size: 12px; color: #a0aec0;">JavaScript / Playwright</span>
            </div>
            <pre style="margin: 0; padding: 15px; overflow-x: auto;"><code class="language-javascript">${testCode}</code></pre>
        </div>
        ` : ''}

        <div class="steps-grid">
            <div class="steps-column">
                <div class="steps-header success">✅ 已過測步驟 (${stats.passed})</div>
                ${stats.steps && stats.steps.filter(s => s.success).length > 0 ? 
                    stats.steps.filter(s => s.success).map(s => `
                    <div class="step-item">
                        <div class="step-main"><span>✅</span> ${s.name}</div>
                        ${(s.behavior || s.reason) ? `
                        <div class="step-details">
                            ${s.behavior ? `<div class="step-detail-row"><span class="step-detail-label">行為:</span> <span>${s.behavior}</span></div>` : ''}
                            ${s.reason ? `<div class="step-detail-row"><span class="step-detail-label">理由:</span> <span>${s.reason}</span></div>` : ''}
                        </div>
                        ` : ''}
                    </div>`).join('') :
                    '<div class="no-data">尚未有成功的步驟</div>'}
            </div>
            <div class="steps-column">
                <div class="steps-header error">❌ 失敗步驟 (${stats.failed})</div>
                ${stats.steps && stats.steps.filter(s => !s.success).length > 0 ? 
                    stats.steps.filter(s => !s.success).map(s => `
                    <div class="step-item">
                        <div class="step-main"><span>❌</span> ${s.name}</div>
                        ${(s.behavior || s.reason) ? `
                        <div class="step-details">
                            ${s.behavior ? `<div class="step-detail-row"><span class="step-detail-label">行為:</span> <span>${s.behavior}</span></div>` : ''}
                            ${s.reason ? `<div class="step-detail-row"><span class="step-detail-label">理由:</span> <span>${s.reason}</span></div>` : ''}
                        </div>
                        ` : ''}
                    </div>`).join('') :
                    '<div class="no-data">目前無失敗步驟</div>'}
            </div>
        </div>

        <h3>執行日誌</h3>
        <div class="log-container">${executionLogs.join('\n') || '無日誌紀錄'}</div>
    </div>

    <div class="section">
        <h2>📸 螢幕截圖</h2>
        ${screenshots.length > 0 ? `
        <div class="media-grid">
            ${screenshots.map(s => `
            <div class="media-item">
                <a href="screenshots/${s}" target="_blank">
                    <img src="screenshots/${s}" alt="${s}">
                </a>
                <div class="media-caption">${s}</div>
            </div>`).join('')}
        </div>
        ` : '<p class="no-data">尚未擷取任何截圖</p>'}
    </div>

    <div class="section">
        <h2>🎥 錄影紀錄</h2>
        ${videos.length > 0 ? `
        <div class="media-grid">
            ${videos.map(v => `
            <div class="media-item">
                <video controls>
                    <source src="videos/${v}" type="video/webm">
                    您的瀏覽器不支援影片標籤。
                </video>
                <div class="media-caption">${v}</div>
            </div>`).join('')}
        </div>
        ` : '<p class="no-data">尚未錄製任何影片</p>'}
    </div>

    <p class="timestamp">產生時間：${new Date().toLocaleString('zh-TW')}</p>
    <p class="timestamp">報告目錄：${reportDir}</p>
    <script>hljs.highlightAll();</script>
</body>
</html>
  `;
  
  const reportPath = path.join(reportDir, 'report.html');
  fs.writeFileSync(reportPath, htmlContent, 'utf8');
  
  // 更新「最新報告」索引
  const reportsBaseDir = path.dirname(reportDir);
  const latestReportPath = path.join(reportsBaseDir, 'latest-report.html');
  const relativeReportPath = path.relative(reportsBaseDir, reportPath).replace(/\\/g, '/');
  
  const latestHtml = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${relativeReportPath}">
    <title>正在重新導向至最新報告...</title>
</head>
<body>
    <p>正在重新導向至最新報告：<a href="${relativeReportPath}">${relativeReportPath}</a></p>
</body>
</html>
  `;
  fs.writeFileSync(latestReportPath, latestHtml, 'utf8');
  
  console.log(`✅ 精美 HTML 報告已生成：${reportPath}`);
  console.log(`🔗 最新報告捷徑：${latestReportPath}`);
  return reportPath;
}

module.exports = {
  launchBrowser,
  createPage,
  waitForPageReady,
  safeClick,
  safeType,
  extractTexts,
  takeScreenshot,
  authenticate,
  scrollPage,
  extractTableData,
  handleCookieBanner,
  retryWithBackoff,
  createContext,
  detectDevServers,
  getExtraHeadersFromEnv,
  generateHtmlReport
};
