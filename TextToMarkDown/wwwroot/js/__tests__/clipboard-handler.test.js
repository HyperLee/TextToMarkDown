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
                getData: (type) => 'Test'
            },
            preventDefault: () => {}
        };
        const result = ClipboardHandler.processPasteEvent(mockEvent);
        expect(result).toEqual({
            type: 'text',
            data: 'Test'
        });
    });
});
