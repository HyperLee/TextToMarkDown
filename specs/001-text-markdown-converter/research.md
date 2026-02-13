# 研究文件：文字轉 Markdown 格式工具網站

**分支**: `001-text-markdown-converter` | **日期**: 2026-02-13  
**目的**: 解決技術上下文中所有待研究項目，為 Phase 1 設計提供決策依據

---

## 研究項目 1：HTML 轉 Markdown JavaScript 函式庫選擇

### 背景

規格要求客戶端瀏覽器處理 HTML 富文本轉換為 Markdown。需要選擇一個成熟穩定的 JavaScript 函式庫。

### 決策：Turndown.js 7.1.0

### 理由

- **成熟度高**：GitHub 上最廣泛使用的 HTML-to-Markdown JavaScript 函式庫，社群活躍
- **可擴展**：支持自訂規則（Custom Rules），可針對 Mermaid 程式碼區塊偵測新增規則
- **GFM 外掛**：`turndown-plugin-gfm` 提供表格、刪除線等 GitHub Flavored Markdown 擴展
- **瀏覽器相容**：原生支持瀏覽器環境，提供 UMD/ESM 打包格式
- **最新版本**：v7.1.0（2025 年更新），修復了多行屬性清理、preformatted code 支持、flanking whitespace 改進
- **Unicode 友善**：v7.1.0 修復了非 ASCII 空白處理（Fix #102, #250），適合中文環境

### 替代方案評估

| 函式庫 | 優點 | 缺點 | 結論 |
|--------|------|------|------|
| **Turndown.js** | 成熟、可擴展、GFM 外掛、社群活躍 | 需另載 GFM 外掛 | ✅ 選用 |
| **showdown** | 雙向轉換（MD↔HTML） | 主要是 MD→HTML，反向轉換能力有限 | ❌ 功能方向不符 |
| **rehype-remark** | 強大的 AST 處理 | 需要 unified 生態系整個載入，體積大 | ❌ 過度複雜 |
| **html-to-markdown（自製）** | 完全客製化 | 開發成本高、邊界情況多 | ❌ 不實際 |

### 整合方式

- 透過 `wwwroot/lib/turndown/` 放置靜態檔案（`turndown.js` + `turndown-plugin-gfm.js`）
- 在 `_Layout.cshtml` 或 `Index.cshtml` 的 `@section Scripts` 載入
- 使用 MapStaticAssets 提供靜態資源服務

---

## 研究項目 2：剪貼簿 API 與富文本偵測

### 背景

規格要求自動偵測貼上內容是否包含 HTML 格式（`text/html`），若有則優先使用 HTML 進行轉換。

### 決策：使用 Clipboard API 的 `paste` 事件

### 理由

- **瀏覽器原生支持**：所有目標瀏覽器（Chrome、Edge、Firefox、Safari）均支持 `paste` 事件的 `clipboardData`
- **格式偵測**：`event.clipboardData.types` 可檢查是否含有 `text/html` 類型
- **資料取得**：`event.clipboardData.getData('text/html')` 取得 HTML 內容
- **透明處理**：對使用者完全透明，自動判斷格式

### 實作策略

```javascript
// clipboard-handler.js
textarea.addEventListener('paste', function(event) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    
    if (clipboardData.types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        // 儲存 HTML 供轉換使用
        setInputData({ type: 'html', content: html });
    } else {
        const text = clipboardData.getData('text/plain');
        setInputData({ type: 'text', content: text });
    }
    
    // 將純文字版本顯示在 textarea 中
    const plainText = clipboardData.getData('text/plain');
    textarea.value = plainText;
});
```

### 注意事項

- Firefox 對 `navigator.clipboard.read()` 需要使用者授權，但 `paste` 事件的 `clipboardData` 不需要
- 需保留 `text/plain` 版本作為 textarea 顯示內容（使用者可見的是純文字）
- HTML 格式內容在背景儲存，待使用者點擊「轉換」時使用

---

## 研究項目 3：Serilog 與 ASP.NET Core 10.0 整合

### 背景

憲章要求使用 Serilog 實施結構化日誌，需要確認 .NET 10.0 相容性與最佳實踐。

### 決策：Serilog.AspNetCore + Console + File Sink

### 理由

- **官方支持**：`Serilog.AspNetCore` 套件路由所有 ASP.NET Core 日誌到 Serilog
- **完全相容**：與 `Microsoft.Extensions.Logging.ILogger` 介面相容，使用者程式碼不需要直接參考 Serilog 類型
- **結構化日誌**：支持結構化屬性、Enricher、LogContext
- **Request Logging**：`UseSerilogRequestLogging()` 中介軟體取代 ASP.NET Core 預設的詳細請求日誌

### 所需 NuGet 套件

| 套件 | 用途 |
|------|------|
| `Serilog.AspNetCore` | ASP.NET Core 整合（含 Console Sink） |
| `Serilog.Sinks.File` | 檔案日誌輸出（Rolling File） |
| `Serilog.Settings.Configuration` | 從 `appsettings.json` 讀取設定 |

### 設定方式

```csharp
// Program.cs
using Serilog;

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// ...

app.UseSerilogRequestLogging();
```

```json
// appsettings.json - Serilog 區段
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": {
          "path": "Logs/log-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 7
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"]
  }
}
```

---

## 研究項目 4：Mermaid 語法偵測模式

### 背景

規格 FR-011 要求辨識 Mermaid 圖表語法區塊，以 ` ```mermaid ` 程式碼區塊包裹。

### 決策：正規表達式 + 關鍵字偵測

### 理由

- Mermaid 語法具有明確的起始關鍵字（`graph`、`sequenceDiagram`、`classDiagram`、`flowchart`、`gantt`、`pie`、`erDiagram`、`stateDiagram`、`journey`、`gitgraph`）
- 可透過正規表達式偵測這些關鍵字開頭的文字區塊
- 不需要完整解析 Mermaid 語法，僅需辨識並包裹

### 偵測策略

```javascript
// Mermaid 語法偵測正規表達式
const mermaidKeywords = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'erDiagram', 'journey', 'gantt',
    'pie', 'gitgraph', 'mindmap', 'timeline',
    'quadrantChart', 'sankey', 'xychart'
];

const mermaidPattern = new RegExp(
    `^(${mermaidKeywords.join('|')})\\b[\\s\\S]*?(?=\\n\\n|$)`,
    'gm'
);
```

### 注意事項

- 若輸入已包含 ` ```mermaid ` 標記，應保持原樣不重複包裹
- 偵測應在純文字處理流程中執行，HTML 來源的 Mermaid 區塊可能在 `<code>` 或 `<pre>` 標籤中
- 僅偵測結構明確的 Mermaid 語法，避免誤判一般文字

---

## 研究項目 5：客戶端 JavaScript 測試策略

### 背景

憲章要求測試優先開發。使用者指定 xUnit + Moq 用於 C# 測試，但核心轉換邏輯在客戶端 JavaScript 執行。

### 決策：C# 整合測試 + JavaScript 手動驗證

### 理由

- **C# 測試範圍**：
  - 頁面渲染正確性（WebApplicationFactory 驗證 HTML 結構）
  - Serilog 設定正確性
  - 靜態資源可用性（JS/CSS 檔案回應 200）
  - CSP / 安全標頭驗證
- **JavaScript 轉換邏輯**：
  - 核心轉換完全在瀏覽器端，C# 測試無法直接驗證 JavaScript 邏輯
  - 規格中的驗收測試透過手動瀏覽器測試驗證
  - 未來可考慮引入 Playwright 進行端對端測試

### 替代方案評估

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| Jest（Node.js） | 可測試 JS 模組 | 需額外 Node.js 工具鏈 | ❌ 增加專案複雜度 |
| Playwright | E2E 測試完整覆蓋 | 設定複雜、執行慢 | 🔶 未來考慮 |
| WebApplicationFactory | 驗證頁面結構 | 無法執行 JS | ✅ 目前採用 |

---

## 研究項目 6：Content Security Policy（CSP）策略

### 背景

憲章安全原則要求實施 CSP 標頭。由於使用客戶端 JavaScript 處理 HTML 內容，需要仔細設計 CSP。

### 決策：嚴格 CSP + nonce-based inline script

### 理由

- 所有 JavaScript 從 `wwwroot/js/` 和 `wwwroot/lib/` 載入，使用 `'self'` 限制
- Turndown.js 需要操作 DOM（解析 HTML），但不需要 `eval` 或 `unsafe-inline`
- `style-src` 允許 `'self'` 和 Bootstrap 需要的 inline styles

### 建議 CSP 設定

```
Content-Security-Policy: 
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
```

### 注意事項

- `style-src 'unsafe-inline'` 是 Bootstrap 的必要設定（內聯樣式）
- `img-src data:` 允許 data URI 圖片（可能來自貼上的 HTML 內容）
- 無需 CDN 來源，所有函式庫從本地 `wwwroot/lib/` 載入

---

## 研究項目 7：純文字轉換策略

### 背景

規格 FR-005 指出純文字不進行標題推測，僅保留段落結構。需要決定純文字的處理策略。

### 決策：段落保留 + 列表偵測 + 特殊字元跳脫

### 理由

- 純文字不含 HTML 標籤，無法使用 Turndown.js 處理
- 需要自訂邏輯處理純文字的結構辨識

### 處理規則

| 偵測項目 | 模式 | Markdown 輸出 |
|----------|------|---------------|
| 段落 | 連續空行分隔 | 段落間空行保留 |
| 無序列表 | 行首 `- `、`* `、`• `、`‧ ` | `- item` |
| 有序列表 | 行首 `1. `、`2. ` 等數字 | `1. item` |
| Mermaid 區塊 | 關鍵字偵測 | ` ```mermaid ` 包裹 |
| 程式碼區塊 | 行首 4 空格或 tab 縮排區塊 | ` ``` ` 包裹 |
| 特殊字元 | `*`、`_`、`#`、`[`、`]`、`` ` `` | 反斜線跳脫 |
| 已有 Markdown | 偵測 Markdown 語法 | 保持原樣 |

---

## 總結

所有技術上下文中的待研究項目已解決。關鍵決策：

1. **Turndown.js 7.1.0** + **turndown-plugin-gfm** 作為 HTML→Markdown 轉換核心
2. **Clipboard API paste 事件** 實現透明的富文本/純文字自動偵測
3. **Serilog.AspNetCore** + Console + File Sink 提供結構化日誌
4. **正規表達式** 偵測 Mermaid 語法區塊
5. **xUnit + WebApplicationFactory** 覆蓋伺服器端測試，客戶端轉換邏輯以手動測試驗證
6. **嚴格 CSP** 確保安全性，所有函式庫從本地載入
7. **自訂規則** 處理純文字段落/列表辨識
