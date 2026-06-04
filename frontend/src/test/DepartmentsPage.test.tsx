import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DepartmentsPage from '../pages/DepartmentsPage';

vi.mock('../services/department.service', () => ({
  departmentService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/employee.service', () => ({
  employeeService: {
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

describe('DepartmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });
  });

  it('renders page title', () => {
    render(
      <BrowserRouter>
        <DepartmentsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Подразделения')).toBeInTheDocument();
  });

  it('has create button', () => {
    render(
      <BrowserRouter>
        <DepartmentsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('+ Новый отдел')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true });

    render(
      <BrowserRouter>
        <DepartmentsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('renders department tree', () => {
    const mockDepartments = [
      { id: '1', name: 'IT Отдел', parentId: undefined, headName: 'Иван Иванов', employeeCount: 5, createdAt: '2024-01-01' },
      { id: '2', name: 'HR Отдел', parentId: '1', headName: null, employeeCount: 2, createdAt: '2024-01-02' },
    ];
    mockUseQuery
      .mockReturnValueOnce({ data: mockDepartments, isLoading: false })
      .mockReturnValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <DepartmentsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('IT Отдел')).toBeInTheDocument();
    expect(screen.getByText('HR Отдел')).toBeInTheDocument();
    expect(screen.getByText('Руководитель: Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Сотрудников: 5')).toBeInTheDocument();
  });
});
