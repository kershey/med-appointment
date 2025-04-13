export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'canceled'
  | 'completed'
  | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  role: UserRole;
  is_approved: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  specialty: string;
  license_number: string;
  bio?: string;
  consultation_fee: number;
  years_of_experience?: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleException {
  id: string;
  doctor_id: string;
  exception_date: string;
  is_available: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  queue_number?: string;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  doctor?: Doctor;
  payment?: Payment;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  prescriptions?: Prescription[];
  diagnostic_results?: DiagnosticResult[];
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticResult {
  id: string;
  medical_record_id: string;
  test_name: string;
  test_date: string;
  test_results: string;
  file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  payment_method?: string;
  payment_reference?: string;
  status: PaymentStatus;
  payment_date?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  appointment?: Appointment;
}
