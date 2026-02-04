import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import { Todo } from '../types/todo';

const todos: Todo[] = [
  {
    id: '1',
    title: 'Test Todo 1',
    description: 'Description 1',
    status: 'Not Started',
    dueDate: '2025-06-10',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '2',
    title: 'Test Todo 2',
    description: 'Description 2',
    status: 'Completed',
    dueDate: '2025-06-11',
    createdAt: '',
    updatedAt: '',
  },
];

beforeAll(() => {
  global.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

describe('TodoList', () => {
  it('renders todo items', () => {
    render(<TodoList todos={todos} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<TodoList todos={todos} onEdit={handleEdit} onDelete={jest.fn()} />);
    const editButtons = screen.getAllByLabelText('Edit');
    fireEvent.click(editButtons[0]);
    expect(handleEdit).toHaveBeenCalledWith(todos[0]);
  });

  it('calls onDelete when delete button is clicked and confirmed', () => {
    const handleDelete = jest.fn().mockResolvedValue(undefined);
    window.confirm = jest.fn(() => true);
    render(<TodoList todos={todos} onEdit={jest.fn()} onDelete={handleDelete} />);
    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[1]);
    expect(window.confirm).toHaveBeenCalled();
    // onDeleteはasyncなのでsetTimeoutで待つ
    setTimeout(() => {
      expect(handleDelete).toHaveBeenCalledWith('2');
    }, 0);
  });

  it('calls onEdit when title is clicked', () => {
    const handleEdit = jest.fn();
    render(<TodoList todos={todos} onEdit={handleEdit} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Test Todo 1'));
    expect(handleEdit).toHaveBeenCalledWith(todos[0]);
  });

  it('shows tooltip content', async () => {
    render(<TodoList todos={todos} onEdit={jest.fn()} onDelete={jest.fn()} />);
    const title = screen.getByText('Test Todo 1');
    await userEvent.hover(title);
    expect(await screen.findByText(/Description:/)).toBeInTheDocument();
    expect(screen.getByText(/Description 1/)).toBeInTheDocument();
    expect(screen.getByText('Status: Not Started')).toBeInTheDocument();
    expect(screen.getByText('Due: 2025-06-10')).toBeInTheDocument();
  });
});
