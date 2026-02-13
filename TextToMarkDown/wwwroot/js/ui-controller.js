
export class UIController {
    static init() {
        this.inputText = document.getElementById('inputText');
        this.outputText = document.getElementById('outputText');
        this.convertBtn = document.getElementById('convertBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.charCount = document.getElementById('charCount');
        this.alertArea = document.getElementById('alertArea');

        if (this.convertBtn) {
            this.convertBtn.addEventListener('click', () => this.handleConvert());
        }

        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        if (this.inputText) {
            this.inputText.addEventListener('input', () => this.updateCharCount());
            this.inputText.addEventListener('paste', (e) => this.handlePaste(e));
        }
    }

    static handlePaste(e) {
        // Access global or imported handler
        const handler = window.ClipboardHandler || ClipboardHandler;
        if (!handler) return;

        const result = handler.processPasteEvent(e);
        if (result && result.data) {
            e.preventDefault();
            
            // Store the paste data including type (text or html) for convert
            this._lastPasteData = result;

            // For display in textarea, use plain text version
            const displayText = (result.type === 'html')
                ? (e.clipboardData.getData('text/plain') || result.data)
                : result.data;

            const start = this.inputText.selectionStart;
            const end = this.inputText.selectionEnd;
            const text = this.inputText.value;
            const newText = text.substring(0, start) + displayText + text.substring(end);
            this.inputText.value = newText;
            
            this.inputText.selectionStart = this.inputText.selectionEnd = start + displayText.length;
            this.updateCharCount();
        }
    }

    static handleConvert() {
        const text = this.inputText.value;
        
        // Validation (T022)
        if (!text || text.trim().length === 0) {
            this.showAlert('Please enter some text.', 'warning');
            return;
        }

        if (text.length > 100000) {
            this.showAlert('Text exceeds 100,000 characters limit.', 'danger');
            return;
        }

        this.showAlert('', 'none');

        const converter = window.MarkdownConverter || MarkdownConverter;
        if (converter) {
            // Use unified convert entry point if InputData is available, else default to plain text
            const inputData = this._lastPasteData || { type: 'text', data: text };
            // If the user typed manually (no paste), always use plain text
            if (!this._lastPasteData) {
                inputData.data = text;
            }
            const markdown = converter.convert ? converter.convert(inputData) : converter.convertPlainText(text);
            this.outputText.value = markdown;
        }
    }

    static updateCharCount() {
        // Use spread syntax or Array.from to correctly count surrogate pairs (emojis) as single characters
        const text = this.inputText.value || '';
        const length = [...text].length;
        
        if (this.charCount) {
            this.charCount.textContent = `${length.toLocaleString()} / 100,000`;
            if (length > 100000) {
                this.charCount.classList.add('text-danger');
            } else {
                this.charCount.classList.remove('text-danger');
            }
        }
    }

    static async copyToClipboard() {
        if (!this.outputText || !navigator.clipboard || !navigator.clipboard.writeText) {
            this.showAlert('Clipboard API is not available in this browser.', 'danger');
            return;
        }

        const output = this.outputText.value;
        if (!output || output.trim().length === 0) {
            this.showAlert('No markdown content to copy.', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            this.showAlert('Markdown copied to clipboard.', 'success');
        } catch (error) {
            this.showAlert('Failed to copy markdown to clipboard.', 'danger');
        }
    }

    static showAlert(message, type) {
        if (!this.alertArea) return;

        if (type === 'none' || !message) {
            this.alertArea.innerHTML = '';
            return;
        }

        const validTypes = ['success', 'warning', 'danger', 'info'];
        const alertType = validTypes.includes(type) ? type : 'info';
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${alertType} alert-dismissible fade show" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');

        this.alertArea.innerHTML = '';
        this.alertArea.append(wrapper);

        setTimeout(() => {
            const alertElement = this.alertArea.querySelector('.alert');
            if (alertElement) {
                alertElement.remove();
            }
        }, 3000);
    }
}

if (typeof window !== 'undefined') {
    window.UIController = UIController;
}
