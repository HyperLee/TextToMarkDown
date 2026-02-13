
export class MarkdownConverter {
    static init() {
        // Any initialization logic if needed
    }

    static convertPlainText(text) {
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
            // Matches "- item" or "* item"
            const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
            if (listMatch) {
                const indent = listMatch[1];
                const marker = listMatch[2];
                const content = listMatch[3];
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
