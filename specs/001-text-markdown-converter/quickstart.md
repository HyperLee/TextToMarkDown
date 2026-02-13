# 快速入門指南：文字轉 Markdown 格式工具網站

**分支**: `001-text-markdown-converter` | **日期**: 2026-02-13

---

## 前置需求

| 項目 | 版本 | 安裝方式 |
|------|------|----------|
| .NET SDK | 10.0+ | [下載](https://dotnet.microsoft.com/download/dotnet/10.0) |
| IDE | VS Code 或 Visual Studio 2022+ | — |
| 瀏覽器 | Chrome / Edge / Firefox / Safari（最新版） | — |

---

## 快速啟動

### 1. 複製儲存庫並切換分支

```bash
git clone https://github.com/HyperLee/TextToMarkDown.git
cd TextToMarkDown
git checkout 001-text-markdown-converter
```

### 2. 還原相依套件

```bash
dotnet restore TextToMarkDown/TextToMarkDown.csproj
```

### 3. 建構專案

```bash
dotnet build TextToMarkDown/TextToMarkDown.csproj -c Debug
```

### 4. 執行應用程式

```bash
dotnet run --project TextToMarkDown/TextToMarkDown.csproj
```

應用程式預設在 `https://localhost:5001` 或 `http://localhost:5000` 啟動。

### 5. 開啟瀏覽器

瀏覽 `https://localhost:5001` 即可使用文字轉 Markdown 工具。

---

## 開發模式（熱重載）

```bash
dotnet watch run --project TextToMarkDown/TextToMarkDown.csproj
```

修改 `.cshtml`、`.css`、`.js` 檔案時會自動重載。

---

## 執行測試

```bash
# 全部測試
dotnet test

# 僅單元測試
dotnet test --filter "Category=Unit"

# 僅整合測試
dotnet test --filter "Category=Integration"
```

---

## 專案結構快覽

```
TextToMarkDown/
├── Program.cs                  # 進入點、Serilog 設定
├── TextToMarkDown.csproj       # 專案檔
├── Pages/
│   ├── Index.cshtml            # 主要轉換器頁面
│   └── Shared/_Layout.cshtml  # 主版佈局
├── wwwroot/
│   ├── css/site.css            # 自訂樣式
│   ├── js/
│   │   ├── markdown-converter.js  # 轉換引擎
│   │   ├── clipboard-handler.js   # 貼上偵測
│   │   └── ui-controller.js       # UI 控制
│   └── lib/turndown/           # Turndown.js 函式庫
└── TextToMarkDown.Tests/       # 測試專案
```

---

## 關鍵設定檔

### appsettings.json（Serilog 設定）

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "Logs/log-.txt", "rollingInterval": "Day" } }
    ]
  }
}
```

### NuGet 套件

| 套件 | 用途 |
|------|------|
| `Serilog.AspNetCore` | ASP.NET Core 日誌整合 |
| `Serilog.Sinks.File` | 檔案日誌輸出 |
| `Serilog.Settings.Configuration` | 設定檔讀取 |

安裝指令：

```bash
cd TextToMarkDown
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Settings.Configuration
```

---

## 常見問題

### Q: 日誌檔案在哪裡？

A: 開發模式下在 `TextToMarkDown/Logs/` 目錄，按日期滾動產生 `log-YYYYMMDD.txt`。

### Q: 如何新增 Turndown.js 函式庫？

A: 從 [cdnjs](https://cdnjs.com/libraries/turndown) 或 [GitHub Releases](https://github.com/mixmark-io/turndown/releases) 下載 `turndown.js`，放置於 `wwwroot/lib/turndown/` 目錄。GFM 外掛從 [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) 下載。

### Q: 瀏覽器安全性限制？

A: Clipboard API 在 HTTPS 環境下運作最佳。開發模式使用 `localhost` 自動信任。生產環境必須啟用 HTTPS。
