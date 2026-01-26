import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotionEditor from '@/components/NotionEditor';
import '@testing-library/jest-dom';

// Mock the BlockNote dependencies which are heavy and require Canvas
jest.mock('@blocknote/react', () => ({
  useCreateBlockNote: jest.fn(() => ({
    document: [],
    tryParseMarkdownToBlocks: jest.fn().mockResolvedValue([]),
    replaceBlocks: jest.fn(),
    blocksToMarkdownLossy: jest.fn().mockResolvedValue('**Mock Markdown Content**'),
    focus: jest.fn(),
  })),
}));

jest.mock('@blocknote/mantine', () => ({
  BlockNoteView: ({ onChange }: { onChange: (() => void) | undefined }) => (
    <div data-testid="blocknote-view">
      <textarea 
        data-testid="mock-editor-input"
        onChange={() => onChange && onChange()} 
      />
    </div>
  ),
}));

describe('NotionEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with given value', () => {
    render(
      <NotionEditor 
        value="Initial Content" 
        onChange={mockOnChange} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByText('Memo')).toBeInTheDocument();
    expect(screen.getByTestId('blocknote-view')).toBeInTheDocument();
  });

  it('calls onChange when content changes', async () => {
    render(
      <NotionEditor 
        value="" 
        onChange={mockOnChange} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const input = screen.getByTestId('mock-editor-input');
    
    // Simulate typing triggering onChange of BlockNoteView
    fireEvent.change(input, { target: { value: 'New Content' } });

    // The mock blocksToMarkdownLossy returns '**Mock Markdown Content**'
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('**Mock Markdown Content**');
    });
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <NotionEditor 
        value="Valid Content" 
        onChange={mockOnChange} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Finding the specific save button can be tricky with icons, let's look by text if possible or class
    const saveButton = screen.getByText('Save Note').closest('button');
    
    // Ensure button is not disabled
    expect(saveButton).not.toBeDisabled();
    
    fireEvent.click(saveButton!);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('disables save button when content is empty', () => {
    render(
      <NotionEditor 
        value="" 
        onChange={mockOnChange} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const saveButton = screen.getByText('Save Note').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('renders in compact mode', () => {
     render(
      <NotionEditor 
        value="" 
        onChange={mockOnChange} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        compact={true} 
      />
    );
    
    // In compact mode, we don't show the "Memo" header
    expect(screen.queryByText('Memo')).not.toBeInTheDocument();
    // We expect "Notion-Style" footer text
    expect(screen.getByText('Notion-Style')).toBeInTheDocument();
  });
});
