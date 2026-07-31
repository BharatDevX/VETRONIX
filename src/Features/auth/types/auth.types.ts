export interface LoginForm {
  employeeId: string;
  password: string;
}

export interface Employee {
  id: string;
  auth_id: string;

  employee_id: string;

  full_name: string;

  designation: string;

  branch: string;

  mobile: string;

  email: string;

  is_active: boolean;

  created_at: string;
}