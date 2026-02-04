import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from './Navbar';

jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>;
  Link.displayName = 'MockNextLink';
  return Link;
});

describe('Navbar', () => {
  it('renders Home and TODO List links', () => {
    render(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('TODO List')).toBeInTheDocument();
  });

  it('links have correct href', () => {
    render(<Navbar />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('TODO List').closest('a')).toHaveAttribute('href', '/todo');
  });
});
