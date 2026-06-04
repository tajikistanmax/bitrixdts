import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TasksPage from '../pages/TasksPage';

vi.mock('../services/task.service', () => ({
  taskService: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../services/employee.service', () => ({
  employeeService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Input: ({ label, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  ),
  Modal: ({ isOpen, title, children, footer }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h3>{title}</h3>
        <div>{children}</div>
        {footer && <div>{footer}</div>}
      </div>
    ) : null,
  Badge: ({ children }: any) => <span>{children}</span>,
  PageHeader: ({ title, action }: any) => (
    <div>
      <h1>{title}</h1>
      {action && <div>{action}</div>}
    </div>
  ),
}));

vi.mock('../components/TaskCard', () => ({
  TaskCard: ({ task, onClick }: any) => (
    <div data-testid="task-card" onClick={onClick}>{task.title}</div>
  ),
}));

vi.mock('../components/TaskDetailModal', () => ({
  TaskDetailModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="task-detail-modal" /> : null,
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: vi.fn((name) => ({ name })),
    handleSubmit: vi.fn((cb: any) => (e: any) => { e?.preventDefault?.(); cb({}); }),
    reset: vi.fn(),
    formState: { errors: {} },
  })),
}));

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseQueryClient = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
  useQueryClient: (...args: any[]) => mockUseQueryClient(...args),
}));

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });
  });

  it('renders page title', () => {
    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Задачи')).toBeInTheDocument();
  });

  it('has create button', () => {
    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    );

    expect(screen.getByText('+ Новая задача')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true });

    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('renders kanban board with tasks', () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'todo', priority: 'high', assignee: null, dueDate: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', title: 'Task 2', status: 'done', priority: 'low', assignee: null, dueDate: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    mockUseQuery
      .mockReturnValueOnce({ data: mockTasks, isLoading: false })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Нужно сделать')).toBeInTheDocument();
    expect(screen.getByText('Готово')).toBeInTheDocument();
  });
});
