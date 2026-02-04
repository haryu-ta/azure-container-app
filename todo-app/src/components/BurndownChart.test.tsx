import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BurndownChart from './BurndownChart';

describe('BurndownChart', () => {
  it('renders placeholder text', () => {
    render(<BurndownChart />);
    expect(screen.getByTestId('burndown-chart-placeholder')).toHaveTextContent('Burndown Chart Coming Soon');
  });
});
