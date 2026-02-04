import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoForm from './TodoForm';
import { Todo } from '../types/todo';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const baseTodo: Todo = {
  id: '',
  title: '',
  description: '',
  status: 'Not Started',
  dueDate: '',
  createdAt: '',
  updatedAt: '',
};

describe('TodoForm', () => {
  it('renders form fields with initial values', () => {
    render(<TodoForm todoData={baseTodo} onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
  });

  it('calls onSubmit with correct data for new todo', () => {
    const handleSubmit = jest.fn();
    render(<TodoForm todoData={baseTodo} onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc' } });
    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'In Progress' } });
    fireEvent.change(screen.getByLabelText(/Due Date/i), { target: { value: '2025-06-10' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        description: 'Test Desc',
        status: 'In Progress',
        dueDate: '2025-06-10',
      })
    );
  });

  it('calls onSubmit with updated data for edit', () => {
    const handleSubmit = jest.fn();
    const editTodo: Todo = {
      ...baseTodo,
      id: '1',
      title: 'Old',
      description: 'Old Desc',
      status: 'Not Started',
      dueDate: '2025-06-01',
      createdAt: '2025-06-01T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
    };
    render(<TodoForm todoData={editTodo} onSubmit={handleSubmit} />);
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Title' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'New Title',
        description: 'Old Desc',
        status: 'Not Started',
        dueDate: '2025-06-01',
      })
    );
  });
});
