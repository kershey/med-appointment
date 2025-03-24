-- Create user roles enum
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'staff', 'admin');

-- Create appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'canceled', 'completed', 'no_show');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  role user_role DEFAULT 'patient',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  bio TEXT,
  consultation_fee DECIMAL(10, 2) NOT NULL,
  years_of_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctor schedule table
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, day_of_week, start_time, end_time)
);

-- Create special schedule exceptions (holidays, vacations, etc.)
CREATE TABLE schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, exception_date)
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  queue_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, appointment_date, start_time)
);

-- Create medical records table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create diagnostic results table
CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  test_results TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status payment_status DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow the trigger to insert profiles (using service_role internally)
CREATE POLICY "Database trigger can insert profiles" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Staff and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

CREATE POLICY "Staff and Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Doctors table policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view doctors"
  ON doctors FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admin can manage doctors"
  ON doctors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Appointments table policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = patient_id AND status = 'scheduled');

CREATE POLICY "Doctors can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Staff and Admin can manage all appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Medical records table policies
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own medical records"
  ON medical_records FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view and update records for their patients"
  ON medical_records FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert records for their patients"
  ON medical_records FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own records"
  ON medical_records FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Staff and Admin can manage all medical records"
  ON medical_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Payments table policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = payments.appointment_id AND appointments.patient_id = auth.uid()
    )
  );

CREATE POLICY "Staff and Admin can manage all payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
    )
  );

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Get first_name and last_name from user metadata if available
  first_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'first_name')::TEXT,
    ''
  );
  
  last_name_val := COALESCE(
    (NEW.raw_user_meta_data->>'last_name')::TEXT,
    ''
  );
  
  INSERT INTO profiles (id, first_name, last_name, role)
  VALUES (NEW.id, first_name_val, last_name_val, 'patient');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add indexes for performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id); 