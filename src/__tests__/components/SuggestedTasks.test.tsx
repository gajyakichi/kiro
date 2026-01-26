import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedTasks from '@/components/SuggestedTasks';
import { SuggestedTask } from '@/lib/types';
import '@testing-library/jest-dom';

const mockTasks: SuggestedTask[] = [
  { id: 1, project_id: 1, task: 'Task 1', status: 'proposed', timestamp: '2023-01-01' },
  { id: 2, project_id: 1, task: 'Task 2', status: 'added', timestamp: '2023-01-02' },
  { id: 3, project_id: 1, task: 'Task 3', status: 'completed', timestamp: '2023-01-03' },
];

describe('SuggestedTasks', () => {
  const mockOnAdd = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockOnUpdateStatus = jest.fn();
  const mockOnManualAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Active Todo tab by default', () => {
    render(
      <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
        onUpdateStatus={mockOnUpdateStatus}
        onManualAdd={mockOnManualAdd}
      />
    );

    // Active Tab is "Active Todo", so we should see "Task 2" (added) and "Task 3" (completed)
    // "Task 1" is proposed via Suggestions tab
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  it('switches to Suggestions tab', () => {
    render(
      <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
      />
    );

    const suggestTab = screen.getByText('Suggestions');
    fireEvent.click(suggestTab);

    // Now we should see Task 1
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    // And not Task 2
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('calls onAdd when adding a specific suggestion', () => {
    render(
       <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
      />
    );

    fireEvent.click(screen.getByText('Suggestions'));
    
    // Find the add button (plus icon) for Task 1
    // The structure is task row -> internal button
    // We can look for title="Add to Todo"
    const addBtn = screen.getByTitle('Add to Todo');
    fireEvent.click(addBtn);

    expect(mockOnAdd).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls onDismiss when dismissing a suggestion', () => {
    render(
       <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
      />
    );

    fireEvent.click(screen.getByText('Suggestions'));

    const dismissBtn = screen.getByTitle('Dismiss');
    fireEvent.click(dismissBtn);

    expect(mockOnDismiss).toHaveBeenCalledWith(mockTasks[0]);
  });
  
  it('calls onManualAdd when submitting new task', () => {
    render(
      <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
        onManualAdd={mockOnManualAdd}
      />
    );

    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'New Manual Task' } });
    
    const addBtn = screen.getByText('Add', { selector: 'button' });
    fireEvent.click(addBtn);

    expect(mockOnManualAdd).toHaveBeenCalledWith('New Manual Task');
  });

  it('toggles completion status', () => {
      render(
      <SuggestedTasks 
        tasks={mockTasks} 
        onAdd={mockOnAdd} 
        onDismiss={mockOnDismiss} 
        onUpdateStatus={mockOnUpdateStatus}
      />
    );

    // Task 2 is 'added' (Active)
    const task2 = screen.getByText('Task 2');
    // The checkbox click area is the preceding sibling or parent wrapper behavior
    // The text and box are siblings in a flex row.
    // The onClick is bound to the icon div.
    // We can simulate click on the icon div?
    // Let's rely on finding the visual element or clicking the row implementation if applicable?
    // Implementation: onClick is on the icon div (1st child of row)
    
    // Using a bit of DOM navigation or label if possible. 
    // The icon does not have a label.
    // However, the component struct is `div > div(icon)`.
    
    // Let's use `unmount` or just click the closest check circle logic.
    // Actually the code: `onClick={() => (isTodo || isCompleted) && handleToggleComplete(task)}` 
    // is on the ICON CONTAINER.
    
    // Let's find via the parent row text match and get the first child.
    const row = task2.closest('.group');
    const iconContainer = row?.children[0];
    
    if (iconContainer) {
        fireEvent.click(iconContainer);
        // It should update status from 'added' to 'completed'
        expect(mockOnUpdateStatus).toHaveBeenCalledWith(mockTasks[1], 'completed');
    } else {
        throw new Error("Icon container not found");
    }
  });
});
