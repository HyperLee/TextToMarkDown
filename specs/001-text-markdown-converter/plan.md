# 實作計畫：文字轉 Markdown 格式工具網站

**分支**: `001-text-markdown-converter` | **日期**: 2026-02-13 | **規格**: [spec.md](spec.md)  
**輸入**: 功能規格來自 `/specs/001-text-markdown-converter/spec.md`

## 摘要

建立一個基於 ASP.NET Core 10.0 Razor Pages 的工具網站，讓使用者將純文字或富文本（HTML 格式）內容貼入後，透過客戶端 JavaScript（Turndown.js）自動轉換為 GitHub Flavored Markdown 格式。伺服器端僅負責頁面提供與結構化日誌（Serilog），所有轉換邏輯在瀏覽器端完成。

## 技術上下文

**語言/版本**: C# 14 / .NET 10.0  
**主要相依性**: ASP.NET Core 10.0（Razor Pages）、Bootstrap 5、jQuery 3.x、jQuery Validation、Turndown.js 7.1.0（HTML→Markdown）、turndown-plugin-gfm（GFM 表格/刪除線）、Serilog.AspNetCore  
**儲存**: N/A（無資料庫，C# 靜態資料集合）  
**測試**: xUnit + Moq（單元測試）+ WebApplicationFactory（整合測試）  
**目標平台**: 桌面瀏覽器（Chrome、Edge、Firefox、Safari）  
**專案類型**: Web（單一 Razor Pages 專案）  
**效能目標**: FCP < 1.5 秒、LCP < 2.5 秒；10,000 字元以內轉換 < 3 秒  
**限制條件**: 100,000 字元上限提示、客戶端處理不離開瀏覽器（隱私安全）  
**規模/範圍**: 單頁工具網站、無使用者帳號、無歷史記錄儲存

## 憲章檢查

*閘門：Phase 0 研究前必須通過。Phase 1 設計後重新檢查。*

### 初始閘門評估（Phase 0 前）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 程式碼品質至上 (NON-NEGOTIABLE) | ✅ 通過 | 使用 C# 14 最新功能、PascalCase/camelCase 命名、XML 文件註解、file-scoped namespace、pattern matching |
| II. 測試優先開發 (NON-NEGOTIABLE) | ✅ 通過 | xUnit + Moq 單元測試、WebApplicationFactory 整合測試；客戶端 JS 需額外測試策略 |
| III. 使用者體驗一致性 | ✅ 通過 | Bootstrap 5 元件庫、jQuery Validation 即時驗證回饋、回應式設計、WCAG 2.1 |
| IV. 效能與延展性 | ✅ 通過 | FCP < 1.5s 目標、MapStaticAssets 靜態資源最佳化、客戶端轉換避免伺服器負擔 |
| V. 可觀察性與監控 | ✅ 通過 | Serilog 結構化日誌、UseSerilogRequestLogging 中介軟體、適當日誌層級 |
| VI. 安全優先 | ✅ 通過 | Razor 內建 HTML 編碼防 XSS、Anti-Forgery Token、HTTPS/HSTS、CSP 標頭 |

**閘門結果**: ✅ 全部通過，無違規需要證明。

## 專案結構

### 文件（本功能）

```text
specs/001-text-markdown-converter/
├── plan.md              # 本檔案（/speckit.plan 指令輸出）
├── research.md          # Phase 0 輸出（/speckit.plan 指令）
├── data-model.md        # Phase 1 輸出（/speckit.plan 指令）
├── quickstart.md        # Phase 1 輸出（/speckit.plan 指令）
├── contracts/           # Phase 1 輸出（/speckit.plan 指令）
│   └── page-contracts.md
└── tasks.md             # Phase 2 輸出（/speckit.tasks 指令 - 非 /speckit.plan 建立）
```

### 原始碼（儲存庫根目錄）

```text
TextToMarkDown/                          # ASP.NET Core Razor Pages 專案
├── Program.cs                           # 應用程式進入點、Serilog 設定、中介軟體管線
├── TextToMarkDown.csproj                # .NET 10.0 專案檔（含 Serilog NuGet 套件）
├── appsettings.json                     # Serilog 設定、應用程式設定
├── appsettings.Development.json         # 開發環境特定設定
├── Pages/
│   ├── _ViewImports.cshtml              # Tag Helper 匯入
│   ├── _ViewStart.cshtml                # 預設佈局設定
│   ├── Index.cshtml                     # 主要轉換器頁面 UI（輸入/輸出/按鈕）
│   ├── Index.cshtml.cs                  # Index 頁面模型
│   ├── Error.cshtml                     # 錯誤頁面
│   ├── Error.cshtml.cs                  # 錯誤頁面模型
│   ├── Privacy.cshtml                   # 隱私權頁面
│   ├── Privacy.cshtml.cs               # 隱私權頁面模型
│   └── Shared/
│       ├── _Layout.cshtml               # 主版佈局（Bootstrap 5 + 導覽列）
│       ├── _Layout.cshtml.css           # 佈局 CSS 隔離
│       └── _ValidationScriptsPartial.cshtml  # jQuery Validation 腳本
├── wwwroot/
│   ├── css/
│   │   └── site.css                     # 自訂樣式（轉換器 UI 樣式）
│   ├── js/
│   │   ├── site.js                      # 通用網站腳本
│   │   ├── markdown-converter.js        # 核心轉換引擎（Turndown 封裝 + 自訂規則）
│   │   ├── clipboard-handler.js         # 剪貼簿貼上偵測（HTML/純文字判斷）
│   │   └── ui-controller.js             # UI 互動邏輯（按鈕事件、驗證、提示）
│   └── lib/
│       ├── bootstrap/                   # Bootstrap 5 前端框架
│       ├── jquery/                      # jQuery 3.x
│       ├── jquery-validation/           # jQuery Validation
│       ├── jquery-validation-unobtrusive/  # Unobtrusive Validation
│       └── turndown/                    # Turndown.js 7.1.0 + turndown-plugin-gfm
└── Properties/
    └── launchSettings.json              # 啟動設定

TextToMarkDown.Tests/                    # 測試專案
├── TextToMarkDown.Tests.csproj          # xUnit + Moq 測試專案檔
├── Unit/                                # 單元測試
│   └── ProgramConfigurationTests.cs     # Serilog 設定、服務註冊驗證
└── Integration/                         # 整合測試
    ├── PageRenderingTests.cs            # 頁面渲染正確性（WebApplicationFactory）
    └── StaticAssetTests.cs              # 靜態資源可用性驗證
```

**結構決策**: 採用單一 Razor Pages 專案結構。由於所有轉換邏輯在客戶端 JavaScript 執行，伺服器端僅提供頁面和靜態資源，不需要複雜的後端分層。JavaScript 按職責拆分為三個模組（`markdown-converter.js`、`clipboard-handler.js`、`ui-controller.js`），遵循關注點分離原則。測試專案涵蓋伺服器端設定驗證與頁面渲染整合測試。

## 憲章檢查（Phase 1 設計後重新評估）

| 原則 | 狀態 | 設計後驗證 |
|------|------|-----------|
| I. 程式碼品質至上 | ✅ 通過 | JS 模組分離（markdown-converter / clipboard-handler / ui-controller）符合關注點分離；C# 使用 XML 文件註解 |
| II. 測試優先開發 | ✅ 通過 | 伺服器端：xUnit + WebApplicationFactory 驗證頁面渲染與靜態資源；客戶端：手動驗收測試覆蓋所有 User Story |
| III. 使用者體驗一致性 | ✅ 通過 | 頁面合約定義明確的 UI 元素 ID、Bootstrap 5 alert 提示、字元計數回饋 |
| IV. 效能與延展性 | ✅ 通過 | Turndown.js 客戶端處理避免伺服器負擔；MapStaticAssets 提供靜態資源最佳化 |
| V. 可觀察性與監控 | ✅ 通過 | Serilog 三層設定（Console + File + Configuration），UseSerilogRequestLogging 中介軟體 |
| VI. 安全優先 | ✅ 通過 | CSP 標頭合約明確定義、所有函式庫從本地 wwwroot/lib/ 載入、Razor 內建 HTML 編碼 |

**重新評估結果**: ✅ 全部通過，設計與憲章完全對齊。

## 複雜度追蹤

> 無憲章違規，此區段不適用。
