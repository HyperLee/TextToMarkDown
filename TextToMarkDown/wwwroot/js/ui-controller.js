
export class UIController {
    static init() {
        this.inputText = document.getElementById('inputText');
        this.outputText = document.getElementById('outputText');
        this.convertBtn = document.getElementById('convertBtn');
        this.charCount = document.getElementById('charCount');
        this.alertArea = document.getElementById('alertArea');

        if (this.convertBtn) {
            this.convertBtn.addEventListener('click', () => this.handleConvert());
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
            
            const start = this.inputText.selectionStart;
            const end = this.inputText.selectionEnd;
            const text = this.inputText.value;
            const newText = text.substring(0, start) + result.data + text.substring(end);
            this.inputText.value = newText;
            
            this.inputText.selectionStart = this.inputText.selectionEnd = start + result.data.length;
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
            const markdown = converter.convertPlainText(text);
            this.outputText.value = markdown;
        }
    }

    static updateCharCount() {
        const length = this.inputText.value.length;
        if (this.charCount) {
            this.charCount.textContent = `${length.toLocaleString()} / 100,000`;
            if (length > 100000) {
                this.charCount.classList.add('text-danger');
            } else {
                this.charCount.classList.remove('text-danger');
            }
        }
    }

    static showAlert(message, type) {
        if (!this.alertArea) return;

        if (type === 'none' || !message) {
            this.alertArea.innerHTML = '';
            return;
        }
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');

        this.alertArea.innerHTML = '';
        this.alertArea.append(wrapper);
    }
}

if (typeof window !== 'undefined') {
    window.UIController = UIController;
}
