# Tasks: 文字轉 Markdown 格式工具網站

**輸入**: 設計文件來自 `/specs/001-text-markdown-converter/`  
**前置條件**: plan.md ✅、spec.md ✅、research.md ✅、data-model.md ✅、contracts/ ✅、quickstart.md ✅

**測試**: 憲章要求測試優先開發（TDD）— 包含 xUnit + WebApplicationFactory 測試任務。

**組織**: 任務依使用者故事（User Story）分組，每個故事可獨立實作與測試。

## 格式: `[ID] [P?] [Story] 說明`

- **[P]**: 可平行執行（不同檔案、無相依性）
- **[Story]**: 此任務歸屬的使用者故事（如 US1、US2、US3）
- 所有路徑以儲存庫根目錄為基準

## 路徑慣例

- **主要專案**: `TextToMarkDown/`（ASP.NET Core Razor Pages）
- **測試專案**: `TextToMarkDown.Tests/`（xUnit + WebApplicationFactory）
- **靜態資源**: `TextToMarkDown/wwwroot/`
- **頁面**: `TextToMarkDown/Pages/`

---

## Phase 1: Setup（專案初始化）

**目的**: 安裝相依套件、建立專案結構、準備基礎設施

- [X] T001 安裝 Serilog NuGet 套件（Serilog.AspNetCore、Serilog.Sinks.File、Serilog.Settings.Configuration）至 TextToMarkDown/TextToMarkDown.csproj
- [X] T002 設定 Serilog 結構化日誌於 TextToMarkDown/Program.cs（UseSerilog + UseSerilogRequestLogging）
- [X] T003 [P] 設定 Serilog 組態於 TextToMarkDown/appsettings.json（MinimumLevel、Console + File Sink、Enricher）
- [X] T004 [P] 設定開發環境 Serilog 組態於 TextToMarkDown/appsettings.Development.json（Debug 層級）
- [X] T005 下載並放置 Turndown.js 7.1.0 至 TextToMarkDown/wwwroot/lib/turndown/turndown.js
- [X] T006 [P] 下載並放置 turndown-plugin-gfm 至 TextToMarkDown/wwwroot/lib/turndown/turndown-plugin-gfm.js
- [X] T007 建立 xUnit 測試專案 TextToMarkDown.Tests/TextToMarkDown.Tests.csproj（含 xUnit、Moq、Microsoft.AspNetCore.Mvc.Testing 參考）
- [X] T008 [P] 將測試專案加入方案檔 TextToMarkDown.slnx
- [X] T047 [P] 安裝 Vitest JavaScript 測試框架至 TextToMarkDown/ 專案（npm init、安裝 vitest、建立 vitest.config.js、新增 package.json test 腳本）

---

## Phase 2: Foundational（阻塞性前置條件）

**目的**: 所有使用者故事共用的核心基礎設施，必須先完成

**⚠️ 關鍵**: 此階段完成前，不可開始任何使用者故事實作

### 測試（先寫測試，確保失敗）

- [X] T009 [P] 撰寫 Serilog 設定驗證單元測試於 TextToMarkDown.Tests/Unit/ProgramConfigurationTests.cs（驗證 Serilog 已註冊、ILogger 可注入）
- [X] T010 [P] 撰寫安全標頭整合測試於 TextToMarkDown.Tests/Integration/SecurityHeaderTests.cs（驗證 CSP、X-Content-Type-Options、X-Frame-Options 標頭）

### 實作

- [X] T011 設定安全標頭中介軟體於 TextToMarkDown/Program.cs（CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy）
- [X] T012 更新 TextToMarkDown/Pages/Shared/_Layout.cshtml 載入 Turndown.js 與 GFM 外掛 script 標籤
- [X] T013 [P] 更新 TextToMarkDown/Pages/Index.cshtml.cs 注入 ILogger 並記錄頁面存取日誌
- [X] T014 移除 TextToMarkDown/appsettings.json 中的預設 "Logging" 區段（已被 Serilog 取代）

**檢查點**: 基礎設施就緒 — Serilog 運作正常、安全標頭正確、Turndown.js 可載入、測試通過

---

## Phase 3: User Story 1 — 純文字貼上並轉換為 Markdown (Priority: P1) 🎯 MVP

**目標**: 使用者可將純文字內容貼到輸入區域，點擊「轉換」後取得 Markdown 格式輸出

**獨立測試**: 在網站上貼入含列表、段落的純文字，點擊轉換，驗證輸出保留段落結構與列表格式

### 測試 ⚠️

> **先寫測試，確保失敗後再實作功能**

- [X] T015 [P] [US1] 撰寫首頁渲染整合測試於 TextToMarkDown.Tests/Integration/IndexPageTests.cs（驗證 GET / 回傳 200、含 #inputText、#convertBtn、#outputText 元素）
- [X] T016 [P] [US1] 撰寫靜態資源整合測試於 TextToMarkDown.Tests/Integration/StaticAssetTests.cs（驗證 /js/markdown-converter.js、/js/clipboard-handler.js、/js/ui-controller.js 回傳 200）
- [X] T048 [P] [US1] 撰寫 convertPlainText 核心函式 JS 單元測試於 TextToMarkDown/wwwroot/js/__tests__/markdown-converter.test.js（段落保留、列表偵測、特殊字元跳脫、空白輸入處理）
- [X] T049 [P] [US1] 撰寫 ClipboardHandler JS 單元測試於 TextToMarkDown/wwwroot/js/__tests__/clipboard-handler.test.js（text/plain 偵測、InputData 物件建立、charCount 計算）

### 實作

- [X] T017 [US1] 建立轉換器頁面 UI 於 TextToMarkDown/Pages/Index.cshtml（textarea#inputText、button#convertBtn、textarea#outputText readonly、div#alertArea、span#charCount）
- [X] T018 [US1] 建立轉換器頁面樣式於 TextToMarkDown/wwwroot/css/site.css（輸入/輸出區域佈局、Bootstrap 5 響應式設計、字元計數樣式）
- [X] T019 [US1] 實作純文字轉 Markdown 引擎於 TextToMarkDown/wwwroot/js/markdown-converter.js（MarkdownConverter.init、MarkdownConverter.convertPlainText — 段落保留、列表偵測、特殊字元跳脫）
- [X] T020 [US1] 實作剪貼簿貼上處理模組於 TextToMarkDown/wwwroot/js/clipboard-handler.js（ClipboardHandler.init — paste 事件攔截、text/plain 偵測、InputData 物件建立）
- [X] T021 [US1] 實作 UI 控制器模組於 TextToMarkDown/wwwroot/js/ui-controller.js（UIController.init — 綁定轉換按鈕事件、空白輸入驗證 FR-014、字元計數更新、結果顯示）
- [X] T022 [US1] 實作空白輸入與超長文字驗證邏輯於 TextToMarkDown/wwwroot/js/ui-controller.js（空白提示 FR-014、100,000 字元超限提示）
- [X] T023 [US1] 在 TextToMarkDown/Pages/Index.cshtml 的 @section Scripts 載入 markdown-converter.js、clipboard-handler.js、ui-controller.js 並呼叫初始化

**檢查點**: User Story 1 完整可用 — 使用者可貼入純文字、點擊轉換、在輸出區域看到 Markdown 格式文字

---

## Phase 4: User Story 2 — 複製轉換後的 Markdown 到剪貼簿 (Priority: P1)

**目標**: 使用者完成轉換後，一鍵複製輸出區域中的 Markdown 文本到系統剪貼簿

**獨立測試**: 完成轉換後點擊「複製」按鈕，再貼到文字編輯器中驗證內容一致

### 測試 ⚠️

- [X] T024 [P] [US2] 撰寫首頁含複製按鈕整合測試於 TextToMarkDown.Tests/Integration/IndexPageTests.cs（驗證 GET / 含 #copyBtn 元素）

### 實作

- [X] T025 [US2] 新增複製按鈕（button#copyBtn）於 TextToMarkDown/Pages/Index.cshtml 輸出區域下方
- [X] T026 [US2] 實作 UIController.copyToClipboard 函式於 TextToMarkDown/wwwroot/js/ui-controller.js（navigator.clipboard.writeText API、成功/失敗提示、空內容檢查）
- [X] T027 [US2] 實作 UIController.showAlert 函式完善於 TextToMarkDown/wwwroot/js/ui-controller.js（Bootstrap 5 alert 元件、自動消失、四種類型 success/warning/danger/info）

**檢查點**: User Stories 1 + 2 均可獨立運作 — 完整的「貼上 → 轉換 → 複製」核心流程

---

## Phase 5: User Story 3 — 將含格式的網頁或 Office 內容轉換為 Markdown (Priority: P2)

**目標**: 使用者從網頁或 Office 文件複製帶有 HTML 格式的內容，系統自動辨識並轉換為 Markdown（粗體、斜體、超連結、表格、圖片等）

**獨立測試**: 從網頁複製含粗體、超連結、表格的內容，貼入後轉換，驗證 Markdown 輸出保留格式元素

### 測試 ⚠️

- [X] T028 [P] [US3] 撰寫 Turndown.js 靜態資源整合測試於 TextToMarkDown.Tests/Integration/StaticAssetTests.cs（驗證 /lib/turndown/turndown.js 與 /lib/turndown/turndown-plugin-gfm.js 回傳 200）
- [X] T050 [P] [US3] 撰寫 convertHtml 核心函式 JS 單元測試於 TextToMarkDown/wwwroot/js/__tests__/markdown-converter.test.js（HTML 標題 H1-H6、粗體/斜體、超連結、圖片、表格、引用區塊、水平線轉換驗證）

### 實作

- [X] T029 [US3] 擴充 ClipboardHandler 偵測 text/html 格式於 TextToMarkDown/wwwroot/js/clipboard-handler.js（clipboardData.types 檢查、HTML 優先取得、InputData.type 設為 'html'）
- [X] T030 [US3] 實作 MarkdownConverter.convertHtml 函式於 TextToMarkDown/wwwroot/js/markdown-converter.js（初始化 TurndownService 實例、載入 GFM 外掛、設定 headingStyle 與 codeBlockStyle）
- [X] T031 [US3] 新增 Turndown 自訂規則：標題 H1-H6 轉換（FR-005）、超連結（FR-007）、圖片與佔位符（FR-008）於 TextToMarkDown/wwwroot/js/markdown-converter.js
- [X] T032 [US3] 新增 Turndown 自訂規則：粗體/斜體（FR-009）、程式碼區塊（FR-012）於 TextToMarkDown/wwwroot/js/markdown-converter.js
- [X] T033 [US3] 實作 MarkdownConverter.convert 統一入口函式於 TextToMarkDown/wwwroot/js/markdown-converter.js（根據 InputData.type 自動選擇 convertHtml 或 convertPlainText）
- [X] T034 [US3] 新增 GFM 表格轉換支持（FR-010）— 確認 turndown-plugin-gfm tables 外掛正確載入於 TextToMarkDown/wwwroot/js/markdown-converter.js
- [X] T051 [US3] 新增 Turndown 自訂規則：引用區塊 `<blockquote>` 轉換為 `>` 語法（FR-019）、水平線 `<hr>` 轉換為 `---`（FR-020）於 TextToMarkDown/wwwroot/js/markdown-converter.js

**檢查點**: User Stories 1 + 2 + 3 均可獨立運作 — 純文字與富文本輸入皆可正確轉換

---

## Phase 6: User Story 5 — 多語言文字轉換支持 (Priority: P2)

**目標**: 系統正確處理中文、英文、日韓文字及表情符號混合的文字內容，轉換無亂碼

**獨立測試**: 貼入中英文混合、含表情符號的文字，驗證轉換後內容完整無亂碼

### 測試 ⚠️

> **先寫測試，確保失敗後再實作功能**

- [X] T052 [P] [US5] 撰寫 Unicode 多語言處理 JS 單元測試於 TextToMarkDown/wwwroot/js/__tests__/markdown-converter.test.js（中英文混合段落、CJK 字元列表偵測、表情符號保留、中文標點符號處理）

### 實作

- [X] T035 [US5] 驗證並確保 MarkdownConverter 純文字處理正確處理 Unicode 字元於 TextToMarkDown/wwwroot/js/markdown-converter.js（中文標點列表偵測 `•`/`‧`、Unicode 空白處理、特殊字元跳脫不影響 CJK 字元）
- [X] T036 [US5] 設定頁面 meta charset=utf-8 與 Content-Type 確認於 TextToMarkDown/Pages/Shared/_Layout.cshtml（確保 HTML 回應正確編碼）
- [X] T037 [US5] 在 TextToMarkDown/wwwroot/js/ui-controller.js 確保字元計數正確處理多位元組字元（使用 Array.from 或展開運算子計算實際字元數）

**檢查點**: 所有語言混合輸入均正確處理 — 中文、英文、日韓、表情符號無亂碼

---

## Phase 7: User Story 4 — Mermaid 圖表語法轉換 (Priority: P3)

**目標**: 系統辨識 Mermaid 語法區塊並以 ` ```mermaid ` 程式碼區塊包裹

**獨立測試**: 貼入含 Mermaid 語法的文字，驗證輸出包裹在 ` ```mermaid ` 程式碼區塊中

### 測試 ⚠️

> **先寫測試，確保失敗後再實作功能**

- [X] T053 [P] [US4] 撰寫 Mermaid 語法偵測 JS 單元測試於 TextToMarkDown/wwwroot/js/__tests__/markdown-converter.test.js（graph、flowchart、sequenceDiagram 等關鍵字偵測、已有 mermaid 標記不重複包裹、無 Mermaid 內容不產生區塊）

### 實作

- [X] T038 [US4] 實作 Mermaid 語法偵測正規表達式於 TextToMarkDown/wwwroot/js/markdown-converter.js（關鍵字偵測：graph、flowchart、sequenceDiagram、classDiagram 等 15 種圖表類型）
- [X] T039 [US4] 實作 Mermaid 區塊包裹邏輯於 TextToMarkDown/wwwroot/js/markdown-converter.js（偵測到的區塊以 ` ```mermaid ` 和 ` ``` ` 包裹、已有標記不重複包裹）
- [X] T040 [US4] 整合 Mermaid 偵測至 convertPlainText 與 convertHtml 流程於 TextToMarkDown/wwwroot/js/markdown-converter.js（HTML 來源的 `<code>` / `<pre>` 標籤中 Mermaid 內容偵測）

**檢查點**: 所有 User Stories (1-5) 均完整可用且可獨立測試

---

## Phase 8: Polish & Cross-Cutting Concerns（收尾與跨功能改進）

**目的**: 影響多個使用者故事的改進與品質強化

- [ ] T041 [P] 更新 TextToMarkDown/Pages/Privacy.cshtml 說明客戶端處理隱私政策（資料不離開瀏覽器）
- [ ] T042 [P] 新增已有 Markdown 格式偵測邏輯於 TextToMarkDown/wwwroot/js/markdown-converter.js（偵測輸入已是 Markdown 則保持原樣不重複轉換）
- [ ] T043 程式碼清理與 XML 文件註解確認於 TextToMarkDown/Pages/Index.cshtml.cs 與 TextToMarkDown/Program.cs
- [ ] T044 [P] 撰寫全頁面端對端驗證測試於 TextToMarkDown.Tests/Integration/IndexPageTests.cs（驗證完整 HTML 結構包含所有合約定義的 UI 元素；含 FR-018 驗證：確認頁面僅有單一轉換入口，無批量轉換功能）
- [ ] T045 [P] 新增 .gitignore 規則排除 Logs/ 目錄
- [ ] T054 [P] 執行效能基準驗證（Lighthouse CLI 或手動檢測：FCP < 1.5s、LCP < 2.5s；10,000 字元轉換 < 3s 計時驗證）
- [ ] T046 執行 quickstart.md 驗證 — 按快速入門指南步驟從零建構並啟動專案

---

## 相依性與執行順序

### Phase 相依關係

- **Setup (Phase 1)**: 無相依性 — 可立即開始
- **Foundational (Phase 2)**: 相依於 Setup 完成 — **阻塞所有使用者故事**
- **User Story 1 (Phase 3)**: 相依於 Foundational 完成 — MVP 核心
- **User Story 2 (Phase 4)**: 相依於 Foundational 完成 — 可與 US1 平行（但 UI 會整合 US1 的輸出區域）
- **User Story 3 (Phase 5)**: 相依於 Foundational 完成 — 擴展 US1 的轉換引擎
- **User Story 5 (Phase 6)**: 相依於 US1 完成 — 驗證 Unicode 處理
- **User Story 4 (Phase 7)**: 相依於 US1 完成 — Mermaid 偵測整合至轉換引擎
- **Polish (Phase 8)**: 相依於所有使用者故事完成

### User Story 相依關係

- **US1 (P1)**: Foundational 完成後可開始 — 無其他故事相依
- **US2 (P1)**: Foundational 完成後可開始 — 需 US1 的輸出區域存在（T017）
- **US3 (P2)**: Foundational 完成後可開始 — 擴展 US1 的 markdown-converter.js
- **US5 (P2)**: US1 完成後驗證 — 確認 Unicode 在已實作的轉換引擎中正確處理
- **US4 (P3)**: US1 完成後擴展 — 在 markdown-converter.js 新增 Mermaid 偵測

### 各使用者故事內的順序

- 測試 MUST 先撰寫並確認失敗
- UI 結構（.cshtml）優先於行為邏輯（.js）
- 驗證邏輯 → 核心邏輯 → 整合邏輯
- 完成後再進入下一個故事

### 平行執行機會

- Phase 1: T003/T004（設定檔）與 T005/T006（函式庫下載）可平行
- Phase 1: T007/T008/T047（測試專案 + JS 測試框架）可平行
- Phase 2: T009/T010（測試）可平行
- Phase 2: T012/T013（佈局更新與日誌注入）可平行
- Phase 3: T015/T016/T048/T049（C# 整合測試 + JS 單元測試）可平行
- Phase 4: T024（測試）獨立可執行
- Phase 5: T028/T050（C# 整合測試 + JS 單元測試）可平行
- Phase 6: T052（JS 單元測試）獨立可執行
- Phase 7: T053（JS 單元測試）獨立可執行
- Phase 8: T041/T042/T044/T045/T054 全部可平行

---

## 平行執行範例: User Story 1

```bash
# 先執行測試（平行）:
Task T015: "撰寫首頁渲染整合測試 — IndexPageTests.cs"
Task T016: "撰寫靜態資源整合測試 — StaticAssetTests.cs"

# 測試確認失敗後，實作 UI 結構:
Task T017: "建立轉換器頁面 UI — Index.cshtml"
Task T018: "建立轉換器頁面樣式 — site.css"

# 接著實作核心邏輯（依序，因模組間有初始化順序）:
Task T019: "實作純文字轉換引擎 — markdown-converter.js"
Task T020: "實作剪貼簿處理模組 — clipboard-handler.js"
Task T021: "實作 UI 控制器模組 — ui-controller.js"

# 完成驗證邏輯與腳本載入:
Task T022: "實作驗證邏輯 — ui-controller.js"
Task T023: "載入腳本並初始化 — Index.cshtml"
```

---

## 實作策略

### MVP 優先（僅 User Story 1 + 2）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵 — 阻塞所有故事**）
3. 完成 Phase 3: User Story 1（純文字轉換）
4. 完成 Phase 4: User Story 2（複製到剪貼簿）
5. **停下驗證**: 測試完整的「貼上 → 轉換 → 複製」流程
6. 可部署/展示 MVP

### 增量交付

1. Setup + Foundational → 基礎設施就緒
2. 新增 US1 + US2 → 獨立測試 → 部署/展示（**MVP!**）
3. 新增 US3 → 獨立測試 → 部署/展示（富文本支持）
4. 新增 US5 → 獨立測試 → 驗證（多語言支持）
5. 新增 US4 → 獨立測試 → 部署/展示（Mermaid 支持）
6. 每個故事新增價值而不破壞先前故事

---

## 備註

- [P] 任務 = 不同檔案、無相依性，可平行執行
- [Story] 標籤將任務對應到特定使用者故事，確保可追溯性
- 每個使用者故事應可獨立完成與測試
- 提交應在每個任務或邏輯群組完成後進行
- 可在任何檢查點停下獨立驗證該故事
- 避免：模糊任務、同檔案衝突、破壞獨立性的跨故事相依
