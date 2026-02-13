import { describe, it, expect } from 'vitest';
import { MarkdownConverter } from '../markdown-converter.js';

describe('MarkdownConverter', () => {
    describe('convertPlainText', () => {
        it('should retain paragraphs', () => {
            const input = "Paragraph 1\n\nParagraph 2";
            const output = MarkdownConverter.convertPlainText(input);
            expect(output).toContain("Paragraph 1");
            expect(output).toContain("Paragraph 2");
            // Expect proper separation
            expect(output).toMatch(/Paragraph 1(\r?\n){2,}Paragraph 2/);
        });

        it('should detect unordered lists', () => {
            const input = "- Item 1\n- Item 2";
            const output = MarkdownConverter.convertPlainText(input);
            // Should likely keep it as list or ensure it's formatted as MD
            expect(output).toContain("- Item 1");
            expect(output).toContain("- Item 2");
        });

        it('should escape special markdown characters in normal text', () => {
            // If user types *bold* in plain text, do we want it to be bold in MD or literal *bold*?
            // "Special char escaping" implies we want literal.
            const input = "This is *not bold*";
            const output = MarkdownConverter.convertPlainText(input);
            expect(output).toBe("This is \\*not bold\\*");
        });
        
        it('should handle whitespace', () => {
            const input = "  Trimmed  ";
            const output = MarkdownConverter.convertPlainText(input);
            expect(output).toBe("Trimmed");
        });
    });

    describe('convertHtml', () => {
        it('should convert H1-H6 headings', () => {
            expect(MarkdownConverter.convertHtml('<h1>Title</h1>')).toContain('# Title');
            expect(MarkdownConverter.convertHtml('<h2>Subtitle</h2>')).toContain('## Subtitle');
            expect(MarkdownConverter.convertHtml('<h3>Section</h3>')).toContain('### Section');
            expect(MarkdownConverter.convertHtml('<h4>Sub</h4>')).toContain('#### Sub');
            expect(MarkdownConverter.convertHtml('<h5>Minor</h5>')).toContain('##### Minor');
            expect(MarkdownConverter.convertHtml('<h6>Smallest</h6>')).toContain('###### Smallest');
        });

        it('should convert bold and italic', () => {
            const boldResult = MarkdownConverter.convertHtml('<strong>bold text</strong>');
            expect(boldResult).toContain('**bold text**');

            const italicResult = MarkdownConverter.convertHtml('<em>italic text</em>');
            expect(italicResult).toContain('*italic text*');
        });

        it('should convert hyperlinks', () => {
            const result = MarkdownConverter.convertHtml('<a href="https://example.com">Example</a>');
            expect(result).toContain('[Example](https://example.com)');
        });

        it('should convert images', () => {
            const result = MarkdownConverter.convertHtml('<img src="https://example.com/img.png" alt="Alt text">');
            expect(result).toContain('![Alt text](https://example.com/img.png)');
        });

        it('should convert tables', () => {
            const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
            const result = MarkdownConverter.convertHtml(html);
            // GFM table plugin may add padding spaces; match flexibly
            expect(result).toMatch(/\|\s*A\s*\|\s*B\s*\|/);
            expect(result).toMatch(/\|\s*1\s*\|\s*2\s*\|/);
        });

        it('should convert blockquotes', () => {
            const result = MarkdownConverter.convertHtml('<blockquote>Quote text</blockquote>');
            expect(result).toContain('> Quote text');
        });

        it('should convert horizontal rules', () => {
            const result = MarkdownConverter.convertHtml('<hr>');
            expect(result).toContain('---');
        });

        it('should return empty string for empty input', () => {
            expect(MarkdownConverter.convertHtml('')).toBe('');
            expect(MarkdownConverter.convertHtml(null)).toBe('');
            expect(MarkdownConverter.convertHtml(undefined)).toBe('');
        });
    });
});
