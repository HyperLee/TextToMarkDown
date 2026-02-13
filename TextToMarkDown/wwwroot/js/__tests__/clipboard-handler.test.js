import { describe, it, expect } from 'vitest';
import { ClipboardHandler } from '../clipboard-handler.js';

describe('ClipboardHandler', () => {
    it('should detect text/plain', () => {
        // Mock ClipboardEvent
        const mockEvent = {
            clipboardData: {
                types: ['text/plain'],
                getData: (type) => type === 'text/plain' ? 'Simple text' : null
            },
            preventDefault: () => {}
        };

        const result = ClipboardHandler.processPasteEvent(mockEvent);
        expect(result.type).toBe('text');
        expect(result.data).toBe('Simple text');
    });

    it('should create correct InputData object', () => {
         const mockEvent = {
            clipboardData: {
                types: ['text/plain'],
                getData: (type) => type === 'text/plain' ? 'Test' : ''
            },
            preventDefault: () => {}
        };
        const result = ClipboardHandler.processPasteEvent(mockEvent);
        expect(result).toEqual({
            type: 'text',
            data: 'Test'
        });
    });

    it('should detect text/html and set type to html', () => {
        const mockEvent = {
            clipboardData: {
                types: ['text/html', 'text/plain'],
                getData: (type) => {
                    if (type === 'text/html') return '<strong>Bold</strong>';
                    if (type === 'text/plain') return 'Bold';
                    return '';
                }
            },
            preventDefault: () => {}
        };

        const result = ClipboardHandler.processPasteEvent(mockEvent);
        expect(result.type).toBe('html');
        expect(result.data).toBe('<strong>Bold</strong>');
    });

    it('should prefer text/html over text/plain', () => {
        const mockEvent = {
            clipboardData: {
                types: ['text/html', 'text/plain'],
                getData: (type) => {
                    if (type === 'text/html') return '<p>Paragraph</p>';
                    if (type === 'text/plain') return 'Paragraph';
                    return '';
                }
            },
            preventDefault: () => {}
        };

        const result = ClipboardHandler.processPasteEvent(mockEvent);
        expect(result.type).toBe('html');
        expect(result.data).toBe('<p>Paragraph</p>');
    });
});
