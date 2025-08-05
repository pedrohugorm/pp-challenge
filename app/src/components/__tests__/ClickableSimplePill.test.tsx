import React from 'react';
import { render, screen } from '@testing-library/react';
import ClickableSimplePill from '../ClickableSimplePill';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, className, title }: any) {
    return (
      <a href={href} className={className} title={title}>
        {children}
      </a>
    );
  };
});

describe('ClickableSimplePill', () => {
  const defaultProps = {
    text: 'Test Pill',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct text', () => {
    render(<ClickableSimplePill {...defaultProps} />);
    expect(screen.getByText('Test Pill')).toBeInTheDocument();
  });

  it('renders as a div when no category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} />);
    const element = screen.getByText('Test Pill');
    expect(element.tagName).toBe('DIV');
  });

  it('applies default CSS classes when no category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer');
  });

  it('applies custom CSS classes when provided', () => {
    render(<ClickableSimplePill {...defaultProps} className="custom-class" />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'custom-class');
  });

  it('renders as a link when category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" />);
    const element = screen.getByText('Test Pill');
    expect(element.tagName).toBe('A');
  });

  it('generates correct filter URL when category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?filter_medication=Test+Pill');
  });

  it('generates correct filter URL with special characters', () => {
    render(<ClickableSimplePill text="Test & Pill" category="medication" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?filter_medication=Test+%26+Pill');
  });

  it('applies correct CSS classes when category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer');
  });

  it('applies custom CSS classes when category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" className="custom-class" />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'custom-class');
  });

  it('sets correct title attribute when category is provided', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('title', 'Filter by Test Pill');
  });



  it('handles text with spaces', () => {
    render(<ClickableSimplePill text="Test Pill With Spaces" category="medication" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?filter_medication=Test+Pill+With+Spaces');
  });

  it('handles different category names', () => {
    render(<ClickableSimplePill {...defaultProps} category="dosage" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?filter_dosage=Test+Pill');
  });

  it('handles category with special characters', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication-type" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/?filter_medication-type=Test+Pill');
  });

  it('combines custom className with default classes', () => {
    render(<ClickableSimplePill {...defaultProps} className="my-custom-class" />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'my-custom-class');
  });

  it('handles multiple custom classes', () => {
    render(<ClickableSimplePill {...defaultProps} className="class1 class2" />);
    const element = screen.getByText('Test Pill');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'class1', 'class2');
  });

  it('renders without category and custom className', () => {
    render(<ClickableSimplePill {...defaultProps} className="custom-class" />);
    const element = screen.getByText('Test Pill');
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'custom-class');
  });

  it('renders with category and custom className', () => {
    render(<ClickableSimplePill {...defaultProps} category="medication" className="custom-class" />);
    const element = screen.getByText('Test Pill');
    expect(element.tagName).toBe('A');
    expect(element).toHaveClass('pill', 'pill-default', 'cursor-pointer', 'custom-class');
  });
}); 