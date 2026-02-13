# TextToMarkDown

> A web-based tool that converts plain text and rich text (HTML) into clean Markdown, ready for GitHub and beyond.

[Features](#features) | [Getting Started](#getting-started) | [Usage](#usage) | [Project Structure](#project-structure) | [Testing](#testing)

## Features

- **Paste & Convert** — Paste text from any source (web pages, Office documents, plain text files) and convert it to Markdown with one click
- **Smart Format Detection** — Automatically detects HTML rich text in the clipboard; falls back to plain text when no HTML is present
- **Rich Text Support** — Converts headings, bold/italic, links, images, lists, tables, blockquotes, code blocks, and horizontal rules
- **Mermaid Diagrams** — Recognizes Mermaid syntax blocks and wraps them in fenced code blocks
- **GFM Tables** — Full support for GitHub Flavored Markdown table syntax via the Turndown GFM plugin
- **One-Click Copy** — Copy the converted Markdown to your clipboard instantly
- **Multi-Language** — Handles Chinese, English, Japanese, Korean, emoji, and other Unicode characters without corruption
- **Client-Side Only** — All conversion happens in the browser; your data never leaves your machine
- **Security Hardened** — Includes CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core Razor Pages (.NET 10) |
| Frontend | Bootstrap 5, vanilla JavaScript (ES modules) |
| Conversion Engine | [Turndown.js](https://github.com/mixmark-io/turndown) + [GFM plugin](https://github.com/laurent22/joplin-turndown-plugin-gfm) |
| Logging | [Serilog](https://serilog.net/) (file sink) |
| Testing | xUnit + Microsoft.AspNetCore.Mvc.Testing (C#), Vitest (JavaScript) |

## Getting Started

### Prerequisites

| Item | Version |
|------|---------|
| .NET SDK | 10.0+ |
| Node.js | 20+ *(for JS tests only)* |
| Browser | Chrome / Edge / Firefox / Safari (latest) |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/HyperLee/TextToMarkDown.git
cd TextToMarkDown

# Restore dependencies
dotnet restore TextToMarkDown/TextToMarkDown.csproj

# Run the application
dotnet run --project TextToMarkDown/TextToMarkDown.csproj
```

Open your browser at **https://localhost:7029** (or http://localhost:5076).

### Development Mode (Hot Reload)

```bash
dotnet watch run --project TextToMarkDown/TextToMarkDown.csproj
```

Changes to `.cshtml`, `.css`, and `.js` files are automatically reloaded.

## Usage

1. Open the web application in your browser.
2. **Paste** text into the *Input* area — the tool automatically detects whether the clipboard contains HTML rich text or plain text.
3. Click the **Convert to Markdown** button.
4. Review the Markdown output on the right panel.
5. Click **Copy** to copy the result to your clipboard.

> [!TIP]
> When copying from Word, Excel, or a web page, the browser clipboard usually includes HTML formatting. The tool will automatically pick up the rich text and convert styles like **bold**, *italic*, links, and tables into proper Markdown syntax.

> [!NOTE]
> The input area has a 100,000-character limit. For best performance, keep content under 10,000 characters.

## Project Structure

```
TextToMarkDown/
├── Program.cs                      # Entry point, Serilog & security config
├── TextToMarkDown.csproj           # Project file (.NET 10)
├── Pages/
│   ├── Index.cshtml                # Main converter page
│   ├── Index.cshtml.cs             # Page model
│   └── Shared/_Layout.cshtml       # Layout template
├── wwwroot/
│   ├── css/site.css                # Custom styles
│   ├── js/
│   │   ├── app-init.js             # Application bootstrap
│   │   ├── clipboard-handler.js    # Paste event & format detection
│   │   ├── markdown-converter.js   # Conversion engine (Turndown wrapper)
│   │   └── ui-controller.js        # UI interactions & alerts
│   └── lib/turndown/               # Turndown.js + GFM plugin
TextToMarkDown.Tests/
├── Unit/                           # Unit tests
└── Integration/                    # Integration tests (WebApplicationFactory)
```

## Testing

### C# Tests (xUnit)

```bash
# Run all tests
dotnet test

# Unit tests only
dotnet test --filter "Category=Unit"

# Integration tests only
dotnet test --filter "Category=Integration"
```

### JavaScript Tests (Vitest)

```bash
cd TextToMarkDown
npm install
npm test
```

## Configuration

| File | Purpose |
|------|---------|
| `appsettings.json` | Serilog logging configuration |
| `appsettings.Development.json` | Development-specific overrides |
| `launchSettings.json` | Kestrel URLs and environment settings |
