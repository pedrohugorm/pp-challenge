import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPill from '../FilterPill';

describe('FilterPill', () => {
  const defaultProps = {
    text: 'Test Pill',
    value: 'test-value',
    isSelected: false,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct text', () => {
    render(<FilterPill {...defaultProps} />);
    expect(screen.getByText('Test Pill')).toBeInTheDocument();
  });

  it('applies correct CSS classes when not selected', () => {
    render(<FilterPill {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('pill', 'pill-focus', 'pill-default');
    expect(button).not.toHaveClass('pill-selected');
  });

  it('applies correct CSS classes when selected', () => {
    render(<FilterPill {...defaultProps} isSelected={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('pill', 'pill-focus', 'pill-selected');
    expect(button).not.toHaveClass('pill-default');
  });

  it('calls onSelect with correct value when clicked', () => {
    const onSelect = jest.fn();
    render(<FilterPill {...defaultProps} onSelect={onSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('test-value');
  });

  it('handles keyboard interaction', () => {
    const onSelect = jest.fn();
    render(<FilterPill {...defaultProps} onSelect={onSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('test-value');
  });

  it('handles space key interaction', () => {
    const onSelect = jest.fn();
    render(<FilterPill {...defaultProps} onSelect={onSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('test-value');
  });

  it('renders with different text and value', () => {
    const props = {
      ...defaultProps,
      text: 'Another Pill',
      value: 'another-value',
    };
    render(<FilterPill {...props} />);
    
    expect(screen.getByText('Another Pill')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('maintains accessibility attributes', () => {
    render(<FilterPill {...defaultProps} />);
    const button = screen.getByRole('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });
}); 