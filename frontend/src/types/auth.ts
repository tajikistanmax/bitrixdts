export interface User {
  id: string;
  email: string;
  fullName: string;
  position?: string;
  phone?: string;
  organizationId: string;
  departmentId?: string;
  managerId?: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  position?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
