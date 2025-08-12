-- Update super_admin_master_view to include patient_chinese_name and notes
-- Date: 2025-01-07 12:00:02
-- ID: update-master-view-with-new-fields

CREATE OR REPLACE VIEW public.super_admin_master_view AS
SELECT 
    -- DEAL DATA
    d.id as deal_id,
    d.lead_id,
    d.deal_name,
    d.pipeline_name,
    d.status_name,
    d.clinic_name,
    d.country as deal_country,
    d.visa_city,
    d.notes,  -- ← NEW: Notes field from deals
    
    -- CLINIC DATA
    cl.full_name as clinic_full_name,
    cl.address_chinese as clinic_address_chinese,
    cl.address_english as clinic_address_english,
    
    -- PATIENT DATA
    c.last_name as patient_last_name,
    c.first_name as patient_first_name,
    CONCAT(c.first_name, ' ', c.last_name) as patient_full_name,
    c.preferred_name as patient_preferred_name,
    c.patient_chinese_name,  -- ← NEW: Chinese name field from contacts
    c.work_phone as patient_phone,
    c.work_email as patient_email,
    c.birthday as patient_birthday,
    c.country as patient_country,
    c.city as patient_city,
    c.passport_number as patient_passport,
    c.position as patient_position,
    c.amocrm_contact_id,
    
    -- ARRIVAL DATA (tickets_to_china)
    tc.arrival_datetime,
    tc.transport_type as arrival_transport_type,
    tc.airport_code as departure_airport_code,
    tc.arrival_city,
    tc.flight_number as arrival_flight_number,
    tc.terminal as arrival_terminal,
    tc.passengers_count,
    tc.apartment_number,
    
    -- DEPARTURE DATA (tickets_from_treatment)  
    tf.return_transport_type as departure_transport_type,
    tf.departure_city,
    tf.departure_datetime,
    tf.departure_flight_number,
    
    -- VISA DATA
    v.visa_type,
    v.visa_days,
    v.entries_count as visa_entries_count,
    v.corridor_start_date as visa_corridor_start,
    v.corridor_end_date as visa_corridor_end,
    
    -- COMPUTED FIELDS
    -- Calculate days until visa expires only for those who have already arrived
    CASE 
        WHEN tc.arrival_datetime IS NULL OR tc.arrival_datetime > CURRENT_TIMESTAMP THEN NULL
        ELSE (tc.arrival_datetime::date + (v.visa_days || ' days')::interval) - CURRENT_DATE
    END as days_until_visa_expires,
    
    -- Patient status based on dates
    CASE 
        WHEN tc.arrival_datetime > NOW() THEN 'Arriving'
        WHEN tc.arrival_datetime <= NOW() AND (tf.departure_datetime IS NULL OR tf.departure_datetime > NOW()) THEN 'In Treatment'
        WHEN tf.departure_datetime <= NOW() THEN 'Departed'
        ELSE 'Unknown'
    END as patient_status,
    
    -- Visa status based on expiry
    CASE 
        WHEN tc.arrival_datetime IS NULL OR tc.arrival_datetime > CURRENT_TIMESTAMP THEN NULL
        WHEN (tc.arrival_datetime::date + (v.visa_days || ' days')::interval) < CURRENT_DATE THEN 'Expired'
        WHEN ((tc.arrival_datetime::date + (v.visa_days || ' days')::interval) - CURRENT_DATE) <= 30 THEN 'Expiring Soon'
        ELSE 'Active'
    END as visa_status,
    
    -- Timestamps
    d.created_at as deal_created_at,
    d.updated_at as deal_updated_at

FROM deals d
LEFT JOIN contacts c ON c.deal_id = d.id
LEFT JOIN tickets_to_china tc ON tc.deal_id = d.id  
LEFT JOIN tickets_from_treatment tf ON tf.deal_id = d.id
LEFT JOIN visas v ON v.deal_id = d.id
LEFT JOIN clinics_directory cl ON cl.short_name = d.clinic_name;
