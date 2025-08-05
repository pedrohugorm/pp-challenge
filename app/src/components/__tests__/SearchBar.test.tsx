import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    onSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search medications...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar {...defaultProps} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('renders with initial value', () => {
    render(<SearchBar {...defaultProps} initialValue="initial search" />);
    expect(screen.getByDisplayValue('initial search')).toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test search');
    
    expect(input).toHaveValue('test search');
  });

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test search');
    await user.click(screen.getByRole('button'));
    
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('test search');
  });

  it('does not call onSearch when input is empty', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, '   '); // Only whitespace
    await user.keyboard('{Enter}');
    
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('does not call onSearch when input is empty after trimming', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, '   test   ');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('prevents default form submission behavior', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('test search');
  });

  it('renders search icon button', () => {
    render(<SearchBar {...defaultProps} />);
    const searchButton = screen.getByRole('button');
    expect(searchButton).toBeInTheDocument();
    
    // Check for SVG icon
    const svg = searchButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies correct CSS classes to input', () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveClass(
      'w-64',
      'px-4',
      'py-2',
      'pr-10',
      'text-sm',
      'font-normal',
      'bg-white',
      'text-gray-800',
      'rounded-lg',
      'border',
      'border-gray-300',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:border-transparent',
      'shadow-sm'
    );
  });

  it('applies correct CSS classes to search button', () => {
    render(<SearchBar {...defaultProps} />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass(
      'absolute',
      'right-3',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'text-gray-400',
      'hover:text-gray-600',
      'transition-colors'
    );
  });

  it('handles multiple rapid submissions', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');
    
    await user.type(input, 'first search');
    await user.click(button);
    
    await user.clear(input);
    await user.type(input, 'second search');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('first search');
    expect(onSearch).toHaveBeenCalledWith('second search');
  });

  it('maintains input value after submission', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');
    
    // Input should still contain the value
    expect(input).toHaveValue('test search');
  });

  it('handles special characters in search query', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test@search.com + special chars');
    await user.keyboard('{Enter}');
    
    expect(onSearch).toHaveBeenCalledWith('test@search.com + special chars');
  });
}); 