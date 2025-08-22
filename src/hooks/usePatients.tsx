// src/hooks/usePatients.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatientData, PatientFilters } from '@/types/patient';
import { useAuth } from '@/hooks/useAuth';

export function usePatients() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const loadPatients = useCallback(async (filters: PatientFilters) => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    console.log('🔍 loadPatients called with:', { 
      filters, 
      userRole: profile.role, 
      userClinic: profile.clinic_name 
    });
    
    try {
      // Используем прямое обращение к представлению
      const { data: allData, error: fetchError } = await supabase
        .from('super_admin_master_view')
        .select('*');
        
      if (fetchError) {
        console.error('View query error:', fetchError);
        throw new Error(`Ошибка загрузки данных: ${fetchError.message}`);
      }

      console.log('🔍 Total patients from database:', allData?.length || 0);
      
      let filteredData = allData || [];
      
      // Apply clinic filtering based on user role
      if (profile.role === 'coordinator' && profile.clinic_name) {
        // Coordinator sees only patients from their assigned clinic
        const beforeFilter = filteredData.length;
        filteredData = filteredData.filter((patient: any) => 
          patient.clinic_name === profile.clinic_name
        );
        console.log(`🔍 Coordinator filtering: ${beforeFilter} -> ${filteredData.length} patients for clinic "${profile.clinic_name}"`);
      } else if (filters.clinic && profile.role !== 'coordinator') {
        // Other roles can filter by clinic if specified
        filteredData = filteredData.filter((patient: any) => 
          patient.clinic_name === filters.clinic
        );
      }
      
      // Фильтрация по статусу удалена - теперь используется только клиентская фильтрация
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((patient: any) => 
          patient.patient_full_name?.toLowerCase().includes(searchLower) ||
          patient.patient_email?.toLowerCase().includes(searchLower) ||
          patient.patient_phone?.toLowerCase().includes(searchLower)
        );
      }

      // Фильтр по коду аэропорта
      if (filters.departure_airport_code) {
        filteredData = filteredData.filter((patient: any) => 
          patient.departure_airport_code?.toLowerCase().includes(filters.departure_airport_code!.toLowerCase())
        );
      }

      // Фильтр по городу прибытия
      if (filters.arrival_city) {
        filteredData = filteredData.filter((patient: any) => 
          patient.arrival_city?.toLowerCase().includes(filters.arrival_city!.toLowerCase())
        );
      }




      
      // Sort by arrival_datetime
      filteredData.sort((a: any, b: any) => {
        const dateA = a.arrival_datetime ? new Date(a.arrival_datetime).getTime() : 0;
        const dateB = b.arrival_datetime ? new Date(b.arrival_datetime).getTime() : 0;
        return dateA - dateB;
      });
      
      // Transform the data to match PatientData type
      const transformedData: PatientData[] = filteredData.map((row: any) => ({
        deal_id: row.deal_id || 0,
        lead_id: row.lead_id,
        deal_name: row.deal_name || '',
        patient_full_name: row.patient_full_name || '',
        clinic_name: row.clinic_name || '',
        // patient_status удален - теперь используется только status_name из AmoCRM
        pipeline_name: row.pipeline_name,
        status_name: row.status_name,
        deal_country: row.deal_country,
        visa_city: row.visa_city,
        deal_created_at: row.deal_created_at || '',
        clinic_full_name: row.clinic_full_name,
        clinic_address_chinese: row.clinic_address_chinese,
        clinic_address_english: row.clinic_address_english,
        patient_first_name: row.patient_first_name,
        patient_last_name: row.patient_last_name,
        patient_preferred_name: row.patient_preferred_name,
        patient_phone: row.patient_phone,
        patient_email: row.patient_email,
        patient_birthday: row.patient_birthday,
        patient_country: row.patient_country,
        patient_city: row.patient_city,
        patient_passport: row.patient_passport,
        patient_position: row.patient_position,
        patient_chinese_name: row.patient_chinese_name,
        notes: row.notes,
        amocrm_contact_id: row.amocrm_contact_id,
        arrival_datetime: row.arrival_datetime,
        arrival_transport_type: row.arrival_transport_type,
        departure_airport_code: row.departure_airport_code,
        arrival_city: row.arrival_city,
        arrival_flight_number: row.arrival_flight_number,
        arrival_terminal: row.arrival_terminal,
        passengers_count: row.passengers_count,
        apartment_number: row.apartment_number,
        departure_transport_type: row.departure_transport_type,
        departure_city: row.departure_city,
        departure_datetime: row.departure_datetime,
        departure_flight_number: row.departure_flight_number,
        visa_type: row.visa_type,
        visa_days: row.visa_days,
        visa_entries_count: row.visa_entries_count,
        visa_corridor_start: row.visa_corridor_start,
        visa_corridor_end: row.visa_corridor_end,
        china_entry_date: row.china_entry_date,  // ← NEW: Date of entry to China
        visa_expiry_date: row.visa_expiry_date,
        last_day_in_china: row.last_day_in_china,  // ← NEW: Last day in China
        days_until_visa_expires: row.days_until_visa_expires,
        visa_status: (row.visa_status as 'Active' | 'Expiring Soon' | 'Expired') || null,
      }));
      
      setPatients(transformedData);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const updatePatient = async (dealId: number, updates: Partial<PatientData>) => {
    try {
      console.log('Starting update for dealId:', dealId, 'with updates:', updates);
      
      // Разделяем поля по таблицам
      const dealsFields = [
        'deal_name', 'pipeline_name', 'status_name', 'deal_country', 'visa_city'
      ];
      const contactsFields = [
        'patient_chinese_name'
      ];
      const ticketsFields = [
        'apartment_number', 'arrival_datetime', 'arrival_city', 'arrival_flight_number', 
        'arrival_transport_type', 'passengers_count'
      ];
      const returnTicketsFields = [
        'departure_city', 'departure_datetime', 'departure_flight_number'
      ];

      const dealsUpdates: any = {};
      const contactsUpdates: any = {};
      const ticketsUpdates: any = {};
      const returnTicketsUpdates: any = {};

      Object.keys(updates).forEach(key => {
        if (dealsFields.includes(key)) {
          dealsUpdates[key] = (updates as any)[key];
        } else if (contactsFields.includes(key)) {
          contactsUpdates[key] = (updates as any)[key];
        } else if (ticketsFields.includes(key)) {
          ticketsUpdates[key] = (updates as any)[key];
        } else if (returnTicketsFields.includes(key)) {
          returnTicketsUpdates[key] = (updates as any)[key];
        }
      });

      // Специальная обработка для поля notes через RPC
      if (updates.notes !== undefined) {
        try {
          // Получаем текущего пользователя
          const { data: { user } } = await supabase.auth.getUser();
          
          console.log('Debug: user ID for RPC call:', user?.id);
          
          const { data, error: notesError } = await supabase.rpc('update_deal_notes', {
            p_deal_id: dealId,
            p_notes: updates.notes,
            p_user_id: user?.id
          });
          
          if (notesError) {
            console.error('Notes RPC error:', notesError);
            throw new Error(`Ошибка обновления notes: ${notesError.message}`);
          }
          
          if (data && !data.success) {
            console.error('Notes function error:', data.error);
            throw new Error(`Ошибка обновления notes: ${data.error}`);
          }
          
          console.log('Notes updated successfully via RPC:', data);
        } catch (rpcError) {
          console.error('Notes RPC call failed:', rpcError);
          throw new Error(`Ошибка вызова функции обновления notes: ${rpcError instanceof Error ? rpcError.message : 'Неизвестная ошибка'}`);
        }
      }

      // Специальная обработка для поля china_entry_date через RPC
      if (updates.china_entry_date !== undefined) {
        try {
          console.log('Updating china_entry_date via RPC:', updates.china_entry_date);
          
          const { data, error: chinaEntryError } = await supabase.rpc('update_china_entry_date', {
            p_deal_id: dealId,
            p_entry_date: updates.china_entry_date
          });
          
          if (chinaEntryError) {
            console.error('China entry date RPC error:', chinaEntryError);
            throw new Error(`Ошибка обновления даты въезда: ${chinaEntryError.message}`);
          }
          
          if (data && !data.success) {
            console.error('China entry date function error:', data.error);
            throw new Error(`Ошибка обновления даты въезда: ${data.error}`);
          }
          
          console.log('China entry date updated successfully via RPC:', data);
        } catch (rpcError) {
          console.error('China entry date RPC call failed:', rpcError);
          throw new Error(`Ошибка вызова функции обновления даты въезда: ${rpcError instanceof Error ? rpcError.message : 'Неизвестная ошибка'}`);
        }
      }

      // Обновляем таблицу deals если есть изменения (кроме notes)
      if (Object.keys(dealsUpdates).length > 0) {
        const { error: dealsError } = await supabase
          .from('deals')
          .update(dealsUpdates)
          .eq('id', dealId);

        if (dealsError) {
          console.error('Deals update error:', dealsError);
          throw new Error(`Ошибка обновления deals: ${dealsError.message}`);
        }
      }

      // Обновляем таблицу contacts если есть изменения
      if (Object.keys(contactsUpdates).length > 0) {
        const { error: contactsError } = await supabase
          .from('contacts')
          .update(contactsUpdates)
          .eq('deal_id', dealId);

        if (contactsError) {
          console.error('Contacts update error:', contactsError);
          throw new Error(`Ошибка обновления contacts: ${contactsError.message}`);
        }
      }

      // Обновляем таблицу tickets_to_china если есть изменения
      if (Object.keys(ticketsUpdates).length > 0) {
        // Если обновляется apartment_number, используем RPC функцию
        if (ticketsUpdates.apartment_number) {
          try {
            const { error: rpcError } = await (supabase as any).rpc('update_apartment_number', {
              p_deal_id: dealId,
              p_apartment_number: ticketsUpdates.apartment_number
            });
            
            if (rpcError) {
              console.error('RPC update error:', rpcError);
              throw new Error(`Ошибка обновления apartment_number: ${rpcError.message}`);
            }
          } catch (err) {
            console.error('RPC call error:', err);
            throw err;
          }
        } else {
          // Для других полей используем прямой UPDATE
          const { error: ticketsError } = await supabase
            .from('tickets_to_china')
            .update(ticketsUpdates)
            .eq('deal_id', dealId);

          if (ticketsError) {
            console.error('Tickets update error:', ticketsError);
            throw new Error(`Ошибка обновления tickets: ${ticketsError.message}`);
          }
        }
      }

      // Обновляем таблицу tickets_from_treatment если есть изменения
      if (Object.keys(returnTicketsUpdates).length > 0 || updates.departure_transport_type) {
        try {
          // Используем RPC функцию с правами суперпользователя
          const { data, error: returnTicketsError } = await supabase.rpc('update_departure_tickets', {
            p_deal_id: dealId,
            p_departure_transport_type: updates.departure_transport_type || returnTicketsUpdates.return_transport_type || null,
            p_departure_city: returnTicketsUpdates.departure_city || null,
            p_departure_datetime: returnTicketsUpdates.departure_datetime || null,
            p_departure_flight_number: returnTicketsUpdates.departure_flight_number || null
          });

          if (returnTicketsError) {
            console.error('Return tickets RPC error:', returnTicketsError);
            throw new Error(`Ошибка обновления обратных билетов: ${returnTicketsError.message}`);
          }

          // Проверяем результат функции
          if (data && !data.success) {
            console.error('Return tickets function error:', data.error);
            throw new Error(`Ошибка обновления обратных билетов: ${data.error}`);
          }

          console.log('Return tickets updated successfully via RPC:', data);
        } catch (rpcError) {
          console.error('RPC call failed:', rpcError);
          throw new Error(`Ошибка вызова функции обновления: ${rpcError instanceof Error ? rpcError.message : 'Неизвестная ошибка'}`);
        }
      }

      // Перезагружаем данные после обновления
      await loadPatients({ search: '', fieldGroup: 'basic' });
      
      console.log('Update successful');
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (profile) {
      loadPatients({ search: '', fieldGroup: 'basic' });
    }
  }, [profile, loadPatients]);

  return {
    patients,
    loading,
    error,
    loadPatients,
    updatePatient
  };
}