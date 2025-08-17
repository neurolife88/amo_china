
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

interface PatientTableDesktopProps {
  patients: PatientData[];
  visibleFieldGroups: FieldGroup[];
  onPatientUpdate: (dealId: number, updates: Partial<PatientData>) => Promise<void>;
  userRole: 'super_admin' | 'director' | 'coordinator';
}

export function PatientTableDesktop({ 
  patients, 
  visibleFieldGroups, 
  onPatientUpdate, 
  userRole 
}: PatientTableDesktopProps) {
  const { toast } = useToast();
  const { cities } = useCities();
  const [editingField, setEditingField] = useState<{ dealId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Return tickets modal state
  const [showReturnTicketsModal, setShowReturnTicketsModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [returnTicketsData, setReturnTicketsData] = useState({
    departure_transport_type: '',
    departure_city: '',
    departure_datetime: null as Date | null,
    departure_time: '12:00',
    departure_flight_number: ''
  });

  const startEditing = (dealId: number, field: string, currentValue: string) => {
    setEditingField({ dealId, field });
    
    // Special handling for datetime fields
    if (field === 'departure_datetime' && currentValue) {
      try {
        // Convert from ISO string to datetime-local format
        const date = new Date(currentValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const datetimeLocalValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        setEditValue(datetimeLocalValue);
      } catch (error) {
        setEditValue(currentValue || '');
      }
    } else {
      setEditValue(currentValue || '');
    }
  };

  const saveEdit = async (dealId: number, field: string) => {
    try {
      const updates: Partial<PatientData> = {};
      
      // Map field names to PatientData properties
      const fieldMapping: Record<string, keyof PatientData> = {
        'apartment_number': 'apartment_number',
        'departure_city': 'departure_city',
        'departure_datetime': 'departure_datetime',
        'departure_flight_number': 'departure_flight_number',
        'departure_transport_type': 'departure_transport_type',
        'patient_chinese_name': 'patient_chinese_name'
      };
      
      const propertyName = fieldMapping[field];
      if (propertyName) {
        if (field === 'departure_datetime' && editValue) {
          // Convert datetime-local format to ISO string
          try {
            const date = new Date(editValue);
            (updates as any)[propertyName] = date.toISOString();
          } catch (error) {
            (updates as any)[propertyName] = editValue;
          }
        } else {
          (updates as any)[propertyName] = editValue;
        }
      }

      console.log('Saving edit for dealId:', dealId, 'field:', field, 'value:', editValue);
      await onPatientUpdate(dealId, updates);
      setEditingField(null);
      toast({
        title: "Успешно обновлено",
        description: "Данные пациента обновлены",
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: "Ошибка обновления",
        description: `Не удалось обновить данные: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const isEditing = (dealId: number, field: string) => {
    return editingField?.dealId === dealId && editingField?.field === field;
  };

  const canEdit = (field: string, fieldGroup?: string) => {
    const editableFields = [
      'apartment_number', // Включаю обратно
      'departure_city', 
      'departure_datetime',
      'departure_flight_number',
      'departure_transport_type'
    ];
    
    // Китайское имя можно редактировать только в закладке "На лечении"
    if (field === 'patient_chinese_name') {
      return (userRole === 'coordinator' || userRole === 'super_admin') && fieldGroup === 'treatment';
    }
    
    return (userRole === 'coordinator' || userRole === 'super_admin') && editableFields.includes(field);
  };

  const renderEditableCell = (patient: PatientData, field: string, value: string | null, formatValue?: (val: string | null) => string, fieldGroup?: string) => {
    const displayValue = formatValue ? formatValue(value) : (value || '-');
    const rawValue = value || '';

    if (isEditing(patient.deal_id, field)) {
      // Special handling for different field types
      if (field === 'patient_chinese_name') {
        return (
          <td className="border-2 border-gray-400 px-4 py-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveEdit(patient.deal_id, field);
                  } else if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
                className="h-8 text-sm min-w-[100px]"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveEdit(patient.deal_id, field)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </td>
        );
      }
      
      if (field === 'departure_city') {
        return (
          <td className="border-2 border-gray-400 px-4 py-2">
            <div className="flex items-center gap-2">
              <Select
                value={editValue}
                onValueChange={(value) => setEditValue(value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.city_name}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveEdit(patient.deal_id, field)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </td>
        );
      }
      
      if (field === 'departure_transport_type') {
        return (
          <td className="border-2 border-gray-400 px-4 py-2">
            <div className="flex items-center gap-2">
              <Select
                value={editValue}
                onValueChange={(value) => setEditValue(value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Выберите транспорт" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Самолет">Самолет</SelectItem>
                  <SelectItem value="Поезд">Поезд</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveEdit(patient.deal_id, field)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </td>
        );
      }
      
      if (field === 'departure_datetime') {
        return (
          <td className="border-2 border-gray-400 px-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveEdit(patient.deal_id, field);
                  } else if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveEdit(patient.deal_id, field)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </td>
        );
      }

      // Default input for other fields
      return (
        <td className="border-2 border-gray-400 px-4 py-2">
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(patient.deal_id, field);
                } else if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveEdit(patient.deal_id, field)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      );
    }

    return (
      <td
        className={`border-2 border-gray-400 px-4 py-2 ${canEdit(field, fieldGroup) ? 'cursor-pointer hover:bg-muted/50 group' : ''}`}
        onClick={() => canEdit(field, fieldGroup) && startEditing(patient.deal_id, field, rawValue)}
        title={canEdit(field, fieldGroup) ? 'Клик для редактирования' : ''}
      >
        <div className="flex items-center gap-2">
          <span>{displayValue}</span>
          {canEdit(field, fieldGroup) && (
            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </td>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatDateTimeForEdit = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      'Билеты куплены': { variant: 'default', label: 'Билеты куплены' },
      'на лечении': { variant: 'secondary', label: 'На лечении' },
      'квартира заказана': { variant: 'outline', label: 'Квартира заказана' },
      'обратные билеты с лечения': { variant: 'destructive', label: 'Обратные билеты' }
    };

    const config = statusConfig[status] || { variant: 'outline' as const, label: status };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getVisaBadge = (visaStatus: string | null, daysUntilExpires: number | null) => {
    if (visaStatus === null) return '-';
    
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      'Active': { variant: 'default', label: 'Активна' },
      'Expiring Soon': { variant: 'secondary', label: 'Истекает скоро' },
      'Expired': { variant: 'destructive', label: 'Истекла' }
    };

    const config = statusConfig[visaStatus] || { variant: 'outline' as const, label: visaStatus };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label} {daysUntilExpires !== null ? `(${daysUntilExpires} дн.)` : ''}
      </Badge>
    );
  };

  const handleAddReturnTickets = (dealId: number) => {
    const patient = patients.find(p => p.deal_id === dealId);
    setSelectedDealId(dealId);
    
    // Загружаем существующие данные, если они есть
    let departureTime = '12:00';
    let departureDate = null;
    
    if (patient?.departure_datetime) {
      const date = new Date(patient.departure_datetime);
      departureDate = date;
      departureTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    setReturnTicketsData({
      departure_transport_type: patient?.departure_transport_type || '',
      departure_city: patient?.departure_city || '',
      departure_datetime: departureDate,
      departure_time: departureTime,
      departure_flight_number: patient?.departure_flight_number || ''
    });
    setShowReturnTicketsModal(true);
  };

  const handleSaveReturnTickets = async () => {
    if (!selectedDealId) return;
    
    try {
      // Формируем дату и время для сохранения
      let departureDateTime = null;
      if (returnTicketsData.departure_datetime && returnTicketsData.departure_time) {
        const date = new Date(returnTicketsData.departure_datetime);
        const [hours, minutes] = returnTicketsData.departure_time.split(':');
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        departureDateTime = date.toISOString();
      }

      await onPatientUpdate(selectedDealId, {
        departure_transport_type: returnTicketsData.departure_transport_type,
        departure_city: returnTicketsData.departure_city,
        departure_datetime: departureDateTime,
        departure_flight_number: returnTicketsData.departure_flight_number
      });
      
      setShowReturnTicketsModal(false);
      setSelectedDealId(null);
      setReturnTicketsData({
        departure_transport_type: '',
        departure_city: '',
        departure_datetime: null,
        departure_time: '12:00',
        departure_flight_number: ''
      });
      
      toast({
        title: "Успешно сохранено",
        description: "Данные обратных билетов обновлены",
      });
    } catch (error) {
      console.error('Error saving return tickets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: "Ошибка сохранения",
        description: `Не удалось сохранить данные: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleCancelReturnTickets = () => {
    setShowReturnTicketsModal(false);
    setSelectedDealId(null);
    setReturnTicketsData({
      departure_transport_type: '',
      departure_city: '',
      departure_datetime: null,
      departure_time: '12:00',
      departure_flight_number: ''
    });
  };

  return (
    <>
    <StickyHorizontalScroll>
      <div className="rounded-md border">
        <style>{`
          .force-narrow-cols th:nth-child(1) { width: 49px !important; min-width: 49px !important; max-width: 49px !important; }
          .force-narrow-cols th:nth-child(2) { width: 38px !important; min-width: 38px !important; max-width: 38px !important; }
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
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Статус сделки</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '90px'}}>Дата и время прибытия</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Транспорт</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Рейс</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Квартира</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Тип визы</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Количество дней в визе</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Истекает</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Паспорт номер</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '60px'}}>Город</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Примечание</th>
              </>
            )}
            
            {/* Arrival fields */}
            {visibleFieldGroups.includes('arrival') && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '90px'}}>Статус сделки</th>
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
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '90px'}}>Статус сделки</th>
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
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words treatment-col-3" style={{width: '32px', minWidth: '32px', maxWidth: '32px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '70px'}}>Статус сделки</th>
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
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '90px'}}>Статус сделки</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Тип визы</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Количество дней в визе</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Истекает</th>
              </>
            )}
            
            {/* Personal fields (super admin only) */}
            {visibleFieldGroups.includes('personal') && userRole === 'super_admin' && (
              <>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Клиника</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Страна</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '80px'}}>Город</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Дата рождения</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Номер паспорта</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Телефон</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '140px'}}>Электронный адрес</th>
                <th className="border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words" style={{width: '100px'}}>Должность</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {

            return (
            <tr key={`${patient.deal_id}-${patient.patient_full_name}`} className="group border-b hover:bg-gray-50">
              {/* Пациент всегда отображается */}
              <td className="border-2 border-gray-400 px-4 py-2 font-medium">
                {patient.patient_full_name || '-'}
              </td>
              {/* Китайское имя - редактируемое только в treatment */}
              {visibleFieldGroups.includes('treatment') ? (
                renderEditableCell(patient, 'patient_chinese_name', patient.patient_chinese_name, undefined, 'treatment')
              ) : (
                <td className="border-2 border-gray-400 px-4 py-2">
                  {patient.patient_chinese_name || '-'}
                </td>
              )}
              
              {/* Basic fields */}
              {visibleFieldGroups.includes('basic') && (
                <>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.status_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_transport_type || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_flight_number || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.apartment_number || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_type || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_days || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                  </td>
                  {renderEditableCell(patient, 'patient_passport', patient.patient_passport)}
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_city || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    <ExpandableText text={patient.notes} maxLength={10} />
                  </td>
                </>
              )}
              
              {/* Arrival fields */}
              {visibleFieldGroups.includes('arrival') && (
                <>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.status_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_transport_type || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.departure_airport_code || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_city || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_flight_number || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_terminal || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.passengers_count || '-'}</td>
                  {renderEditableCell(patient, 'apartment_number', patient.apartment_number)}
                  <td className="border-2 border-gray-400 px-4 py-2">
                    <ExpandableText text={patient.notes} maxLength={10} />
                  </td>
                </>
              )}
              
              {/* Departure fields */}
              {visibleFieldGroups.includes('departure') && (
                <>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.status_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.arrival_datetime)}</td>
                  {renderEditableCell(patient, 'departure_datetime', patient.departure_datetime, formatDateTimeForEdit)}
                  {renderEditableCell(patient, 'departure_transport_type', patient.departure_transport_type)}
                  {renderEditableCell(patient, 'departure_city', patient.departure_city)}
                  {renderEditableCell(patient, 'departure_flight_number', patient.departure_flight_number)}
                  <td className="border-2 border-gray-400 px-4 py-2">
                    <ExpandableText text={patient.notes} maxLength={10} />
                  </td>
                </>
              )}
                
              {/* Treatment fields */}
              {visibleFieldGroups.includes('treatment') && (
                <>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.deal_country || '-'}</td>
                  {renderEditableCell(patient, 'apartment_number', patient.apartment_number)}
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.status_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.arrival_datetime ? format(parseISO(patient.arrival_datetime), 'dd.MM.yyyy', { locale: ru }) : '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{formatDate(patient.departure_datetime)}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    <ExpandableText text={patient.notes} maxLength={10} />
                  </td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddReturnTickets(patient.deal_id)}
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
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.status_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_type || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.visa_days || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">
                    {getVisaBadge(patient.visa_status, patient.days_until_visa_expires)}
                  </td>
                </>
              )}
              
              {/* Personal fields (super admin only) */}
              {visibleFieldGroups.includes('personal') && userRole === 'super_admin' && (
                <>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.clinic_name || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_country || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_city || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_birthday ? format(parseISO(patient.patient_birthday), 'dd.MM.yyyy', { locale: ru }) : '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_passport || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_phone || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_email || '-'}</td>
                  <td className="border-2 border-gray-400 px-4 py-2">{patient.patient_position || '-'}</td>
                </>
              )}
            </tr>
          );
          })}
        </tbody>
      </table>
      
      {/* Return Tickets Modal */}
      <ReturnTicketsModal
        open={showReturnTicketsModal}
        onOpenChange={setShowReturnTicketsModal}
        data={returnTicketsData}
        onDataChange={(updates) => setReturnTicketsData(prev => ({ ...prev, ...updates }))}
        onSave={handleSaveReturnTickets}
        cities={cities}
      />
      </div>
    </StickyHorizontalScroll>
    </>
  );
}
