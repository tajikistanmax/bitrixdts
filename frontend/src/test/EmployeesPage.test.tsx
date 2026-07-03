import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeesPage from '../pages/EmployeesPage';

vi.mock('../services/employee.service', () => ({
  employeeService: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../components/ui', () => ({
  Button: ({ children, onClick, leftIcon, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Input: ({ label, leftIcon, ...props }: any) => (
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
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ title }: any) => <div>{title}</div>,
  Avatar: ({ name }: any) => <span>{name?.[0] ?? ''}</span>,
  EmptyState: ({ title, description, action }: any) => (
    <div>
      {title}
      {description}
      {action}
    </div>
  ),
  LoadingState: () => <div>Загрузка...</div>,
  Spinner: () => <div />,
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: vi.fn((name) => ({ name })),
    handleSubmit: vi.fn((cb: any) => (e: any) => { e?.preventDefault?.(); cb({}); }),
    reset: vi.fn(),
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

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: vi.fn() });
  });

  it('renders page title', () => {
    render(
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Поиск сотрудника/)).toBeInTheDocument();
  });

  it('has create button', () => {
    render(
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Пригласить').length).toBeGreaterThan(0);
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true });

    render(
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('renders employees list', () => {
    const mockEmployees = [
      { id: '1', fullName: 'Иван Иванов', email: 'ivan@test.com', position: 'Разработчик', phone: '+123', status: 'active' },
      { id: '2', fullName: 'Петр Петров', email: 'petr@test.com', position: 'Дизайнер', phone: '+456', status: 'inactive' },
    ];
    mockUseQuery.mockReturnValue({ data: mockEmployees, isLoading: false });

    render(
      <BrowserRouter>
        <EmployeesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Петр Петров')).toBeInTheDocument();
    expect(screen.getByText('ivan@test.com')).toBeInTheDocument();
    expect(screen.getByText('petr@test.com')).toBeInTheDocument();
  });
});
