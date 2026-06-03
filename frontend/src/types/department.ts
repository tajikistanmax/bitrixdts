export interface Department {
  id: string;
  name: string;
  organizationId: string;
  parentId?: string;
  headId?: string;
  headName?: string;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
  parent?: Department;
  children?: Department[];
}

export interface CreateDepartmentDTO {
  name: string;
  parentId?: string;
  headId?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  parentId?: string;
  headId?: string;
}

export interface DepartmentTree {
  id: string;
  name: string;
  level: number;
  children: DepartmentTree[];
}
