# 頁面合約：文字轉 Markdown 格式工具網站

**分支**: `001-text-markdown-converter` | **日期**: 2026-02-13  
**來源**: [spec.md](../spec.md) Functional Requirements

---

## 概述

本系統為純客戶端轉換工具，不具備 REST API 端點。以下定義伺服器提供的頁面端點及客戶端 JavaScript 模組的公開介面合約。

---

## 伺服器端頁面端點

### GET /

**說明**: 主要轉換器頁面

| 項目 | 值 |
|------|-----|
| HTTP 方法 | `GET` |
| 路徑 | `/` |
| 頁面模型 | `IndexModel` |
| 回應類型 | `text/html` |
| 狀態碼 | `200 OK` |

**頁面結構要求**（HTML 元素）:

| 元素 | ID / 選擇器 | 用途 | 對應需求 |
|------|-------------|------|----------|
| `<textarea>` | `#inputText` | 使用者輸入區域 | FR-001 |
| `<button>` | `#convertBtn` | 轉換按鈕 | FR-002 |
| `<textarea>` 或 `<pre>` | `#outputText` | Markdown 輸出區域（唯讀） | FR-003 |
| `<button>` | `#copyBtn` | 複製到剪貼簿按鈕 | FR-004 |
| `<div>` | `#alertArea` | 提示訊息顯示區域 | FR-014 |
| `<span>` | `#charCount` | 字元計數顯示 | 邊界情況 |

### GET /Privacy

**說明**: 隱私權政策頁面

| 項目 | 值 |
|------|-----|
| HTTP 方法 | `GET` |
| 路徑 | `/Privacy` |
| 回應類型 | `text/html` |
| 狀態碼 | `200 OK` |

### GET /Error

**說明**: 錯誤處理頁面

| 項目 | 值 |
|------|-----|
| HTTP 方法 | `GET` |
| 路徑 | `/Error` |
| 回應類型 | `text/html` |
| 狀態碼 | `200 OK` |

---

## 靜態資源端點

| 路徑 | 類型 | 說明 |
|------|------|------|
| `/css/site.css` | CSS | 自訂樣式 |
| `/js/site.js` | JavaScript | 通用腳本 |
| `/js/markdown-converter.js` | JavaScript | 核心轉換引擎 |
| `/js/clipboard-handler.js` | JavaScript | 剪貼簿處理 |
| `/js/ui-controller.js` | JavaScript | UI 互動邏輯 |
| `/lib/turndown/turndown.js` | JavaScript | Turndown.js 函式庫 |
| `/lib/turndown/turndown-plugin-gfm.js` | JavaScript | Turndown GFM 外掛 |
| `/lib/bootstrap/**` | CSS/JS | Bootstrap 5 |
| `/lib/jquery/**` | JavaScript | jQuery 3.x |
| `/lib/jquery-validation/**` | JavaScript | jQuery Validation |

---

## 客戶端 JavaScript 模組合約

### markdown-converter.js

核心轉換引擎模組。

```typescript
/**
 * MarkdownConverter 模組 - 負責將 HTML 或純文字轉換為 Markdown
 */
declare namespace MarkdownConverter {
    /**
     * 初始化轉換器（設定 Turndown 實例與自訂規則）
     */
    function init(): void;

    /**
     * 將 HTML 內容轉換為 Markdown
     * @param html - HTML 標記字串
     * @returns ConversionResult 物件
     */
    function convertHtml(html: string): ConversionResult;

    /**
     * 將純文字內容轉換為 Markdown
     * @param text - 純文字字串
     * @returns ConversionResult 物件
     */
    function convertPlainText(text: string): ConversionResult;

    /**
     * 統一轉換入口（根據 InputData.type 自動選擇策略）
     * @param inputData - 輸入資料物件
     * @returns ConversionResult 物件
     */
    function convert(inputData: InputData): ConversionResult;
}
```

### clipboard-handler.js

剪貼簿貼上偵測模組。

```typescript
/**
 * ClipboardHandler 模組 - 負責攔截貼上事件並偵測格式
 */
declare namespace ClipboardHandler {
    /**
     * 初始化剪貼簿處理器
     * @param textareaElement - 目標 textarea 元素
     * @param onDataReady - 資料就緒回呼函式
     */
    function init(
        textareaElement: HTMLTextAreaElement, 
        onDataReady: (data: InputData) => void
    ): void;

    /**
     * 取得目前儲存的輸入資料
     * @returns 目前的 InputData 或 null
     */
    function getCurrentData(): InputData | null;

    /**
     * 清除目前的輸入資料
     */
    function clear(): void;
}
```

### ui-controller.js

UI 互動邏輯模組。

```typescript
/**
 * UIController 模組 - 負責 UI 事件綁定與使用者回饋
 */
declare namespace UIController {
    /**
     * 初始化 UI 控制器（綁定所有事件處理常式）
     */
    function init(): void;

    /**
     * 顯示輸出結果
     * @param result - 轉換結果物件
     */
    function displayResult(result: ConversionResult): void;

    /**
     * 顯示提示訊息
     * @param message - 提示內容
     * @param type - 提示類型（Bootstrap alert class）
     */
    function showAlert(message: string, type: 'success' | 'warning' | 'danger' | 'info'): void;

    /**
     * 複製輸出內容到剪貼簿
     */
    function copyToClipboard(): Promise<void>;

    /**
     * 更新字元計數顯示
     * @param count - 字元數
     */
    function updateCharCount(count: number): void;
}
```

---

## 安全標頭合約

伺服器回應必須包含以下安全標頭：

| 標頭 | 值 | 說明 |
|------|-----|------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` | 內容安全策略 |
| `X-Content-Type-Options` | `nosniff` | 防止 MIME 類型嗅探 |
| `X-Frame-Options` | `DENY` | 防止點擊劫持 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 參考來源政策 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS（生產環境） |

---

## 錯誤處理合約

### 客戶端錯誤回應

| 情境 | 提示類型 | 訊息內容 | 對應需求 |
|------|----------|----------|----------|
| 輸入為空 | `warning` | 「請先輸入或貼上要轉換的文字內容」 | FR-014 |
| 字元數超限 | `warning` | 「輸入文字超過 100,000 字元，可能影響轉換效能」 | 邊界情況 |
| 轉換失敗 | `danger` | 「轉換過程發生錯誤，請確認輸入內容」 | 錯誤處理 |
| 複製成功 | `success` | 「已成功複製到剪貼簿！」 | FR-004 |
| 無可複製內容 | `info` | 「尚無可複製的內容，請先進行轉換」 | FR-004 |
| 瀏覽器不支持剪貼簿 | `warning` | 「您的瀏覽器不支持自動複製，請手動選取複製」 | 假設 |
