export type Role = 'owner' | 'manager' | 'member' | 'client';

export interface User {
  _id: string;
  workspace: string;
  client?: string;
  name: string;
  surname?: string;
  email: string;
  role: Role;
  photo?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  settings: {
    timezone: string;
    weekStartsOn: 0 | 1 | 6;
    currency: string;
    defaultHourlyRate: number;
    invoicePrefix: string;
  };
}

export interface Client {
  _id: string;
  name: string;
  status: 'lead' | 'active' | 'archived';
  companySize: string;
  primaryContact: { name: string; email?: string; phone?: string; title?: string };
  country?: string;
  address?: string;
  notes?: string;
}

export interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  deadline?: string;
  client: Client | string;
  teamMembers: User[];
  budget: { amount: number; currency: string };
}

export interface Task {
  _id: string;
  project: Project | string;
  title: string;
  description?: string;
  assignee: User | string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sortOrder: number;
  comments?: Array<{
    _id?: string;
    author: User | string;
    message: string;
    createdAt: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  result: T;
  message?: string;
  meta?: Record<string, number>;
}
