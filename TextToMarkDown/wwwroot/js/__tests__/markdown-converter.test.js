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
});
