import { MaritalStatus, Role, Sex } from './enums';

export interface Employee {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  date_of_birth: string;
  sex: Sex;
  marital_status: MaritalStatus;
  referee: string;
  emergency_name: string;
  emergency_address: string;
  emergency_phone: string;
  hired_date: string;
  skill: string;
  hourly_rate: number;
  overtime_rate: number;
  project_id: string;
  position_id: string;
  subcontract_id: string;
}

export interface InsuranceCompany {
  id: string;
  code: string;
  name: string;
}

export interface InsurancePolicy {
  id: string;
  code: string;
  project_id: string;
  insurance_company_id: string;
  start_date: string;
  end_date: string;
  details: string;
}

export interface Position {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  minimum_pay: number;
  maximum_pay: number;
}

export interface Project {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  acronym: string;
  accumulation_amount: number;
  address: string;
  end_date: string;
  project_group: string;
  start_date: string;
}

export interface Subcontract {
  id: string;
  create_date: string;
  update_date: string;
  code: string;
  name: string;
  down_payment1: number;
  down_payment2: number;
  down_payment3: number;
}

export interface WeeklyPayrollHistory {
  id: string;
  create_date: string;
  update_date: string;
  week_start_date: string;
  project_id: string;
  employee_id: string;
  employee_position: string;
  employee_hourly_rate: number;
  employee_overtime_rate: number;
  hours_day_1: number;
  hours_day_2: number;
  hours_day_3: number;
  hours_day_4: number;
  hours_day_5: number;
  hours_day_6: number;
  hours_day_7: number;
  slip_regular_hours: number;
  slip_overtime_hours: number;
  slip_addition_1: number;
  slip_addition_2: number;
  slip_addition_3: number;
  slip_deduction_1: number;
  slip_deduction_2: number;
  slip_deduction_3: number;
  slip_deduction_4: number;
  slip_deduction_5: number;
  slip_deduction_6: number;
}

interface BaseUser {
  id: string;
  create_date: string;
  update_date: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserCreate extends BaseUser {
  password: string;
  password_confirmation: string;
}

export interface UserStore extends BaseUser {
  password_hash: string;
}
