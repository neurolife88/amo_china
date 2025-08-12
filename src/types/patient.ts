
export interface PatientData {
  // Primary identifiers
  deal_id: number;
  lead_id: string | null;
  deal_name: string | null;
  patient_full_name: string | null;
  clinic_name: string | null;
  // patient_status удален - теперь используется только status_name из AmoCRM
  
  // Deal data
  pipeline_name: string | null;
  status_name: string | null;
  deal_country: string | null;
  visa_city: string | null;
  deal_created_at: string | null;
  notes: string | null;  // ← NEW: Notes field
  
  // Clinic data
  clinic_full_name: string | null;
  clinic_address_chinese: string | null;
  clinic_address_english: string | null;
  
  // Patient personal data
  patient_first_name: string | null;
  patient_last_name: string | null;
  patient_preferred_name: string | null;
  patient_chinese_name: string | null;  // ← NEW: Chinese name
  patient_phone: string | null;
  patient_email: string | null;
  patient_birthday: string | null;
  patient_country: string | null;
  patient_city: string | null;
  patient_passport: string | null;
  patient_position: string | null;
  amocrm_contact_id: number | null;
  
  // Arrival data (read-only)
  arrival_datetime: string | null;
  arrival_transport_type: string | null;
  departure_airport_code: string | null;
  arrival_city: string | null;
  arrival_flight_number: string | null;
  arrival_terminal: string | null;
  passengers_count: string | null;
  
  // Editable fields
  apartment_number: string | null;
  departure_city: string | null;
  departure_datetime: string | null;
  departure_flight_number: string | null;
  departure_transport_type: string | null;
  
  // Visa data
  visa_type: string | null;
  visa_days: number | null;
  visa_entries_count: string | null;
  visa_corridor_start: string | null;
  visa_corridor_end: string | null;
  visa_expiry_date: string | null;
  days_until_visa_expires: number | null;
  visa_status: 'Active' | 'Expiring Soon' | 'Expired' | null;
}

export interface PatientFilters {
  // dateRange удален - фильтр по периоду времени больше не используется
  // status удален - теперь используется только status_name из AmoCRM
  clinic?: string;
  search?: string;
  departure_airport_code?: string;
  arrival_city?: string;
  fieldGroup?: FieldGroup;
}

export type FieldGroup = 'basic' | 'arrival' | 'departure' | 'treatment' | 'visa' | 'personal';
export type EditableField = 'apartment_number' | 'departure_city' | 'departure_datetime' | 'departure_flight_number' | 'departure_transport_type' | 'patient_chinese_name';

export interface SortConfig {
  field: keyof PatientData;
  direction: 'asc' | 'desc';
}

export interface FieldGroupSortConfig {
  [key in FieldGroup]: SortConfig;
}
