// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(() => '/mock/.ai-cache.json'),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: "Task 1\nTask 2\nTask 3"
                }
              }
            ]
          })
        }
      }
    };
  });
});

// Mock console.error to keep test output clean
global.console.error = jest.fn();
// Mock console.log
global.console.log = jest.fn();

// Import AFTER mocking modules
import { suggestTasks } from '@/lib/ai';

describe('AI Suggestions', () => {
  const context = "User added feature A";
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('suggests tasks in English by default', async () => {
    const tasks = await suggestTasks(context, 'en');
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toBe('Task 1');
  });
});
