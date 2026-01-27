import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/dynamic', () => () => {
  const MockComponent = () => <div>Mocked Component</div>;
  MockComponent.displayName = 'MockedComponent';
  return MockComponent;
});

jest.mock('@/components/ThemeLab', () => ({
  ThemeLab: () => <div>ThemeLab Mock</div>
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localization
jest.mock('@/lib/i18n', () => ({
  getTranslation: () => ({
    absorb_context: 'Absorb Context',
    absorbing: 'Absorbing...',
    ai_suggestions: 'AI Task Suggestions',
    vault_required: 'Storage Vault Required',
    days_short: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    // Add other necessary keys with dummy values
    workspace: 'Workspace',
    loading_progress: 'Loading...',
    system_calendar: 'System Calendar',
    activity_level: '{count} contributions',
  })
}));

describe('AI Suggestion UI E2E', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    
    // Default mocks for page load
    mockFetch.mockImplementation((url) => {
      const json = (data: unknown) => Promise.resolve(data);
      
      if (url === '/api/settings') return Promise.resolve({ ok: true, json: () => json({}) });
      if (url === '/api/vaults') return Promise.resolve({ ok: true, json: () => json([{ id: 'v1', active: true, path: '/tmp', name: 'Default Vault' }]) });
      if (url === '/api/projects') return Promise.resolve({ ok: true, json: () => json([{ id: 1, name: 'Test Project', icon: 'test' }]) });
      if (url === '/api/themes') return Promise.resolve({ ok: true, json: () => json([]) });
      if (url === '/api/sync' || url.includes('/api/sync')) return Promise.resolve({ ok: true, json: () => json([]) });
      if (url === '/api/progress') return Promise.resolve({ ok: true, json: () => json({}) });
      if (url === '/api/comments' || url.includes('/api/comments')) return Promise.resolve({ ok: true, json: () => json([]) });
      if (url.includes('/api/absorb/data')) return Promise.resolve({ ok: true, json: () => json({ suggestedTasks: [] }) });
      
      return Promise.resolve({ ok: true, json: () => json({}) });
    });
  });

  it('handles API error during Absorb', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<Home />);

    // Wait for project to load
    await screen.findByText('Workspace', {}, { timeout: 3000 });

    // Mock Absorb Failure for the next call
    mockFetch.mockImplementation(async (url) => {
       if (url === '/api/absorb') {
           return Promise.resolve({ 
               ok: false, 
               status: 500, 
               statusText: 'Internal Server Error' 
           });
       }
       // Keep other mocks working as page might re-fetch
       const json = (data: unknown) => Promise.resolve(data);
       if (url === '/api/settings') return Promise.resolve({ ok: true, json: () => json({}) });
       if (url === '/api/vaults') return Promise.resolve({ ok: true, json: () => json([{ id: 'v1', active: true, path: '/tmp', name: 'Default Vault' }]) });
       if (url === '/api/projects') return Promise.resolve({ ok: true, json: () => json([{ id: 1, name: 'Test Project' }]) });
       if (url.includes('/api/absorb/data')) return Promise.resolve({ ok: true, json: () => json({ suggestedTasks: [] }) });
       return Promise.resolve({ ok: true, json: () => json({}) });
    });

    // Find and Click Absorb Button
    const absorbButton = await screen.findByText('Absorb Context');
    fireEvent.click(absorbButton);

    // Expect loading state
    expect(await screen.findByText('Absorbing...')).toBeInTheDocument();

    // Expect Error Feedback
    await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to absorb context.');
    });

    alertSpy.mockRestore();
  });
});
