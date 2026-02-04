import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';
import { Todo } from '../types/todo';

jest.mock('react-big-calendar', () => {
  const actual = jest.requireActual('react-big-calendar');
  return {
    ...actual,
    Calendar: ({ events, components }: { events: unknown[]; components: { event?: (props: { event: unknown }) => React.ReactNode } }) => (
      <div data-testid="mock-calendar">
        {events.map((event, idx) =>
          components && components.event ? (
            <div key={idx} data-testid="event-wrapper">
              {components.event({ event })}
            </div>
          ) : (
            <div key={idx}>{(event as { title: string }).title}</div>
          )
        )}
      </div>
    ),
  };
});

describe('CalendarView', () => {
  const todos: Todo[] = [
    {
      id: '1',
      title: 'Test Todo',
      description: 'desc',
      status: 'Not Started',
      dueDate: '2025-06-10',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('カレンダーのタイトルが表示される', () => {
    render(<CalendarView todos={todos} onEdit={jest.fn()} />);
    expect(screen.getByText('カレンダー')).toBeInTheDocument();
  });

  it('TODOがカレンダーイベントとして表示される', () => {
    render(<CalendarView todos={todos} onEdit={jest.fn()} />);
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  it('イベントクリックでonEditが呼ばれる', () => {
    const handleEdit = jest.fn();
    render(<CalendarView todos={todos} onEdit={handleEdit} />);
    const event = screen.getByText('Test Todo');
    fireEvent.click(event);
    expect(handleEdit).toHaveBeenCalledWith(todos[0]);
  });
});
