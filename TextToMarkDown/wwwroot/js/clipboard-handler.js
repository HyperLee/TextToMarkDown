
export class ClipboardHandler {
    static processPasteEvent(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return null;

        let data = '';
        let type = 'text';

        // Check for text/plain
        // Note: 'types' can be a DOMStringList or Array depending on browser, 
        // but .includes works on Array. DOMStringList has .contains but standard is includes in modern.
        // Safer to use getData and check content.
        
        if (clipboardData.getData('text/plain')) {
             data = clipboardData.getData('text/plain');
             type = 'text';
        }

        return { type, data };
    }
}

if (typeof window !== 'undefined') {
    window.ClipboardHandler = ClipboardHandler;
}
