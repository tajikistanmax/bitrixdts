export interface Employee {
  id: string;
  email: string;
  fullName: string;
  position?: string;
  phone?: string;
  organizationId: string;
  departmentId?: string;
  managerId?: string;
  status: 'active' | 'inactive' | 'terminated';
  hireDate?: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  parentId?: string;
  headId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDTO {
  email: string;
  fullName: string;
  position?: string;
  phone?: string;
  departmentId?: string;
  managerId?: string;
  hireDate?: string;
}

export interface UpdateEmployeeDTO {
  fullName?: string;
  position?: string;
  phone?: string;
  departmentId?: string;
  managerId?: string;
  status?: 'active' | 'inactive' | 'terminated';
}
