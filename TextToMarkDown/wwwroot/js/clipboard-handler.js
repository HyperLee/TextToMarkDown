
export class ClipboardHandler {
    static processPasteEvent(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return null;

        let data = '';
        let type = 'text';

        // Check for text/html first (higher priority — rich content from web/Office)
        const htmlData = clipboardData.getData('text/html');
        if (htmlData) {
            data = htmlData;
            type = 'html';
        } else if (clipboardData.getData('text/plain')) {
            data = clipboardData.getData('text/plain');
            type = 'text';
        }

        return { type, data };
    }
}

if (typeof window !== 'undefined') {
    window.ClipboardHandler = ClipboardHandler;
}
