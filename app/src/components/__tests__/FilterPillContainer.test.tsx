import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPillContainer from '../FilterPillContainer';

describe('FilterPillContainer', () => {
  const defaultProps = {
    sectionName: 'Test Section',
    options: [
      { text: 'Option 1', value: 'option1' },
      { text: 'Option 2', value: 'option2' },
      { text: 'Option 3', value: 'option3' },
    ],
    onSelectionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section name', () => {
    render(<FilterPillContainer {...defaultProps} />);
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('renders collapsed by default when defaultExpanded is false', () => {
    render(<FilterPillContainer {...defaultProps} />);
    
    // Section name should be visible
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    
    // Options should not be visible initially
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
  });

  it('renders expanded when defaultExpanded is true', () => {
    render(<FilterPillContainer {...defaultProps} defaultExpanded={true} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('toggles expansion when header is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterPillContainer {...defaultProps} />);
    
    // Initially collapsed
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    
    // Click to expand
    const header = screen.getByRole('button', { name: /expand section/i });
    await user.click(header);
    
    // Should now be expanded
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    
    // Click to collapse
    await user.click(header);
    
    // Should be collapsed again
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation for expansion toggle', async () => {
    const user = userEvent.setup();
    render(<FilterPillContainer {...defaultProps} />);
    
    const header = screen.getByRole('button', { name: /expand section/i });
    
    // Initially collapsed
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    
    // Press Enter to expand
    await user.keyboard('{Tab}');
    await user.keyboard('{Enter}');
    
    // Should now be expanded
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Press Space to collapse
    await user.keyboard(' ');
    
    // Should be collapsed again
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('handles single selection mode by default', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(
      <FilterPillContainer 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        defaultExpanded={true}
      />
    );
    
    // Click first option
    const option1 = screen.getByText('Option 1');
    await user.click(option1);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option1']);
    
    // Click second option
    const option2 = screen.getByText('Option 2');
    await user.click(option2);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option2']);
    
    // Click same option again to deselect
    await user.click(option2);
    
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('handles multiple selection mode', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(
      <FilterPillContainer 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        allowMultiple={true}
        defaultExpanded={true}
      />
    );
    
    // Click first option
    const option1 = screen.getByText('Option 1');
    await user.click(option1);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option1']);
    
    // Click second option (should add to selection)
    const option2 = screen.getByText('Option 2');
    await user.click(option2);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option1', 'option2']);
    
    // Click first option again (should remove from selection)
    await user.click(option1);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option2']);
  });

  it('exposes clearFilters method via ref', () => {
    const onSelectionChange = jest.fn();
    const ref = React.createRef<any>();
    
    render(
      <FilterPillContainer 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        ref={ref}
        defaultExpanded={true}
      />
    );
    
    // Select an option first
    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['option1']);
    
    // Clear filters using ref
    ref.current.clearFilters();
    
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('updates aria-label based on expansion state', () => {
    render(<FilterPillContainer {...defaultProps} />);
    
    // Initially collapsed
    expect(screen.getByLabelText('Expand section')).toBeInTheDocument();
    
    // Expand
    const header = screen.getByRole('button');
    fireEvent.click(header);
    
    // Should now show collapse label
    expect(screen.getByLabelText('Collapse section')).toBeInTheDocument();
  });

  it('applies correct CSS classes to expand/collapse icon', () => {
    render(<FilterPillContainer {...defaultProps} />);
    
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toHaveClass('w-4', 'h-4', 'transition-transform', 'duration-200', 'text-gray-500');
    
    // Initially not rotated
    expect(icon).not.toHaveClass('rotate-180');
    
    // Expand
    fireEvent.click(screen.getByRole('button'));
    
    // Should now be rotated
    expect(icon).toHaveClass('rotate-180');
  });

  it('does not call onSelectionChange when not provided', async () => {
    const user = userEvent.setup();
    const { onSelectionChange, ...propsWithoutCallback } = defaultProps;
    
    render(
      <FilterPillContainer 
        {...propsWithoutCallback}
        defaultExpanded={true}
      />
    );
    
    const option1 = screen.getByText('Option 1');
    await user.click(option1);
    
    // Should not throw any errors
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
}); 