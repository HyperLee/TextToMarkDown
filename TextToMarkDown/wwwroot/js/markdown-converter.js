
// Attempt to load TurndownService and GFM plugin for Node/test environments
let _TurndownService = null;
let _turndownPluginGfm = null;

if (typeof TurndownService !== 'undefined') {
    _TurndownService = TurndownService;
}

if (typeof turndownPluginGfm !== 'undefined') {
    _turndownPluginGfm = turndownPluginGfm;
}

// Node/Bun environment: load from npm packages for testing
if (!_TurndownService) {
    try {
        const mod = await import('turndown');
        _TurndownService = mod.default || mod;
    } catch (e) { /* browser-only */ }
}

if (!_turndownPluginGfm) {
    try {
        const mod = await import('@joplin/turndown-plugin-gfm');
        _turndownPluginGfm = mod;
    } catch (e) { /* browser-only */ }
}

export class MarkdownConverter {
    static _turndownInstance = null;
    static _mermaidKeywords = [
        'graph',
        'flowchart',
        'sequenceDiagram',
        'classDiagram',
        'stateDiagram',
        'erDiagram',
        'journey',
        'gantt',
        'pie',
        'gitgraph',
        'mindmap',
        'timeline',
        'quadrantChart',
        'sankey',
        'xychart'
    ];

    static init() {
        this._turndownInstance = this._createTurndownInstance();
    }

    static _createTurndownInstance() {
        const TDS = (typeof TurndownService !== 'undefined') ? TurndownService : _TurndownService;
        if (!TDS) return null;

        const service = new TDS({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            emDelimiter: '*',
            strongDelimiter: '**',
            hr: '---'
        });

        // Load GFM plugin for tables, strikethrough, task lists (T034)
        const gfmPlugin = (typeof turndownPluginGfm !== 'undefined') ? turndownPluginGfm : _turndownPluginGfm;
        if (gfmPlugin && gfmPlugin.gfm) {
            service.use(gfmPlugin.gfm);
        }

        // Custom rule: Headings H1-H6 (T031 / FR-005)
        service.addRule('headings', {
            filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            replacement: function (content, node) {
                const level = Number(node.nodeName.charAt(1));
                const prefix = '#'.repeat(level);
                return '\n\n' + prefix + ' ' + content.trim() + '\n\n';
            }
        });

        // Custom rule: Links (T031 / FR-007)
        service.addRule('links', {
            filter: function (node) {
                return node.nodeName === 'A' && node.getAttribute('href');
            },
            replacement: function (content, node) {
                const href = node.getAttribute('href');
                const title = node.title ? ' "' + node.title + '"' : '';
                return '[' + content + '](' + href + title + ')';
            }
        });

        // Custom rule: Images with placeholder (T031 / FR-008)
        service.addRule('images', {
            filter: 'img',
            replacement: function (content, node) {
                const alt = node.getAttribute('alt') || 'image';
                const src = node.getAttribute('src') || '';
                const title = node.title ? ' "' + node.title + '"' : '';
                return '![' + alt + '](' + src + title + ')';
            }
        });

        // Custom rule: Bold / Strong (T032 / FR-009)
        service.addRule('bold', {
            filter: ['strong', 'b'],
            replacement: function (content) {
                if (!content.trim()) return content;
                return '**' + content + '**';
            }
        });

        // Custom rule: Italic / Emphasis (T032 / FR-009)
        service.addRule('italic', {
            filter: ['em', 'i'],
            replacement: function (content) {
                if (!content.trim()) return content;
                return '*' + content + '*';
            }
        });

        // Custom rule: Code blocks (T032 / FR-012)
        service.addRule('codeBlocks', {
            filter: function (node) {
                return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
            },
            replacement: function (content, node) {
                const codeNode = node.firstChild;
                const language = (codeNode.getAttribute('class') || '').replace(/^language-/, '');
                const code = codeNode.textContent || '';
                return '\n\n```' + language + '\n' + code + '\n```\n\n';
            }
        });

        // Custom rule: Blockquote (T051 / FR-019)
        service.addRule('blockquote', {
            filter: 'blockquote',
            replacement: function (content) {
                const lines = content.replace(/^\n+|\n+$/g, '').split('\n');
                const quoted = lines.map(function (line) {
                    return '> ' + line;
                }).join('\n');
                return '\n\n' + quoted + '\n\n';
            }
        });

        // Custom rule: Horizontal rule (T051 / FR-020)
        service.addRule('horizontalRule', {
            filter: 'hr',
            replacement: function () {
                return '\n\n---\n\n';
            }
        });

        return service;
    }

    static _getTurndownInstance() {
        if (!this._turndownInstance) {
            this._turndownInstance = this._createTurndownInstance();
        }
        return this._turndownInstance;
    }

    /**
     * Convert HTML content to Markdown (T030)
     * @param {string} html - HTML markup string
     * @returns {string} Markdown formatted string
     */
    static convertHtml(html) {
        if (!html) return '';

        const service = this._getTurndownInstance();
        if (!service) return html; // Fallback if Turndown unavailable

        const markdown = service.turndown(html).trim();
        const wrappedMarkdown = this.wrapMermaidCodeFences(markdown);
        return this.wrapMermaidBlocks(wrappedMarkdown).trim();
    }

    static convertPlainText(text) {
        if (!text) return '';

        const wrapped = this.wrapMermaidBlocks(text);
        const segments = wrapped.split(/(```mermaid[\s\S]*?```)/g);
        return segments.map((segment, index) => {
            // Keep Mermaid fenced blocks untouched
            if (index % 2 === 1) {
                return segment;
            }

            return this.convertPlainTextCore(segment);
        }).join('');
    }

    static convertPlainTextCore(text) {
        if (!text) return '';

        const lines = text.split(/\r?\n/);
        const output = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Empty line -> Keep it
            if (line.trim() === '') {
                output.push('');
                continue;
            }

            // List detection (unordered)
            // Matches "- item", "* item", "• item", "‧ item"
            const listMatch = line.match(/^(\s*)([-*•‧])\s+(.*)$/);
            if (listMatch) {
                const indent = listMatch[1];
                let marker = listMatch[2];
                const content = listMatch[3];

                // Normalize bullets to hyphen
                if (marker === '•' || marker === '‧') {
                    marker = '-';
                }

                // Escape content only
                const escapedContent = this.escapeMarkdown(content);
                output.push(`${indent}${marker} ${escapedContent}`);
                continue;
            }

            // Normal text -> Escape and preserve
            output.push(this.escapeMarkdown(line));
        }

        return output.join('\n');
    }

    static wrapMermaidBlocks(text) {
        if (!text) return '';

        const parts = text.split(/(\r?\n\s*\r?\n+)/);
        return parts.map((part, index) => {
            // Preserve separators
            if (index % 2 === 1) {
                return part;
            }

            const trimmed = part.trim();
            if (!trimmed) return part;
            if (this.isMermaidFencedBlock(trimmed)) return trimmed;
            if (!this.isMermaidSyntax(trimmed)) return part;

            return `\`\`\`mermaid\n${trimmed}\n\`\`\``;
        }).join('');
    }

    static wrapMermaidCodeFences(markdown) {
        if (!markdown) return '';

        return markdown.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, language, code) => {
            const normalizedLang = (language || '').trim().toLowerCase();
            if (normalizedLang === 'mermaid') return match;
            if (normalizedLang !== '') return match;
            if (!this.isMermaidSyntax(code.trim())) return match;

            return `\`\`\`mermaid\n${code.replace(/\n+$/g, '')}\n\`\`\``;
        });
    }

    static isMermaidSyntax(text) {
        const regex = new RegExp(`^\\s*(?:${this._mermaidKeywords.join('|')})\\b`, 'i');
        return regex.test((text || '').trim());
    }

    static isMermaidFencedBlock(text) {
        return /^```mermaid[\s\S]*```$/i.test((text || '').trim());
    }

    /**
     * Detect whether the input text is already in Markdown format (T042).
     * Returns true if multiple Markdown syntax patterns are found,
     * indicating the content should be kept as-is to avoid double conversion.
     * @param {string} text - Input text to check
     * @returns {boolean} True if input appears to already be Markdown
     */
    static isAlreadyMarkdown(text) {
        if (!text || typeof text !== 'string') return false;

        const patterns = [
            /^#{1,6}\s+\S/m,                       // ATX headings
            /\[.+?\]\(.+?\)/,                       // Links [text](url)
            /!\[.*?\]\(.+?\)/,                      // Images ![alt](url)
            /(\*\*|__).+?\1/,                       // Bold
            /(\*|_)(?!\1).+?\1/,                    // Italic (but not bold)
            /^>\s+/m,                               // Blockquotes
            /^```[\s\S]*?```/m,                     // Fenced code blocks
            /`[^`]+`/,                              // Inline code
            /^-{3,}$/m,                             // Horizontal rules
            /^\s*[-*+]\s+\S/m,                      // Unordered lists
            /^\s*\d+\.\s+\S/m,                      // Ordered lists
            /\|.*\|.*\|/                            // Tables
        ];

        let matchCount = 0;
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                matchCount++;
            }
            if (matchCount >= 2) return true;
        }
        return false;
    }

    /**
     * Unified conversion entry point (T033)
     * Automatically selects convertHtml or convertPlainText based on InputData.type.
     * If the input is detected as already-Markdown, it is returned as-is (T042).
     * @param {object} inputData - InputData object with type and data properties
     * @returns {string} Markdown formatted string
     */
    static convert(inputData) {
        if (!inputData || !inputData.data) return '';

        // T042: Skip conversion if input already appears to be Markdown
        if (inputData.type === 'text' && this.isAlreadyMarkdown(inputData.data)) {
            return inputData.data;
        }

        if (inputData.type === 'html') {
            return this.convertHtml(inputData.data);
        }

        return this.convertPlainText(inputData.data);
    }

    static escapeMarkdown(text) {
        // Escape: \ ` * _ { } [ ] ( ) # + - . !
        // Note: We don't want to escape everything blindly if we want some smarts, 
        // but for "Plain Text" to "Markdown" where we only detect Lists/Paragraphs, 
        // we should escape potential formatting chars to avoid accidental formatting.
        // Exception: logic above handles lists.
        
        return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
    }
}

if (typeof window !== 'undefined') {
    window.MarkdownConverter = MarkdownConverter;
}
