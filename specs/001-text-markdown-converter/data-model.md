# 資料模型：文字轉 Markdown 格式工具網站

**分支**: `001-text-markdown-converter` | **日期**: 2026-02-13  
**來源**: [spec.md](spec.md) Key Entities 區段

---

## 概述

本系統為純客戶端轉換工具，不使用資料庫。所有資料模型為 JavaScript 物件，在瀏覽器記憶體中存在。以下定義了系統運作時的核心資料結構。

---

## 實體定義

### 1. InputData（輸入資料）

使用者透過貼上或輸入提供的原始內容。

```typescript
/**
 * 使用者輸入的原始資料
 */
interface InputData {
    /** 輸入內容的格式類型 */
    type: 'html' | 'text';
    
    /** 原始內容（HTML 標記或純文字） */
    content: string;
    
    /** 使用者在 textarea 中看到的純文字版本 */
    displayText: string;
    
    /** 內容字元數（用於長度驗證） */
    charCount: number;
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `type` | `'html' \| 'text'` | ✅ | 自動偵測：貼上時若剪貼簿含 HTML 格式則為 `'html'`，否則為 `'text'` |
| `content` | `string` | ✅ | 原始輸入內容。HTML 類型為完整 HTML 標記，text 類型為純文字 |
| `displayText` | `string` | ✅ | 顯示在 textarea 中的純文字版本 |
| `charCount` | `number` | ✅ | 字元數，超過 100,000 時觸發提示 |

**驗證規則**:
- `content` 不可為空白（空白時顯示友善提示，參考 FR-014）
- `charCount` 超過 100,000 時顯示「文字過長」提示
- `type` 根據 `clipboardData.types` 自動判斷

---

### 2. ConversionResult（轉換結果）

經過轉換引擎處理後產生的 Markdown 格式文本。

```typescript
/**
 * 轉換引擎的輸出結果
 */
interface ConversionResult {
    /** 轉換後的 Markdown 文字內容 */
    markdown: string;
    
    /** 轉換狀態 */
    status: 'success' | 'error' | 'empty';
    
    /** 錯誤訊息（僅在 status 為 'error' 時有值） */
    errorMessage?: string;
    
    /** 來源格式類型 */
    sourceType: 'html' | 'text';
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `markdown` | `string` | ✅ | 轉換後的 Markdown 原始語法文字 |
| `status` | `'success' \| 'error' \| 'empty'` | ✅ | 轉換結果狀態 |
| `errorMessage` | `string?` | ❌ | 錯誤訊息，僅在轉換失敗時提供 |
| `sourceType` | `'html' \| 'text'` | ✅ | 記錄輸入來源格式，用於 UI 提示 |

**狀態轉換**:
- `empty`: 使用者未輸入內容就點擊轉換
- `success`: 轉換完成
- `error`: 轉換過程發生異常

---

### 3. FormatElement（格式元素）

在輸入文本中辨識出的格式單元（概念模型，用於 Turndown.js 自訂規則設計）。

```typescript
/**
 * 辨識出的格式元素類型
 */
type FormatElementType = 
    | 'heading'     // 標題（H1-H6，僅 HTML 來源）
    | 'paragraph'   // 段落
    | 'unordered-list'  // 無序列表
    | 'ordered-list'    // 有序列表
    | 'link'        // 超連結
    | 'image'       // 圖片
    | 'bold'        // 粗體
    | 'italic'      // 斜體
    | 'table'       // 表格
    | 'code-block'  // 程式碼區塊
    | 'inline-code' // 行內程式碼
    | 'mermaid'     // Mermaid 圖表
    | 'blockquote'  // 引用區塊
    | 'horizontal-rule'; // 水平線

/**
 * 格式元素定義（概念模型）
 */
interface FormatElement {
    /** 元素類型 */
    type: FormatElementType;
    
    /** 原始 HTML 或文字內容 */
    originalContent: string;
    
    /** 轉換後的 Markdown 表示 */
    markdownOutput: string;
}
```

---

## 狀態流程

```
[初始狀態]
    │
    ▼
使用者貼上/輸入文字
    │
    ├─ 偵測到 text/html → InputData { type: 'html' }
    │
    └─ 僅 text/plain   → InputData { type: 'text' }
    │
    ▼
使用者點擊「轉換」按鈕
    │
    ├─ 內容為空 → ConversionResult { status: 'empty' } → 顯示提示
    │
    ├─ 字元數 > 100,000 → 顯示「文字過長」提示
    │
    ├─ type: 'html' → Turndown.js 轉換 → ConversionResult { status: 'success' }
    │
    └─ type: 'text' → 純文字處理邏輯 → ConversionResult { status: 'success' }
    │
    ▼
輸出區域顯示 Markdown 原始語法
    │
    ▼
使用者點擊「複製」按鈕
    │
    ├─ 有內容 → 複製到剪貼簿 → 顯示成功提示
    │
    └─ 無內容 → 顯示「無可複製內容」提示
```

---

## JavaScript 模組關係

```
clipboard-handler.js          ui-controller.js
        │                            │
        │ InputData                  │ UI 事件
        ▼                            ▼
    ┌─────────────────────────────────────┐
    │         markdown-converter.js        │
    │                                      │
    │   ┌─────────────┐  ┌─────────────┐  │
    │   │ Turndown.js  │  │ 純文字處理   │  │
    │   │ + GFM plugin │  │ 邏輯        │  │
    │   └─────────────┘  └─────────────┘  │
    │                                      │
    │         ConversionResult             │
    └──────────────────────────────────────┘
                    │
                    ▼
            ui-controller.js
            （輸出顯示 + 複製功能）
```

---

## 伺服器端模型（C#）

由於伺服器僅提供頁面，C# 模型極為精簡：

```csharp
// Pages/Index.cshtml.cs
namespace TextToMarkDown.Pages;

/// <summary>
/// 文字轉 Markdown 工具主頁面模型。
/// <example>
/// <code>
/// // 此頁面模型不處理任何轉換邏輯，
/// // 所有轉換在客戶端 JavaScript 完成。
/// </code>
/// </example>
/// </summary>
public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {
        _logger.LogInformation("使用者存取轉換器頁面");
    }
}
```

無額外的 C# 實體類別、服務介面或資料存取層——符合規格中「全部在客戶端處理」的設計決策。
