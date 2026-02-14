
const { chromium, firefox, webkit, devices } = require('playwright');
const path = require('path');
const helpers = require('C:/GitHubFolder/TextToMarkDown/.github/skills/playwright-skill/lib/helpers');

// 測試計畫環境變數
process.env.PW_TEST_PLAN = "";

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
  const rawTestCode = JSON.parse("\"\\nconst TARGET_URL = 'http://localhost:5000';\\n\\nconst browser = await helpers.launchBrowser();\\nconst context = await helpers.createContext(browser);\\nconst page = await helpers.createPage(context);\\n\\n// Capture console messages\\nconst consoleLogs = [];\\npage.on('console', msg => consoleLogs.push(msg.type() + ': ' + msg.text()));\\npage.on('pageerror', err => consoleLogs.push('PAGE_ERROR: ' + err.message));\\n\\nawait page.goto(TARGET_URL, { waitUntil: 'networkidle' });\\nawait page.waitForTimeout(1000);\\n\\nconst result = await page.evaluate(() => {\\n  return {\\n    hasTurndown: typeof TurndownService !== 'undefined',\\n    hasTurndownOnWindow: typeof window.TurndownService !== 'undefined',\\n    hasGfm: typeof turndownPluginGfm !== 'undefined',\\n    scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),\\n    converterExists: typeof window.MarkdownConverter !== 'undefined',\\n    converterHtml: window.MarkdownConverter ? typeof window.MarkdownConverter.convertHtml : 'N/A'\\n  };\\n});\\n\\nconsole.log('Browser state:', JSON.stringify(result, null, 2));\\nconsole.log('Console logs:', consoleLogs.join('\\\\n'));\\n\\n// Try actual HTML conversion\\nconst htmlResult = await page.evaluate(() => {\\n  if (!window.MarkdownConverter) return 'No MarkdownConverter';\\n  try {\\n    return window.MarkdownConverter.convertHtml('<h1>Test</h1><p><strong>Bold</strong> text</p>');\\n  } catch(e) {\\n    return 'Error: ' + e.message;\\n  }\\n});\\nconsole.log('HTML conversion result:', htmlResult);\\n\\nawait browser.close();\\n\"");

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

// Capture console messages
const consoleLogs = [];
page.on('console', msg => consoleLogs.push(msg.type() + ': ' + msg.text()));
page.on('pageerror', err => consoleLogs.push('PAGE_ERROR: ' + err.message));

await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const result = await page.evaluate(() => {
  return {
    hasTurndown: typeof TurndownService !== 'undefined',
    hasTurndownOnWindow: typeof window.TurndownService !== 'undefined',
    hasGfm: typeof turndownPluginGfm !== 'undefined',
    scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),
    converterExists: typeof window.MarkdownConverter !== 'undefined',
    converterHtml: window.MarkdownConverter ? typeof window.MarkdownConverter.convertHtml : 'N/A'
  };
});

console.log('Browser state:', JSON.stringify(result, null, 2));
console.log('Console logs:', consoleLogs.join('\n'));

// Try actual HTML conversion
const htmlResult = await page.evaluate(() => {
  if (!window.MarkdownConverter) return 'No MarkdownConverter';
  try {
    return window.MarkdownConverter.convertHtml('<h1>Test</h1><p><strong>Bold</strong> text</p>');
  } catch(e) {
    return 'Error: ' + e.message;
  }
});
console.log('HTML conversion result:', htmlResult);

await browser.close();

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
