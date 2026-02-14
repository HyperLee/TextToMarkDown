---
name: playwright-skill
description: Complete browser automation with Playwright. Auto-detects dev servers, writes clean test scripts to /tmp. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
---

**重要路徑說明：**
此技能可以安裝在不同位置（外掛系統、手動安裝、全域或專案特定）。在執行任何指令之前，請根據您載入此 SKILL.md 檔案的位置確定技能目錄，並在後續所有指令中使用該路徑。將 `$SKILL_DIR` 替換為實際發現的路徑。

# Playwright 瀏覽器自動化技能

這是一個全功能的瀏覽器自動化技能。我會根據您的需求撰寫自定義的 Playwright 程式碼，並透過通用執行器執行。

**核心工作流程 - 請依序遵循以下步驟：**

1. **自動偵測開發伺服器** - 針對本地測試，請務必先執行伺服器偵測：

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```

2. **撰寫腳本至 /tmp** - 永遠將測試腳本寫入 `/tmp/playwright-test-*.js`，避免污染專案目錄。
   - **務必包含截圖**：在關鍵步驟（如登入成功、頁面載入後、流程結束前）呼叫 `helpers.takeScreenshot(page, '描述')`。
   - **預設開啟錄影**：使用 `helpers.createContext(browser)` 會自動啟用錄影功能。

3. **預設使用可見瀏覽器** - 除非特別要求無頭模式（headless），否則請預設使用 `headless: false`。

4. **參數化網址** - 務必將網址設為腳本頂部的常數或環境變數。

## 運作方式

1. 您描述想要測試或自動化的任務。
2. 我會偵測執行中的開發伺服器（或詢問外部網站網址）。
3. 我會撰寫自定義程式碼至 `/tmp/playwright-test-*.js`。
4. 我會執行腳本：`cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`。
5. **自動生成報告**：執行完成後，會在當前目錄生成 `playwright-report-media/report.html`，包含截圖與錄影。

## 快速開始（首次設定）

```bash
cd $SKILL_DIR
npm run setup
```

## 執行範例

**步驟 1：偵測開發伺服器**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**步驟 2：撰寫並執行測試**

```javascript
// /tmp/playwright-test-page.js
const { chromium } = require('playwright');
const helpers = require('$SKILL_DIR/lib/helpers');

(async () => {
  const browser = await helpers.launchBrowser();
  const context = await helpers.createContext(browser);
  const page = await helpers.createPage(context);

  await page.goto('https://www.google.com.tw');
  await helpers.takeScreenshot(page, 'google-home');

  await browser.close();
  // 執行結束後會自動生成 HTML 報告
})();
```

## 常用工具函式 (lib/helpers.js)

- `helpers.launchBrowser()`: 啟動預設配置的瀏覽器。
- `helpers.createContext(browser)`: 建立支援錄影與自定義標頭的上下文。
- `helpers.createPage(context)`: 建立新頁面。
- `helpers.takeScreenshot(page, name)`: 儲存帶有時間戳記的截圖。
- `helpers.safeClick(page, selector)`: 帶有重試機制的安全點擊。
- `helpers.safeType(page, selector, text)`: 安全的文字輸入。
- `helpers.handleCookieBanner(page)`: 自動處理常見的 Cookie 同意橫幅。
- `logStep(name, success, options)`: (全域可用) 記錄測試步驟，支援傳入 `{ behavior: '描述行為', reason: '測試理由' }` 以對齊報告中的追蹤資訊。
- `stats.steps`: 包含所有步驟細節的陣列，自動統計過測與失敗數量。

## 報告功能亮點
- **📊 視覺化報告**：自動生成包含截圖與錄影的 HTML 報告。
- **📝 測試計畫顯示**：報告頂部清楚展示測試目的、流程與預期行為。
- **📈 多步驟統計與分類**：自動計算成功與失敗的步驟數量，並在報告中分開列出詳細清單，一目了然。
- **🤖 AI 深度分析**：整合 AI 結論區塊，提供專業的測試總結（支援 Markdown 格式）。
- **🔍 錯誤原因探究 (Root Cause Analysis)**：測試失敗時自動分析錯誤類型（逾時、選擇器失效、邏輯錯誤等），並給予具體的修復建議與出錯位置記錄。
- **📂 自動分類管理**：每次執行自動建立時間戳記資料夾，避免報告覆蓋。
- **🔗 最新報告捷徑**：永遠可以透過 `playwright-reports/latest-report.html` 快速開啟最近一次的結果。

## 快速開始
```bash
# 執行檔案
node run.js your-script.js

# 執行內嵌程式碼
node run.js "const browser = await helpers.launchBrowser(); ..."
```

## 提示

- **重要：優先偵測伺服器** - 在為 localhost 撰寫測試程式碼之前，請務必先執行 `detectDevServers()`。
- **自定義標頭** - 使用 `PW_HEADER_NAME`/`PW_HEADER_VALUE` 環境變數來識別發往後端的自動化流量。
- **使用 /tmp 存放測試檔案** - 寫入 `/tmp/playwright-test-*.js`，絕不寫入技能目錄或使用者的專案目錄。
- **參數化網址** - 在每個腳本頂部的 `TARGET_URL` 常數中放置偵測到或提供的網址。
- **預設：可見瀏覽器** - 除非使用者明確要求「無頭」或「背景」執行，否則請使用 `headless: false`。
- **等待策略** - 使用 `waitForURL`、`waitForSelector`、`waitForLoadState` 而非固定的等待時間。
- **錯誤處理** - 務必使用 try-catch 以確保自動化流程的強韌性。
- **媒體資源強制要求**：AI 產出的程式碼**必須**包含至少一張截圖，並使用 `helpers.createContext` 以確保有錄影存證。這是為了讓使用者在查看報告時有視覺證據。
