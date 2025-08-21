-- Add notes field to master view functions
CREATE OR REPLACE FUNCTION public.get_super_admin_master_view()
 RETURNS TABLE(
    deal_id bigint, 
    lead_id character varying, 
    deal_name character varying, 
    pipeline_name character varying, 
    status_name character varying, 
    clinic_name character varying, 
    deal_country character varying, 
    visa_city character varying, 
    clinic_full_name character varying, 
    clinic_address_chinese text, 
    clinic_address_english text, 
    patient_last_name text, 
    patient_first_name text, 
    patient_full_name text, 
    patient_preferred_name text, 
    patient_phone text, 
    patient_email text, 
    patient_birthday date, 
    patient_country character varying, 
    patient_city text, 
    patient_passport text, 
    patient_position text, 
    amocrm_contact_id bigint, 
    arrival_datetime timestamp without time zone, 
    arrival_transport_type character varying, 
    departure_airport_code text, 
    arrival_city text, 
    arrival_flight_number text, 
    arrival_terminal text, 
    passengers_count text, 
    apartment_number text, 
    departure_transport_type text, 
    departure_city text, 
    departure_datetime timestamp without time zone, 
    departure_flight_number text, 
    visa_type text, 
    visa_days integer, 
    visa_entries_count character varying, 
    visa_corridor_start date, 
    visa_corridor_end date, 
    visa_expiry_date date, 
    days_until_visa_expires interval, 
    patient_status text, 
    visa_status text, 
    notes text,
    deal_created_at timestamp without time zone, 
    deal_updated_at timestamp without time zone
)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
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
        
        -- CLINIC DATA
        cl.full_name as clinic_full_name,
        cl.address_chinese as clinic_address_chinese,
        cl.address_english as clinic_address_english,
        
        -- PATIENT DATA
        c.last_name as patient_last_name,
        c.first_name as patient_first_name,
        CONCAT(c.first_name, ' ', c.last_name) as patient_full_name,
        c.preferred_name as patient_preferred_name,
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
        (tc.arrival_datetime::date + (v.visa_days || ' days')::interval)::date as visa_expiry_date,
        ((tc.arrival_datetime::date + (v.visa_days || ' days')::interval) - CURRENT_DATE) as days_until_visa_expires,
        
        -- Patient status based on dates
        CASE 
            WHEN tc.arrival_datetime > NOW() THEN 'Arriving'
            WHEN tc.arrival_datetime <= NOW() AND (tf.departure_datetime IS NULL OR tf.departure_datetime > NOW()) THEN 'In Treatment'
            WHEN tf.departure_datetime <= NOW() THEN 'Departed'
            ELSE 'Unknown'
        END as patient_status,
        
        -- Visa status based on expiry
        CASE 
            WHEN (tc.arrival_datetime::date + (v.visa_days || ' days')::interval) < CURRENT_DATE THEN 'Expired'
            WHEN ((tc.arrival_datetime::date + (v.visa_days || ' days')::interval) - CURRENT_DATE) <= interval '3 days' THEN 'Expiring Soon'
            ELSE 'Active'
        END as visa_status,
        
        -- NOTES
        d.notes,
        
        -- Timestamps
        d.created_at as deal_created_at,
        d.updated_at as deal_updated_at

    FROM public.deals d
    LEFT JOIN public.contacts c ON c.deal_id = d.id
    LEFT JOIN public.tickets_to_china tc ON tc.deal_id = d.id  
    LEFT JOIN public.tickets_from_treatment tf ON tf.deal_id = d.id
    LEFT JOIN public.visas v ON v.deal_id = d.id
    LEFT JOIN public.clinics_directory cl ON cl.short_name = d.clinic_name
    WHERE c.position ILIKE '%пациент%';
END;
$function$;

-- Update get_filtered_master_view function to include notes
CREATE OR REPLACE FUNCTION public.get_filtered_master_view()
 RETURNS TABLE(
    deal_id bigint, 
    lead_id character varying, 
    deal_name character varying, 
    pipeline_name character varying, 
    status_name character varying, 
    clinic_name character varying, 
    deal_country character varying, 
    visa_city character varying, 
    clinic_full_name character varying, 
    clinic_address_chinese text, 
    clinic_address_english text, 
    patient_last_name text, 
    patient_first_name text, 
    patient_full_name text, 
    patient_preferred_name text, 
    patient_phone text, 
    patient_email text, 
    patient_birthday date, 
    patient_country character varying, 
    patient_city text, 
    patient_passport text, 
    patient_position text, 
    amocrm_contact_id bigint, 
    arrival_datetime timestamp without time zone, 
    arrival_transport_type character varying, 
    departure_airport_code text, 
    arrival_city text, 
    arrival_flight_number text, 
    arrival_terminal text, 
    passengers_count text, 
    apartment_number text, 
    departure_transport_type text, 
    departure_city text, 
    departure_datetime timestamp without time zone, 
    departure_flight_number text, 
    visa_type text, 
    visa_days integer, 
    visa_entries_count character varying, 
    visa_corridor_start date, 
    visa_corridor_end date, 
    visa_expiry_date timestamp without time zone, 
    days_until_visa_expires interval, 
    patient_status text, 
    visa_status text, 
    notes text,
    deal_created_at timestamp without time zone, 
    deal_updated_at timestamp without time zone
)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_role public.app_role;
    current_clinic text;
BEGIN
    -- Get current user's role and clinic with explicit schema references
    SELECT public.get_current_user_role() INTO current_role;
    SELECT public.get_current_user_clinic() INTO current_clinic;
    
    -- Return filtered results based on role
    IF current_role = 'coordinator' THEN
        -- Coordinators see only their clinic's patients
        RETURN QUERY
        SELECT * FROM public.get_super_admin_master_view() samv
        WHERE samv.clinic_name = current_clinic;
    ELSE
        -- Directors and Super Admins see all patients
        RETURN QUERY
        SELECT * FROM public.get_super_admin_master_view();
    END IF;
END;
$function$;
