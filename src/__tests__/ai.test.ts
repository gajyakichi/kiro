// Mock dependencies
jest.mock('fs');
jest.mock('path', () => ({
  join: jest.fn(() => '/mock/.ai-cache.json'),
}));

// Mock crypto
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('mock-hash-key'),
}));

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });
});

// Mock console
global.console.error = jest.fn();
global.console.log = jest.fn();
global.console.warn = jest.fn();

// Import AFTER mocking modules
import fs from 'fs';
import { suggestTasks, generateDailySummary, checkTaskCompletion } from '@/lib/ai';

describe('AI Module', () => {
  const context = "User added feature A";
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key' };
    
    // Default fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateDailySummary', () => {
     it('returns parsed summary for successful JSON response', async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ en: 'Summary EN', ja: 'Summary JA' }) } }]
        });
        
        const result = await generateDailySummary(context);
        expect(result).toEqual({ en: 'Summary EN', ja: 'Summary JA' });
     });

     it('handles JSON embedded in markdown', async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: "Here is the JSON:\n```json\n" + JSON.stringify({ en: 'Summary EN', ja: 'Summary JA' }) + "\n```" } }]
        });
        
        const result = await generateDailySummary(context);
        expect(result).toEqual({ en: 'Summary EN', ja: 'Summary JA' });
     });

     it('falls back to raw content on JSON parse failure', async () => {
        const raw = "Just raw text summary";
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: raw } }]
        });
        
        const result = await generateDailySummary(context);
        expect(result).toEqual({ en: raw, ja: raw });
     });

     it('returns error message on exception', async () => {
        mockCreate.mockRejectedValueOnce(new Error('API Error'));
        const result = await generateDailySummary(context);
        expect(result.en).toContain('AI Summary unavailable');
     });
  });

  describe('suggestTasks', () => {
      it('returns tasks array from JSON', async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify(['Task 1', 'Task 2']) } }]
        });
        
        const tasks = await suggestTasks(context, 'en');
        expect(tasks).toEqual(['Task 1', 'Task 2']);
      });

      it('falls back to line splitting', async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: "- Task A\n- Task B" } }]
        });
        
        const tasks = await suggestTasks(context, 'en');
        expect(tasks).toEqual(['Task A', 'Task B']);
      });
      
      it('returns empty array on error', async () => {
          mockCreate.mockRejectedValueOnce(new Error('Fail'));
          const tasks = await suggestTasks(context);
          expect(tasks).toEqual([]);
      });
  });

  describe('checkTaskCompletion', () => {
      it('returns completed IDs', async () => {
          mockCreate.mockResolvedValueOnce({
              choices: [{ message: { content: JSON.stringify({ completed_ids: [101] }) } }]
          });
          
          const result = await checkTaskCompletion(context, [{ id: 101, task: 'Do X' }]);
          expect(result).toEqual([101]);
      });

      it('returns empty array if format invalid', async () => {
          mockCreate.mockResolvedValueOnce({
              choices: [{ message: { content: "Invalid JSON" } }]
          });
          
          const result = await checkTaskCompletion(context, [{ id: 101, task: 'Do X' }]);
          expect(result).toEqual([]);
      });
  });

  describe('Caching & Providers', () => {
      it('uses cached content if available', async () => {
          // Setup cache hit
          (fs.existsSync as jest.Mock).mockReturnValue(true);
          (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
              'mock-hash-key': { content: JSON.stringify(['Cached Task']), timestamp: Date.now(), latencyMs: 10 }
          }));

          const tasks = await suggestTasks(context);
          expect(tasks).toEqual(['Cached Task']);
          expect(mockCreate).not.toHaveBeenCalled(); // Should assume hit implies no API call if logic strictly checks cache first
      });

      it('writes to cache after successful call', async () => {
          mockCreate.mockResolvedValueOnce({
              choices: [{ message: { content: JSON.stringify(['New Task']) } }]
          });
          
          await suggestTasks(context);
          expect(fs.writeFileSync).toHaveBeenCalled();
      });
  });
});
