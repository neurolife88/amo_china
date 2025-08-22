/**
 * Рефакторированный компонент таблицы пациентов для десктопа
 * 
 * Использует новую систему прав доступа для более четкой
 * и централизованной логики проверки разрешений
 */

import { useState } from 'react';
import { PatientData, FieldGroup } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Edit2, Check, X, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCities } from '@/hooks/useCities';
import ExpandableText from '../ExpandableText';
import StickyHorizontalScroll from '../StickyHorizontalScroll';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReturnTicketsModal } from '@/components/common/Modals';
import { EditableNotesCell } from './EditableNotesCell';
import { supabase } from '@/integrations/supabase/client';

// Новые импорты для системы прав
import { usePermissions, PermissionGate } from '@/hooks/usePermissions';

interface PatientTableDesktopProps {
  patients: PatientData[];
  visibleFieldGroups: FieldGroup[];
  onPatientUpdate: (dealId: number, updates: Partial<PatientData>) => Promise<void>;
}

export function PatientTableDesktop({ 
  patients, 
  visibleFieldGroups, 
  onPatientUpdate
}: PatientTableDesktopProps) {
  
  // Используем новую систему прав вместо передачи userRole
  const permissions = usePermissions();
  const { toast } = useToast();
  const { cities } = useCities();
  
  const [editingField, setEditingField] = useState<{ dealId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  
  // =============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕНДЕРИНГА
  // =============================================================================
  
  /**
   * Рендерит заголовок таблицы с проверкой видимости поля для координатора.
   * Всегда отображает "Пациент" и "中文名字".
   */
  const renderTableHeader = (fieldName: string, displayTitle: string, fieldGroup: FieldGroup, style?: React.CSSProperties) => {
    // Пациент и 中文名字 всегда видимы
    if (fieldName === 'patient_full_name' || fieldName === 'patient_chinese_name') {
      return (
        <th 
          key={fieldName} 
          className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words"
          style={style}
        >
          {displayTitle}
        </th>
      );
    }

    if (permissions.shouldShowField(fieldName, fieldGroup)) {
      return (
        <th 
          key={fieldName} 
          className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words"
          style={style}
        >
          {displayTitle}
        </th>
      );
    }
    return null;
  };

  // Состояние для модального окна обратных билетов
  const [returnTicketsData, setReturnTicketsData] = useState({
    departure_transport_type: '',
    departure_city: '',
    departure_datetime: null as Date | null,
    departure_time: '12:00',
    departure_flight_number: ''
  });

  // =============================================================================
  // ОБРАБОТЧИКИ РЕДАКТИРОВАНИЯ
  // =============================================================================

  const startEditing = (dealId: number, field: string, currentValue: string | null, fieldGroup?: FieldGroup) => {
    // Проверяем права доступа
    const patient = patients.find(p => p.deal_id === dealId);
    
    if (!permissions.canEdit(field, { 
      fieldGroup, 
      targetClinic: patient?.clinic_name 
    })) {
      toast({
        title: "Недостаточно прав",
        description: "У вас нет прав для редактирования этого поля",
        variant: "destructive"
      });
      return;
    }

    setEditingField({ dealId, field });
    
    if (field === 'china_entry_date' && currentValue) {
      try {
        const date = new Date(currentValue);
        setSelectedDate(date);
      } catch {
        setSelectedDate(undefined);
      }
    } else {
      setEditValue(currentValue || '');
    }
  };

  const saveEdit = async (dealId: number, field: string, value: string, fieldGroup?: FieldGroup) => {
    try {
      const patient = patients.find(p => p.deal_id === dealId);
      if (!patient) return;

      // Дополнительная проверка прав перед сохранением
      if (!permissions.canEdit(field, { 
        fieldGroup, 
        targetClinic: patient.clinic_name 
      })) {
        throw new Error('Недостаточно прав для редактирования этого поля');
      }

             // Специальная обработка для даты въезда в Китай
       if (field === 'china_entry_date') {
         // Обновляем через хук, который обработает RPC вызов
         await onPatientUpdate(dealId, { china_entry_date: value });
       } else {
         // Обычное обновление через хук
         let updates: Partial<PatientData> = {};

         // Специальная обработка для departure_datetime
         if (field === 'departure_datetime') {
           const date = new Date(value);
           const year = date.getFullYear();
           const month = String(date.getMonth() + 1).padStart(2, '0');
           const day = String(date.getDate()).padStart(2, '0');
           const hours = String(date.getHours()).padStart(2, '0');
           const minutes = String(date.getMinutes()).padStart(2, '0');
           const seconds = String(date.getSeconds()).padStart(2, '0');
           
           const formattedValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
           updates[field as keyof PatientData] = formattedValue as string | number | null;
         } else {
           updates[field as keyof PatientData] = value as string | number | null;
         }

         await onPatientUpdate(dealId, updates);
       }

       toast({
         title: "Успешно сохранено",
         description: "Изменения были применены",
       });

     } catch (error) {
       console.error('Error saving edit:', error);
       toast({
         title: "Ошибка сохранения",
         description: error instanceof Error ? error.message : 'Произошла ошибка при сохранении',
         variant: "destructive"
       });
     } finally {
       cancelEditing();
     }
   };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setSelectedDate(undefined);
  };

  // =============================================================================
  // ОБРАБОТЧИКИ МОДАЛЬНОГО ОКНА ОБРАТНЫХ БИЛЕТОВ
  // =============================================================================

  const handleAddReturnTickets = (patient: PatientData) => {
    // Проверяем права доступа - только координаторы и супер-админы
    if (!permissions.isCoordinator && !permissions.isSuperAdmin) {
      toast({
        title: "Недостаточно прав",
        description: "Только координаторы и супер-админы могут редактировать билеты",
        variant: "destructive"
      });
      return;
    }

    setSelectedPatient(patient);
    
    // Заполняем данные из существующих значений пациента
    setReturnTicketsData({
      departure_transport_type: patient.departure_transport_type || '',
      departure_city: patient.departure_city || '',
      departure_datetime: patient.departure_datetime ? new Date(patient.departure_datetime) : null,
      departure_time: patient.departure_datetime ? 
        new Date(patient.departure_datetime).toTimeString().slice(0, 5) : '12:00',
      departure_flight_number: patient.departure_flight_number || ''
    });
    
    setIsModalOpen(true);
  };

  const handleSaveReturnTickets = async () => {
    if (!selectedPatient) return;

    try {
      // Формируем данные для сохранения
      const updates: Partial<PatientData> = {};
      
      if (returnTicketsData.departure_transport_type) {
        updates.departure_transport_type = returnTicketsData.departure_transport_type;
      }
      
      if (returnTicketsData.departure_city) {
        updates.departure_city = returnTicketsData.departure_city;
      }
      
      if (returnTicketsData.departure_flight_number) {
        updates.departure_flight_number = returnTicketsData.departure_flight_number;
      }
      
      if (returnTicketsData.departure_datetime) {
        const date = returnTicketsData.departure_datetime;
        const [hours, minutes] = returnTicketsData.departure_time.split(':');
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Форматируем время без UTC конвертации
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedHours = String(date.getHours()).padStart(2, '0');
        const formattedMinutes = String(date.getMinutes()).padStart(2, '0');
        const formattedSeconds = String(date.getSeconds()).padStart(2, '0');
        
        updates.departure_datetime = `${year}-${month}-${day} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      }

      await onPatientUpdate(selectedPatient.deal_id, updates);
      
      toast({
        title: "Успешно сохранено",
        description: "Данные обратных билетов обновлены",
      });
      
      setIsModalOpen(false);
      setSelectedPatient(null);
      
    } catch (error) {
      console.error('Error saving return tickets:', error);
      toast({
        title: "Ошибка сохранения",
        description: error instanceof Error ? error.message : 'Произошла ошибка при сохранении',
        variant: "destructive"
      });
    }
  };

  const isEditing = (dealId: number, field: string) => {
    return editingField?.dealId === dealId && editingField?.field === field;
  };

  // =============================================================================
  // РЕНДЕРИНГ ЯЧЕЕК
  // =============================================================================

  /**
   * Рендерит обычную ячейку с проверкой видимости поля.
   */
  const renderTableCell = (
    patient: PatientData,
    fieldName: string,
    fieldGroup: FieldGroup,
    value: React.ReactNode | null,
    formatValue?: (val: string | number | null) => string
  ) => {
    if (!permissions.shouldShowField(fieldName, fieldGroup)) {
      return null;
    }
    const displayValue = formatValue ? formatValue(value as string | number | null) : (value || '-');
    return (
      <td key={`${patient.deal_id}-${fieldName}-view`} className="border-2 border-gray-400 px-4 py-2">
        {displayValue}
      </td>
    );
  };

  const renderEditableCell = (
    patient: PatientData, 
    field: string, 
    value: React.ReactNode | null, 
    formatValue?: (val: string | number | null) => string, 
    fieldGroup?: FieldGroup
  ) => {
    // Проверяем видимость поля перед рендерингом
    if (!fieldGroup || !permissions.shouldShowField(field, fieldGroup)) {
      return null; // Не рендерим ячейку, если поле не должно быть показано
    }

    const displayValue = formatValue ? formatValue(value as string | number | null) : (value || '-');
    const rawValue = typeof value === 'string' ? value : '';

    // Специальная обработка для поля notes
    if (field === 'notes') {
      return (
        <td className="border-2 border-gray-400 px-4 py-2">
          <PermissionGate 
            field="notes" 
            fieldContext={{ targetClinic: patient.clinic_name }}
            fallback={<ExpandableText text={value as string} maxLength={10} />}
          >
            <EditableNotesCell
              value={value as string}
              onSave={async (newValue: string) => {
                try {
                  const updates: Partial<PatientData> = { notes: newValue };
                  await onPatientUpdate(patient.deal_id, updates);
                  
                  toast({
                    title: "Примечание обновлено",
                    description: "Изменения были сохранены",
                  });
                } catch (error) {
                  console.error('Error in EditableNotesCell onSave:', error);
                  toast({
                    title: "Ошибка сохранения",
                    description: "Не удалось сохранить примечание",
                    variant: "destructive"
                  });
                  throw error; // Перебрасываем ошибку дальше
                }
              }}
              patientName={patient.patient_full_name}
              patientChineseName={patient.patient_chinese_name}
              maxDisplayLength={10}
            />
          </PermissionGate>
        </td>
      );
    }

    const canEditThisField = permissions.canEdit(field, { 
      fieldGroup, 
      targetClinic: patient.clinic_name 
    });

    if (!canEditThisField) {
      return (
        <td className="border-2 border-gray-400 px-4 py-2">
          {displayValue}
        </td>
      );
    }

    if (isEditing(patient.deal_id, field)) {
      // Специальная обработка для даты въезда в Китай
      if (field === 'china_entry_date') {
        return (
          <td className="border-2 border-gray-400 px-4 py-2">
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => saveEdit(patient.deal_id, field, editValue as string, fieldGroup)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </td>
        );
      }

      // Обычное редактирование
      return (
        <td className="border-2 border-gray-400 px-4 py-2">
          <div className="flex items-center space-x-2">
            {field === 'departure_city' ? (
              <Select value={editValue as string} onValueChange={setEditValue}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.city_name} value={city.city_name}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field === 'departure_transport_type' ? (
              <Select value={editValue as string} onValueChange={setEditValue}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Самолет">Самолет</SelectItem>
                  <SelectItem value="Поезд">Поезд</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-sm"
                type={field === 'departure_datetime' ? 'datetime-local' : 'text'}
                autoFocus
              />
            )}
            <Button
              size="sm"
              onClick={() => saveEdit(patient.deal_id, field, editValue as string, fieldGroup)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditing}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      );
    }

    // Режим просмотра с возможностью редактирования
    return (
      <td className="border-2 border-gray-400 px-4 py-2 group relative">
        <div className="flex items-center justify-between">
          <span>{displayValue}</span>
                     <Button
             size="sm"
             variant="ghost"
             onClick={() => startEditing(patient.deal_id, field, rawValue, fieldGroup)}
             className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
           >
            <Edit2 className="h-3 w-3" />
           </Button>
        </div>
      </td>
    );
  };

  // =============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // =============================================================================

  const getVisaBadge = (visaStatus: string, daysUntilExpires: number) => {
    if (visaStatus === 'Expired') {
      return <Badge variant="destructive">Истекла</Badge>;
    } else if (visaStatus === 'Expiring Soon') {
      return <Badge variant="secondary">Истекает ({daysUntilExpires} дн.)</Badge>;
    } else {
      return <Badge variant="default">Активна ({daysUntilExpires} дн.)</Badge>;
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    try {
      // Парсим время как есть, без UTC конвертации
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return dateTime;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd.MM.yyyy', { locale: ru });
    } catch {
      return date;
    }
  };

  const formatDateTimeForEdit = (dateTime: string | null) => {
    if (!dateTime) return '';
    try {
      // Парсим время как есть, без UTC конвертации
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // =============================================================================
  // ОСНОВНОЙ РЕНДЕР
  // =============================================================================

  if (permissions.loading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <StickyHorizontalScroll>
      <div className="overflow-x-auto">
        <table 
          style={{ width: 'max-content', tableLayout: 'fixed' }}
          className="border-collapse border-2 border-gray-400 force-narrow-cols"
        >
        <thead>
          <tr className="bg-gray-50">
            {renderTableHeader('patient_full_name', 'Пациент', 'basic', {width: '49px', minWidth: '49px', maxWidth: '49px'})}
            {renderTableHeader('patient_chinese_name', '中文名字', 'basic', {width: '38px', minWidth: '38px', maxWidth: '38px'})}
            
            {/* Basic fields */}
            {visibleFieldGroups.includes('basic') && (
              <>
                {renderTableHeader('deal_country', 'Страна', 'basic', {width: '60px'})}
                {renderTableHeader('patient_city', 'Город', 'basic', {width: '60px'})}
                {renderTableHeader('clinic_name', 'Клиника', 'basic', {width: '80px'})}
                {renderTableHeader('status_name', 'Статус сделки', 'basic', {width: '70px'})}
                {renderTableHeader('arrival_datetime', 'Дата и время прибытия', 'basic', {width: '90px'})}
                {renderTableHeader('arrival_transport_type', 'Транспорт', 'basic', {width: '70px'})}
                {renderTableHeader('arrival_flight_number', 'Рейс', 'basic', {width: '60px'})}
                {renderTableHeader('apartment_number', 'Квартира', 'basic', {width: '60px'})}
                {renderTableHeader('visa_type', 'Тип визы', 'basic', {width: '60px'})}
                {renderTableHeader('visa_days', 'Количество дней в визе', 'basic', {width: '70px'})}
                {renderTableHeader('visa_expiry_date', 'Истекает', 'basic', {width: '60px'})}
                {renderTableHeader('notes', 'Примечание', 'basic', {width: '100px'})}
              </>
            )}
            
            {/* Arrival fields */}
            {visibleFieldGroups.includes('arrival') && (
              <>
                {renderTableHeader('deal_country', 'Страна', 'arrival', {width: '80px'})}
                {renderTableHeader('clinic_name', 'Клиника', 'arrival', {width: '100px'})}
                {renderTableHeader('status_name', 'Статус сделки', 'arrival', {width: '90px'})}
                {renderTableHeader('arrival_datetime', 'Дата и время прибытия', 'arrival', {width: '110px'})}
                {renderTableHeader('arrival_transport_type', 'Транспорт', 'arrival', {width: '75px', minWidth: '75px', maxWidth: '75px'})}
                {renderTableHeader('departure_airport_code', 'Код аэропорта', 'arrival', {width: '40px', minWidth: '40px', maxWidth: '40px'})}
                {renderTableHeader('arrival_city', 'Город прибытия', 'arrival', {width: '100px'})}
                {renderTableHeader('arrival_flight_number', 'Рейс', 'arrival', {width: '80px'})}
                {renderTableHeader('arrival_terminal', 'Т-нал', 'arrival', {width: '30px', minWidth: '30px', maxWidth: '30px'})}
                {renderTableHeader('passengers_count', 'ПАС', 'arrival', {width: '40px', minWidth: '40px', maxWidth: '40px'})}
                {renderTableHeader('apartment_number', 'Квартира', 'arrival', {width: '80px'})}
                {renderTableHeader('notes', 'Примечание', 'arrival', {width: '120px'})}
              </>
            )}
            
            {/* Departure fields */}
            {visibleFieldGroups.includes('departure') && (
              <>
                {renderTableHeader('deal_country', 'Страна', 'departure', {width: '80px'})}
                {renderTableHeader('clinic_name', 'Клиника', 'departure', {width: '100px'})}
                {renderTableHeader('status_name', 'Статус сделки', 'departure', {width: '90px'})}
                {renderTableHeader('arrival_datetime', 'Дата и время прибытия', 'departure', {width: '110px'})}
                {renderTableHeader('departure_datetime', 'Дата и время убытия', 'departure', {width: '110px'})}
                {renderTableHeader('departure_transport_type', 'Транспорт', 'departure', {width: '100px'})}
                {renderTableHeader('departure_city', 'Город убытия', 'departure', {width: '100px'})}
                {renderTableHeader('departure_flight_number', 'Номер рейса', 'departure', {width: '100px'})}
                {renderTableHeader('notes', 'Примечание', 'departure', {width: '120px'})}
              </>
            )}
             
            {/* Treatment fields */}
            {visibleFieldGroups.includes('treatment') && (
              <>
                {renderTableHeader('deal_country', 'Страна', 'treatment', {width: '25px', minWidth: '25px', maxWidth: '25px'})}
                {renderTableHeader('apartment_number', 'Номер квартиры', 'treatment', {width: '14px', minWidth: '14px', maxWidth: '14px'})}
                {renderTableHeader('clinic_name', 'Клиника', 'treatment', {width: '32px', minWidth: '32px', maxWidth: '32px'})}
                {renderTableHeader('status_name', 'Статус сделки', 'treatment', {width: '70px'})}
                {renderTableHeader('arrival_datetime', 'Дата прибытия', 'treatment', {width: '55px'})}
                {renderTableHeader('departure_datetime', 'Дата убытия', 'treatment', {width: '55px'})}
                {renderTableHeader('visa_expiry_date', 'Виза истекает', 'treatment', {width: '50px'})}
                {renderTableHeader('notes', 'Примечание', 'treatment', {width: '120px'})}
                {renderTableHeader('actions', 'Действия', 'treatment', {width: '100px'})}
              </>
            )}
             
            {/* Visa fields */}
            {visibleFieldGroups.includes('visa') && (
              <>
                {renderTableHeader('deal_country', 'Страна', 'visa', {width: '80px'})}
                {renderTableHeader('clinic_name', 'Клиника', 'visa', {width: '100px'})}
                {renderTableHeader('status_name', 'Статус сделки', 'visa', {width: '90px'})}
                {renderTableHeader('visa_type', 'Тип визы', 'visa', {width: '80px'})}
                {renderTableHeader('visa_days', 'Количество дней в визе', 'visa', {width: '100px'})}
                {renderTableHeader('china_entry_date', 'Дата въезда в Китай', 'visa', {width: '120px'})}
                {renderTableHeader('visa_expiry_date', 'Истекает', 'visa', {width: '80px'})}
                {renderTableHeader('last_day_in_china', 'Истекает дата', 'visa', {width: '120px'})}
              </>
            )}
            
            {/* Personal fields (all roles) */}
            {visibleFieldGroups.includes('personal') && (
              <>
                {renderTableHeader('clinic_full_name', 'Клиника', 'personal', {width: '100px'})}
                {renderTableHeader('deal_country', 'Страна', 'personal', {width: '80px'})}
                {renderTableHeader('patient_city', 'Город', 'personal', {width: '80px'})}
                {renderTableHeader('patient_birthday', 'Дата рождения', 'personal', {width: '100px'})}
                {renderTableHeader('patient_passport', 'Номер паспорта', 'personal', {width: '120px'})}
                {renderTableHeader('patient_position', 'Должность', 'personal', {width: '100px'})}
                {renderTableHeader('notes', 'Примечание', 'personal', {width: '120px'})}
              </>
            )}
          </tr>
        </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={`${patient.deal_id}-${patient.patient_full_name}-${index}`} className="hover:bg-gray-50">
                {renderTableCell(patient, 'patient_full_name', 'basic', patient.patient_full_name)}
                {renderTableCell(patient, 'patient_chinese_name', 'basic', patient.patient_chinese_name)}
                
                {/* Basic fields */}
                {visibleFieldGroups.includes('basic') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'basic', patient.deal_country)}
                    {renderTableCell(patient, 'patient_city', 'basic', patient.patient_city)}
                    {renderTableCell(patient, 'clinic_name', 'basic', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'basic', patient.status_name)}
                    {renderTableCell(patient, 'arrival_datetime', 'basic', patient.arrival_datetime, formatDate)}
                    {renderTableCell(patient, 'arrival_transport_type', 'basic', patient.arrival_transport_type)}
                    {renderTableCell(patient, 'arrival_flight_number', 'basic', patient.arrival_flight_number)}
                    {renderTableCell(patient, 'apartment_number', 'basic', patient.apartment_number)}
                    {renderTableCell(patient, 'visa_type', 'basic', patient.visa_type)}
                    {renderTableCell(patient, 'visa_days', 'basic', patient.visa_days)}
                    {renderTableCell(patient, 'visa_status', 'basic', getVisaBadge(patient.visa_status, patient.days_until_visa_expires))}
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'basic')}
                  </>
                )}
                
                {/* Arrival fields */}
                {visibleFieldGroups.includes('arrival') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'arrival', patient.deal_country)}
                    {renderTableCell(patient, 'clinic_name', 'arrival', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'arrival', patient.status_name)}
                    {renderTableCell(patient, 'arrival_datetime', 'arrival', patient.arrival_datetime, formatDate)}
                    {renderTableCell(patient, 'arrival_transport_type', 'arrival', patient.arrival_transport_type)}
                    {renderTableCell(patient, 'departure_airport_code', 'arrival', patient.departure_airport_code)}
                    {renderTableCell(patient, 'arrival_city', 'arrival', patient.arrival_city)}
                    {renderTableCell(patient, 'arrival_flight_number', 'arrival', patient.arrival_flight_number)}
                    {renderTableCell(patient, 'arrival_terminal', 'arrival', patient.arrival_terminal)}
                    {renderTableCell(patient, 'passengers_count', 'arrival', patient.passengers_count)}
                    {renderEditableCell(patient, 'apartment_number', patient.apartment_number, undefined, 'arrival')}
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'arrival')}
                  </>
                )}
                
                {/* Departure fields */}
                {visibleFieldGroups.includes('departure') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'departure', patient.deal_country)}
                    {renderTableCell(patient, 'clinic_name', 'departure', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'departure', patient.status_name)}
                    {renderTableCell(patient, 'arrival_datetime', 'departure', patient.arrival_datetime, formatDate)}
                    {renderEditableCell(patient, 'departure_datetime', patient.departure_datetime, formatDateTimeForEdit, 'departure')}
                    {renderEditableCell(patient, 'departure_transport_type', patient.departure_transport_type, undefined, 'departure')}
                    {renderEditableCell(patient, 'departure_city', patient.departure_city, undefined, 'departure')}
                    {renderEditableCell(patient, 'departure_flight_number', patient.departure_flight_number, undefined, 'departure')}
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'departure')}
                  </>
                )}
                  
                {/* Treatment fields */}
                {visibleFieldGroups.includes('treatment') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'treatment', patient.deal_country)}
                    {renderEditableCell(patient, 'apartment_number', patient.apartment_number, undefined, 'treatment')}
                    {renderTableCell(patient, 'clinic_name', 'treatment', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'treatment', patient.status_name)}
                    {renderTableCell(patient, 'arrival_datetime', 'treatment', patient.arrival_datetime, (val) => val ? format(parseISO(val as string), 'dd.MM.yyyy', { locale: ru }) : '-')}
                    {renderTableCell(patient, 'departure_datetime', 'treatment', patient.departure_datetime, formatDate)}
                    {renderTableCell(patient, 'visa_status', 'treatment', getVisaBadge(patient.visa_status, patient.days_until_visa_expires))}
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'treatment')}
                    {permissions.shouldShowField('actions', 'treatment') && (
                      <td className="border-2 border-gray-400 px-4 py-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddReturnTickets(patient)}
                        >
                          <Plane className="h-4 w-4 mr-1 rotate-45" />
                          {patient.departure_datetime ? 'Редактировать' : 'Добавить билеты'}
                        </Button>
                      </td>
                    )}
                  </>
                )}
                 
                {/* Visa fields */}
                {visibleFieldGroups.includes('visa') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'visa', patient.deal_country)}
                    {renderTableCell(patient, 'clinic_name', 'visa', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'visa', patient.status_name)}
                    {renderTableCell(patient, 'visa_type', 'visa', patient.visa_type)}
                    {renderTableCell(patient, 'visa_days', 'visa', patient.visa_days)}
                    {renderEditableCell(patient, 'china_entry_date', patient.china_entry_date, 
                      (val) => val ? format(parseISO(val as string), 'dd.MM.yyyy', { locale: ru }) : '-', 'visa')}
                    {renderTableCell(patient, 'visa_status', 'visa', getVisaBadge(patient.visa_status, patient.days_until_visa_expires))}
                    {renderTableCell(patient, 'last_day_in_china', 'visa', patient.last_day_in_china, formatDate)}
                  </>
                )}
                
                {/* Personal fields (all roles) */}
                {visibleFieldGroups.includes('personal') && (
                  <>
                    {renderTableCell(patient, 'clinic_full_name', 'personal', patient.clinic_full_name)}
                    {renderTableCell(patient, 'deal_country', 'personal', patient.deal_country)}
                    {renderTableCell(patient, 'patient_city', 'personal', patient.patient_city)}
                    {renderTableCell(patient, 'patient_birthday', 'personal', patient.patient_birthday, formatDate)}
                    {renderTableCell(patient, 'patient_passport', 'personal', patient.patient_passport)}
                    {renderTableCell(patient, 'patient_position', 'personal', patient.patient_position)}
                    {renderTableCell(patient, 'notes', 'personal', patient.notes)}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для обратных билетов */}
      <ReturnTicketsModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedPatient(null);
          }
        }}
        data={returnTicketsData}
        onDataChange={(updates) => {
          setReturnTicketsData(prev => ({ ...prev, ...updates }));
        }}
        onSave={handleSaveReturnTickets}
        cities={cities}
      />
    </StickyHorizontalScroll>
  );
}
