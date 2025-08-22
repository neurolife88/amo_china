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
  
  // Отладочная информация для проверки данных пациентов
  console.log('🔍 PatientTableDesktop rendering, patients data:', patients.map(p => ({ deal_id: p.deal_id, china_entry_date: p.china_entry_date })));
  
  // Используем новую систему прав вместо передачи userRole
  const permissions = usePermissions();
  const { toast } = useToast();
  const { cities } = useCities();
  
  // Отладочная информация
  console.log('🔍 Debug permissions:', {
    userRole: permissions.userRole,
    userClinic: permissions.userClinic,
    canEditNotes: permissions.canEdit('notes'),
    canEditNotesBasic: permissions.canEdit('notes', { fieldGroup: 'basic' }),
    canEditNotesArrival: permissions.canEdit('notes', { fieldGroup: 'arrival' }),
    canEditNotesDeparture: permissions.canEdit('notes', { fieldGroup: 'departure' }),
    canEditNotesTreatment: permissions.canEdit('notes', { fieldGroup: 'treatment' }),
    canEditNotesVisa: permissions.canEdit('notes', { fieldGroup: 'visa' }),
    canEditNotesPersonal: permissions.canEdit('notes', { fieldGroup: 'personal' }),
  });
  
  const [editingField, setEditingField] = useState<{ dealId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  
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

  const startEditing = (dealId: number, field: string, currentValue: string | null, fieldGroup?: string) => {
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

  const saveEdit = async (dealId: number, field: string, value: string, fieldGroup?: string) => {
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
         console.log('🔧 Calling onPatientUpdate with:', { china_entry_date: value });
         await onPatientUpdate(dealId, { china_entry_date: value });
         console.log('🔧 onPatientUpdate completed');
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
          updates[field as keyof PatientData] = formattedValue as any;
        } else {
          updates[field as keyof PatientData] = value as any;
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

  const renderEditableCell = (
    patient: PatientData, 
    field: string, 
    value: string | null, 
    formatValue?: (val: string | null) => string, 
    fieldGroup?: string
  ) => {
    // Отладочная информация для china_entry_date
    if (field === 'china_entry_date') {
      console.log('🔍 renderEditableCell china_entry_date:', {
        patientId: patient.deal_id,
        value: value,
        patientData: patient.china_entry_date
      });
    }
    
    const displayValue = formatValue ? formatValue(value) : (value || '-');
    const rawValue = value || '';

    // Специальная обработка для поля notes
    if (field === 'notes') {
      return (
        <td className="border-2 border-gray-400 px-4 py-2">
          <PermissionGate 
            field="notes" 
            fieldContext={{ targetClinic: patient.clinic_name }}
            fallback={<ExpandableText text={value} maxLength={10} />}
          >
            <EditableNotesCell
              value={value}
              onSave={async (newValue: string) => {
                console.log('EditableNotesCell onSave called with:', newValue);
                console.log('Patient deal_id:', patient.deal_id);
                
                try {
                  const updates: Partial<PatientData> = { notes: newValue };
                  console.log('Calling onPatientUpdate with updates:', updates);
                  await onPatientUpdate(patient.deal_id, updates);
                  console.log('onPatientUpdate completed successfully');
                  
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
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => saveEdit(patient.deal_id, field, editValue, fieldGroup)}
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
              <Select value={editValue} onValueChange={setEditValue}>
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
              <Select value={editValue} onValueChange={setEditValue}>
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
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-sm"
                type={field === 'departure_datetime' ? 'datetime-local' : 'text'}
                autoFocus
              />
            )}
            <Button
              size="sm"
              onClick={() => saveEdit(patient.deal_id, field, editValue, fieldGroup)}
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

  // Добавлю функции для условного рендеринга
  const renderTableHeader = (fieldName: string, fieldGroup: FieldGroup, displayName: string, style?: any) => {
    if (!permissions.shouldShowField(fieldName, fieldGroup)) {
      return null;
    }
    return (
      <th 
        className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" 
        style={style}
      >
        {displayName}
      </th>
    );
  };

  const renderTableCell = (patient: PatientData, fieldName: string, fieldGroup: FieldGroup, value: any) => {
    if (!permissions.shouldShowField(fieldName, fieldGroup)) {
      return null;
    }
    return <td className="border-2 border-gray-400 px-4 py-2">{value || '-'}</td>;
  };

  return (
    <StickyHorizontalScroll>
      <div className="overflow-x-auto">
        <style jsx>{`
          .force-narrow-cols .treatment-col-1 { width: 25px !important; min-width: 25px !important; max-width: 25px !important; }
          .force-narrow-cols .treatment-col-2 { width: 14px !important; min-width: 14px !important; max-width: 14px !important; }
          .force-narrow-cols .treatment-col-3 { width: 32px !important; min-width: 32px !important; max-width: 32px !important; }
        `}</style>
        <table 
          style={{ width: 'max-content', tableLayout: 'fixed' }}
          className="border-collapse border-2 border-gray-400 force-narrow-cols"
        >
        <thead>
          <tr className="bg-gray-50">
            {/* Пациент всегда отображается */}
            <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '49px', minWidth: '49px', maxWidth: '49px'}}>Пациент</th>
            <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '38px', minWidth: '38px', maxWidth: '38px'}}>中文名字</th>
            
            {/* Basic fields */}
            {visibleFieldGroups.includes('basic') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Страна</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Город</th>
                {renderTableHeader('clinic_name', 'basic', 'Клиника', {width: '80px'})}
                {renderTableHeader('status_name', 'basic', 'Статус сделки', {width: '70px'})}
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '90px'}}>Дата и время прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Транспорт</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Рейс</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Квартира</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Тип визы</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Количество дней в визе</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Истекает</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Примечание</th>
              </>
            )}
            
            {/* Arrival fields */}
            {visibleFieldGroups.includes('arrival') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                {renderTableHeader('clinic_name', 'arrival', 'Клиника', {width: '100px'})}
                {renderTableHeader('status_name', 'arrival', 'Статус сделки', {width: '90px'})}
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '110px'}}>Дата и время прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '75px', minWidth: '75px', maxWidth: '75px'}}>Транспорт</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '40px', minWidth: '40px', maxWidth: '40px'}}>Код аэропорта</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Город прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Рейс</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '30px', minWidth: '30px', maxWidth: '30px'}}>Т-нал</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '40px', minWidth: '40px', maxWidth: '40px'}}>ПАС</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Квартира</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Примечание</th>
              </>
            )}
            
            {/* Departure fields */}
            {visibleFieldGroups.includes('departure') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                {renderTableHeader('clinic_name', 'departure', 'Клиника', {width: '100px'})}
                {renderTableHeader('status_name', 'departure', 'Статус сделки', {width: '90px'})}
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '110px'}}>Дата и время прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '110px'}}>Дата и время убытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Транспорт</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Город убытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Номер рейса</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Примечание</th>
              </>
            )}
             
            {/* Treatment fields */}
            {visibleFieldGroups.includes('treatment') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words treatment-col-1" style={{width: '25px', minWidth: '25px', maxWidth: '25px'}}>Страна</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words treatment-col-2" style={{width: '14px', minWidth: '14px', maxWidth: '14px'}}>Номер квартиры</th>
                {renderTableHeader('clinic_name', 'treatment', 'Клиника', {width: '32px', minWidth: '32px', maxWidth: '32px'})}
                {renderTableHeader('status_name', 'treatment', 'Статус сделки', {width: '70px'})}
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '55px'}}>Дата прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '55px'}}>Дата убытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '50px'}}>Виза истекает</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Примечание</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Действия</th>
              </>
            )}
             
            {/* Visa fields */}
            {visibleFieldGroups.includes('visa') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                {renderTableHeader('clinic_name', 'visa', 'Клиника', {width: '100px'})}
                {renderTableHeader('status_name', 'visa', 'Статус сделки', {width: '90px'})}
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Тип визы</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Количество дней в визе</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Дата въезда в Китай</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Истекает</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Истекает дата</th>
              </>
            )}
            
            {/* Personal fields (super admin only) */}
            {visibleFieldGroups.includes('personal') && permissions.isSuperAdmin && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Город</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Дата рождения</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Номер паспорта</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Должность</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '120px'}}>Примечание</th>
              </>
            )}
          </tr>
        </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={`${patient.deal_id}-${patient.patient_full_name}-${index}`} className="hover:bg-gray-50">
                {/* Пациент всегда отображается */}
                <td className="border-2 border-gray-400 px-4 py-2">
                  {patient.patient_full_name || '-'}
                </td>
                {visibleFieldGroups.includes('treatment') ? 
                  renderEditableCell(patient, 'patient_chinese_name', patient.patient_chinese_name, undefined, 'treatment') : 
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_chinese_name || '-'}</td>
                }
                
                {/* Basic fields */}
                {visibleFieldGroups.includes('basic') && (
                  <>
                    {renderTableCell(patient, 'deal_country', 'basic', patient.deal_country)}
                    {renderTableCell(patient, 'patient_city', 'basic', patient.patient_city)}
                    {renderTableCell(patient, 'clinic_name', 'basic', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'basic', patient.status_name)}
                    <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_transport_type || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_flight_number || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.apartment_number || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_type || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_days || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">
                      {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                    </td>
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'basic')}
                  </>
                )}
                
                {/* Arrival fields */}
                {visibleFieldGroups.includes('arrival') && (
                  <>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                    {renderTableCell(patient, 'clinic_name', 'arrival', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'arrival', patient.status_name)}
                    <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_transport_type || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.departure_airport_code || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_city || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_flight_number || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_terminal || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.passengers_count || '-'}</td>
                    {renderEditableCell(patient, 'apartment_number', patient.apartment_number, undefined, 'arrival')}
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'arrival')}
                  </>
                )}
                
                {/* Departure fields */}
                {visibleFieldGroups.includes('departure') && (
                  <>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                    {renderTableCell(patient, 'clinic_name', 'departure', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'departure', patient.status_name)}
                    <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
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
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                    {renderEditableCell(patient, 'apartment_number', patient.apartment_number, undefined, 'treatment')}
                    {renderTableCell(patient, 'clinic_name', 'treatment', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'treatment', patient.status_name)}
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_datetime ? format(parseISO(patient.arrival_datetime), 'dd.MM.yyyy', { locale: ru }) : '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.departure_datetime)}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">
                      {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                    </td>
                    {renderEditableCell(patient, 'notes', patient.notes, undefined, 'treatment')}
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
                  </>
                )}
                 
                {/* Visa fields */}
                {visibleFieldGroups.includes('visa') && (
                  <>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                    {renderTableCell(patient, 'clinic_name', 'visa', patient.clinic_name)}
                    {renderTableCell(patient, 'status_name', 'visa', patient.status_name)}
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_type || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_days || '-'}</td>
                    {renderEditableCell(patient, 'china_entry_date', patient.china_entry_date, 
                      (val) => val ? format(parseISO(val), 'dd.MM.yyyy', { locale: ru }) : '-', 'visa')}
                    <td className="border-2 border-gray-400 px-4 py-2">
                      {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                    </td>
                    <td className="border-2 border-gray-400 px-4 py-2">
                      {patient.last_day_in_china ? 
                        format(parseISO(patient.last_day_in_china), 'dd.MM.yyyy', { locale: ru }) : '-'}
                    </td>
                  </>
                )}
                
                {/* Personal fields (super admin only) */}
                {visibleFieldGroups.includes('personal') && permissions.isSuperAdmin && (
                  <>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_city || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.patient_birthday)}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_passport || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_position || '-'}</td>
                    <td className="border-2 border-gray-400 px-4 py-2">{patient.notes || '-'}</td>
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
