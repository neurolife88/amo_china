
import { PatientData, FieldGroup } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronDown, User, Plane, Calendar, FileText, Edit2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCities } from '@/hooks/useCities';
import ExpandableText from '../ExpandableText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EditableNotesCell } from './EditableNotesCell';
import { ClinicLogo } from '@/components/common/ClinicLogo';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslations } from '@/hooks/useTranslations';
import { getSortedPatientsForFieldGroup } from '@/lib/sorting';

interface PatientCardsMobileProps {
  patients: PatientData[];
  visibleFieldGroups: FieldGroup[];
  onPatientUpdate: (dealId: number, updates: Partial<PatientData>) => Promise<void>;
  userRole: 'super_admin' | 'director' | 'coordinator';
}

export function PatientCardsMobile({ 
  patients, 
  visibleFieldGroups, 
  onPatientUpdate, 
  userRole 
}: PatientCardsMobileProps) {
  const { toast } = useToast();
  const { cities } = useCities();
  const permissions = usePermissions();
  const { patients: patientTranslations } = useTranslations();
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  const [editingField, setEditingField] = useState<{ dealId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingChineseName, setEditingChineseName] = useState<number | null>(null);
  const [chineseNameValue, setChineseNameValue] = useState<string>('');
  
  // Return tickets modal state
  const [showReturnTicketsModal, setShowReturnTicketsModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [returnTicketsData, setReturnTicketsData] = useState({
    departure_transport_type: '',
    departure_city: '',
    departure_datetime: null as Date | null,
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

  const startEditingChineseName = (dealId: number, currentValue: string) => {
    setEditingChineseName(dealId);
    setChineseNameValue(currentValue || '');
  };

  const saveChineseName = async (dealId: number) => {
    try {
      await onPatientUpdate(dealId, { patient_chinese_name: chineseNameValue });
      setEditingChineseName(null);
      setChineseNameValue('');
      toast({
        title: patientTranslations.toasts.success.updated(),
        description: patientTranslations.toasts.success.patientDataUpdated(),
      });
    } catch (error) {
      console.error('Error saving Chinese name:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: patientTranslations.toasts.error.updateFailed(),
        description: `Не удалось обновить китайское имя: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const cancelChineseNameEdit = () => {
    setEditingChineseName(null);
    setChineseNameValue('');
  };

  const saveEdit = async (dealId: number, field: string) => {
    try {
      const updates: Partial<PatientData> = {};
      
      if (field === 'apartment_number') {
        updates.apartment_number = editValue;
      } else if (field === 'departure_city') {
        updates.departure_city = editValue;
      } else if (field === 'departure_datetime') {
        if (editValue && editValue.trim() !== '') {
          try {
            const date = new Date(editValue);
            // Форматируем время без UTC конвертации
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            updates.departure_datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          } catch (error) {
            updates.departure_datetime = editValue;
          }
        } else {
          // Сохраняем пустое значение
          updates.departure_datetime = null;
        }
      } else if (field === 'departure_flight_number') {
        // Сохраняем значение как есть (включая пустые строки)
        updates.departure_flight_number = editValue;
      } else if (field === 'departure_transport_type') {
        // Сохраняем значение как есть (включая пустые строки)
        updates.departure_transport_type = editValue;
      } else if (field === 'patient_chinese_name') {
        // Сохраняем значение как есть (включая пустые строки)
        updates.patient_chinese_name = editValue;
      }

      console.log('Saving mobile edit for dealId:', dealId, 'field:', field, 'value:', editValue);
      console.log('Updates object being sent:', updates);
      await onPatientUpdate(dealId, updates);
      setEditingField(null);
      setEditValue(''); // Очищаем значение после сохранения
      toast({
        title: patientTranslations.toasts.success.updated(),
        description: patientTranslations.toasts.success.patientDataUpdated(),
      });
    } catch (error) {
      console.error('Error saving mobile edit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: patientTranslations.toasts.error.updateFailed(),
        description: `${patientTranslations.toasts.error.failedToUpdate}: ${errorMessage}`,
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
      'apartment_number',
      'departure_city', 
      'departure_datetime', 
      'departure_flight_number',
      'departure_transport_type',
      'notes' // Добавляем поддержку редактирования примечаний
    ];
    
    // Китайское имя можно редактировать во всех группах
    if (field === 'patient_chinese_name') {
      return (userRole === 'coordinator' || userRole === 'super_admin');
    }
    
    // Примечания могут редактировать все роли
    if (field === 'notes') {
      return userRole === 'coordinator' || userRole === 'director' || userRole === 'super_admin';
    }
    
    return (userRole === 'coordinator' || userRole === 'super_admin') && editableFields.includes(field);
  };

  const renderEditableField = (patient: PatientData, field: string, label: string, fieldGroup: FieldGroup) => {
    const rawValue = patient[field as keyof PatientData] as string;
    const displayValue = rawValue || '-';
    const canEditField = permissions.canEdit(field, { fieldGroup });

    if (isEditing(patient.deal_id, field)) {
      return (
        <div className="text-sm bg-blue-50/50 border border-blue-200/50 rounded-lg p-2">
          <span className="text-muted-foreground">{label}:</span>
          <div className="flex items-center gap-2 mt-1">
            {field === 'departure_city' ? (
              <Select
                value={editValue}
                onValueChange={(value) => setEditValue(value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={patientTranslations.placeholders.selectCity()} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.city_name}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field === 'departure_transport_type' ? (
              <Select
                value={editValue}
                onValueChange={(value) => setEditValue(value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={patientTranslations.placeholders.selectTransport()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Самолет">Самолет</SelectItem>
                  <SelectItem value="Поезд">Поезд</SelectItem>
                </SelectContent>
              </Select>
            ) : field === 'departure_datetime' ? (
              <Input
                type="datetime-local"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-base"
                autoFocus
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveEdit(patient.deal_id, field)}
              className="h-8 w-8 p-0 bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 rounded-full shadow-sm transition-all duration-200 hover:scale-110"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full shadow-sm transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={`text-sm ${canEditField ? 'group relative bg-blue-50/50 border border-blue-200/50 rounded-lg p-2 hover:bg-blue-100/50 transition-colors' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-muted-foreground">{label}:</span>
            <div className="font-medium">{displayValue}</div>
          </div>
          {canEditField && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(patient.deal_id, field, rawValue)}
              className="h-8 w-8 p-0 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full shadow-sm transition-all duration-200 hover:scale-110"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      // Парсим время как есть, без UTC конвертации
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants = {
      'Arriving': 'default',
      'In Treatment': 'secondary', 
      'Departed': 'outline',
      'Unknown': 'destructive'
    } as const;

    const labels = {
      'Arriving': 'Прибывает',
      'In Treatment': 'На лечении',
      'Departed': 'Отбыл',
      'Unknown': 'Неизвестно'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const toggleCard = (dealId: number) => {
    setOpenCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleAddReturnTickets = (dealId: number) => {
    const patient = patients.find(p => p.deal_id === dealId);
    setSelectedDealId(dealId);
    
    // Загружаем существующие данные, если они есть
    setReturnTicketsData({
      departure_transport_type: patient?.departure_transport_type || '',
      departure_city: patient?.departure_city || '',
      departure_datetime: patient?.departure_datetime ? new Date(patient.departure_datetime) : null,
      departure_flight_number: patient?.departure_flight_number || ''
    });
    setShowReturnTicketsModal(true);
  };

  const handleSaveReturnTickets = async () => {
    if (!selectedDealId) return;
    
    try {
      // Сохраняем время как простую строку без создания Date объекта
      let departureDateTime = null;
      if (returnTicketsData.departure_datetime) {
        const date = new Date(returnTicketsData.departure_datetime);
        
        // Просто форматируем строку без создания нового Date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Используем время как есть, без конвертации
        departureDateTime = `${year}-${month}-${day} ${date.getHours()}:${date.getMinutes()}:00`;
      }

              await onPatientUpdate(selectedDealId, {
          departure_transport_type: returnTicketsData.departure_transport_type,
          departure_city: returnTicketsData.departure_city,
        departure_datetime: departureDateTime,
          departure_flight_number: returnTicketsData.departure_flight_number
        });
      
      setShowReturnTicketsModal(false);
      setSelectedDealId(null);
      toast({
        title: patientTranslations.toasts.success.updated(),
        description: patientTranslations.toasts.success.patientDataUpdated(),
      });
    } catch (error) {
      console.error('Error saving return tickets:', error);
      toast({
        title: patientTranslations.toasts.error.updateFailed(),
        description: `${patientTranslations.toasts.error.failedToUpdate}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
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
      departure_flight_number: ''
    });
  };

  // Используем правильную сортировку для текущей группы полей
  const currentFieldGroup = visibleFieldGroups[0];
  const sortedPatients = currentFieldGroup 
    ? getSortedPatientsForFieldGroup(patients, currentFieldGroup)
    : patients;

  return (
    <div className="space-y-4">
      {sortedPatients.map((patient) => (
        <Card key={patient.deal_id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{patient.patient_full_name || patientTranslations.mobileCards.noName()}</span>
              </CardTitle>
              <div className={`text-base text-muted-foreground font-normal group relative flex items-center space-x-1 ${permissions.canEdit('patient_chinese_name', { fieldGroup: 'basic' }) ? 'bg-blue-50/50 border border-blue-200/50 rounded-lg p-2 hover:bg-blue-100/50 transition-colors' : ''}`}>
                {editingChineseName === patient.deal_id ? (
                  <div className="flex items-center space-x-1">
                    <Input
                      value={chineseNameValue}
                      onChange={(e) => setChineseNameValue(e.target.value)}
                      className="h-6 text-base w-20"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveChineseName(patient.deal_id)}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelChineseNameEdit}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{patient.patient_chinese_name || '-'}</span>
                    {permissions.canEdit('patient_chinese_name', { fieldGroup: 'basic' }) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingChineseName(patient.deal_id, patient.patient_chinese_name || '')}
                        className="h-8 w-8 p-0 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full shadow-sm transition-all duration-200 hover:scale-110"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
                             {permissions.shouldShowField('clinic_name', 'basic') && (
                 <div className="flex items-center space-x-2">
                   <ClinicLogo clinicName={patient.clinic_name} className="w-8 h-8" />
                   <span>{patient.clinic_name || patientTranslations.mobileCards.clinicNotSpecified()}</span>
                 </div>
               )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Arrival Section */}
            {visibleFieldGroups.includes('arrival') && (
              <>
                {/* Дата прибытия - отображается всегда */}
                <div className="text-sm text-muted-foreground">
                  <span>{patientTranslations.mobileCards.arrivalDateTime()}:</span>
                  <div className="font-medium">{formatDate(patient.arrival_datetime)}</div>
                </div>
                
                {/* Выпадающий список с деталями прибытия */}
                <Collapsible
                  open={openCards.has(patient.deal_id)}
                  onOpenChange={() => toggleCard(patient.deal_id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{patientTranslations.mobileCards.arrival()}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openCards.has(patient.deal_id) ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.country()}:</span>
                        <div>{patient.deal_country || '-'}</div>
                      </div>
                      {permissions.shouldShowField('clinic_name', 'arrival') && (
                        <div>
                          <span className="text-muted-foreground">{patientTranslations.mobileCards.clinic()}:</span>
                          <div className="flex items-center space-x-2">
                            <ClinicLogo clinicName={patient.clinic_name} className="w-8 h-8" />
                            <span>{patient.clinic_name || '-'}</span>
                          </div>
                        </div>
                      )}
                      {permissions.shouldShowField('status_name', 'arrival') && (
                        <div>
                          <span className="text-muted-foreground">{patientTranslations.mobileCards.dealStatus()}:</span>
                          <div>{patient.status_name || '-'}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.transport()}:</span>
                        <div>{patient.arrival_transport_type || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.airportCode()}:</span>
                        <div>{patient.departure_airport_code || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.arrivalCity()}:</span>
                        <div>{patient.arrival_city || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.flight()}:</span>
                        <div>{patient.arrival_flight_number || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.terminal()}:</span>
                        <div>{patient.arrival_terminal || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{patientTranslations.mobileCards.passengersCount()}:</span>
                        <div>{patient.passengers_count || '-'}</div>
                      </div>
                      {renderEditableField(patient, 'apartment_number', patientTranslations.mobileCards.apartment(), 'arrival')}
                    </div>
                    
                    {/* Примечание внутри выпадающего списка */}
                    <div className={`pt-2 border-t ${permissions.canEdit('notes', { fieldGroup: 'arrival' }) ? 'bg-blue-50/50 border border-blue-200/50 rounded-lg p-2 hover:bg-blue-100/50 transition-colors' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">{patientTranslations.mobileCards.notes()}</span>
                      </div>
                      <EditableNotesCell
                        value={patient.notes}
                        onSave={async (newValue: string) => {
                          const updates: Partial<PatientData> = { notes: newValue };
                          await onPatientUpdate(patient.deal_id, updates);
                          toast({
                            title: patientTranslations.toasts.success.updated(),
                            description: patientTranslations.toasts.success.patientDataUpdated(),
                          });
                        }}
                        patientName={patient.patient_full_name}
                        patientChineseName={patient.patient_chinese_name}
                        maxDisplayLength={10}
                        canEdit={permissions.canEdit('notes', { fieldGroup: 'arrival' })}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

                         {/* Departure Section */}
             {visibleFieldGroups.includes('departure') && (
               <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20 space-y-2">
                 <div className="flex items-center space-x-2">
                   <Plane className="h-4 w-4 text-orange-600 rotate-45" />
                   <span className="font-medium text-sm">{patientTranslations.mobileCards.departure()}</span>
                 </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                   {renderEditableField(patient, 'departure_datetime', patientTranslations.mobileCards.date(), 'departure')}
                   {renderEditableField(patient, 'departure_city', patientTranslations.mobileCards.city(), 'departure')}
                   {renderEditableField(patient, 'departure_flight_number', patientTranslations.mobileCards.flight(), 'departure')}
                 </div>
               </div>
             )}

             {/* Treatment Section */}
             {visibleFieldGroups.includes('treatment') && (
               <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 space-y-2">
                 <div className="flex items-center space-x-2">
                   <User className="h-4 w-4 text-blue-600" />
                   <span className="font-medium text-sm">{patientTranslations.mobileCards.treatment()}</span>
                 </div>
                 <div className="grid grid-cols-1 gap-2 text-sm">
                   {permissions.shouldShowField('status_name', 'treatment') && (
                     <div>
                       <span className="text-muted-foreground">{patientTranslations.mobileCards.status()}: </span>
                       <span>{patient.status_name}</span>
                     </div>
                   )}
                   {permissions.shouldShowField('clinic_name', 'treatment') && (
                     <div>
                       <span className="text-muted-foreground">{patientTranslations.mobileCards.clinic()}: </span>
                       <span>{patient.clinic_name}</span>
                     </div>
                   )}
                   <div>
                     <span className="text-muted-foreground">{patientTranslations.mobileCards.startDate()}: </span>
                     <span>{formatDate(patient.arrival_datetime)}</span>
                   </div>
                   {renderEditableField(patient, 'apartment_number', patientTranslations.mobileCards.apartment(), 'treatment')}
                 </div>
                 
                 {/* Add Return Tickets Button */}
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="w-full mt-2"
                   onClick={() => handleAddReturnTickets(patient.deal_id)}
                 >
                   <Plane className="h-4 w-4 mr-2 rotate-45" />
                   {patient.departure_datetime ? patientTranslations.actions.editTickets() : patientTranslations.actions.addTickets()}
                 </Button>
               </div>
             )}

             {/* Visa Section */}
             {visibleFieldGroups.includes('visa') && (
              <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">{patientTranslations.mobileCards.visa()}</span>
                  </div>
                                   {patient.visa_status ? (
                   <Badge 
                     variant={patient.visa_status === 'Active' ? 'default' : 'destructive'}
                     className="text-xs"
                   >
                     {patient.visa_status === 'Active' ? 'Активна' :
                      patient.visa_status === 'Expiring Soon' ? 'Истекает' : 'Истекла'}
                   </Badge>
                 ) : (
                   <span className="text-muted-foreground text-xs">-</span>
                 )}
                 </div>
                 <div className="text-sm">
                   <span className="text-muted-foreground">{patientTranslations.mobileCards.type()}:</span> {patient.visa_type || '-'}
                 </div>
                 <div className="text-sm">
                   <span className="text-muted-foreground">{patientTranslations.mobileCards.visaDays()}:</span> {patient.visa_days || '-'}
                 </div>
                 {patient.days_until_visa_expires !== null && (
                   <div className="text-sm">
                     <span className="text-muted-foreground">{patientTranslations.mobileCards.daysUntilExpiry()}:</span>{' '}
                     {patient.days_until_visa_expires > 0 
                       ? `${patient.days_until_visa_expires} дней` 
                       : patient.days_until_visa_expires === 0 
                         ? patientTranslations.mobileCards.expiresToday() 
                         : patientTranslations.mobileCards.expiredDaysAgo(Math.abs(patient.days_until_visa_expires))}
                   </div>
                 )}
                 <div className="text-sm">
                   <span className="text-muted-foreground">{patientTranslations.mobileCards.expiryDate()}:</span>{' '}
                   {patient.last_day_in_china ? 
                     format(parseISO(patient.last_day_in_china), 'dd.MM.yyyy', { locale: ru }) : 
                     '-'
                   }
                 </div>
              </div>
            )}

            {/* Personal Section (Super Admin only) */}
            {visibleFieldGroups.includes('personal') && userRole === 'super_admin' && (
              <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">{patientTranslations.mobileCards.personalData()}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">{patientTranslations.mobileCards.phone()}:</span> {patient.patient_phone || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{patientTranslations.mobileCards.email()}:</span> {patient.patient_email || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{patientTranslations.mobileCards.passport()}:</span> {patient.patient_passport || '-'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Basic Section - показываем в закладке "Все" */}
            {visibleFieldGroups.includes('basic') && (
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">{patientTranslations.mobileCards.basicInfo()}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                   {permissions.shouldShowField('clinic_name', 'basic') && (
                     <div>
                       <span className="text-muted-foreground">{patientTranslations.mobileCards.clinic()}:</span>
                       <div className="flex items-center space-x-2">
                         <ClinicLogo clinicName={patient.clinic_name} className="w-8 h-8" />
                         <span>{patient.clinic_name || '-'}</span>
                       </div>
                     </div>
                   )}
                   {permissions.shouldShowField('status_name', 'basic') && (
                     <div>
                       <span className="text-muted-foreground">{patientTranslations.mobileCards.status()}:</span>
                       <div>{patient.status_name || '-'}</div>
                     </div>
                   )}
                 </div>
              </div>
            )}
            
            {/* Notes Section - показываем в нужных закладках, но НЕ в arrival */}
            {(visibleFieldGroups.includes('basic') || 
              visibleFieldGroups.includes('treatment') || 
              visibleFieldGroups.includes('departure')) && (
              <div className={`p-2 rounded space-y-2 ${permissions.canEdit('notes', { fieldGroup: 'basic' }) ? 'bg-blue-50/50 border border-blue-200/50 hover:bg-blue-100/50 transition-colors' : 'bg-gray-50 dark:bg-gray-950/20'}`}>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">{patientTranslations.mobileCards.notes()}</span>
                </div>
                <EditableNotesCell
                  value={patient.notes}
                  onSave={async (newValue: string) => {
                    const updates: Partial<PatientData> = { notes: newValue };
                    await onPatientUpdate(patient.deal_id, updates);
                    toast({
                      title: patientTranslations.toasts.success.updated(),
                      description: patientTranslations.toasts.success.patientDataUpdated(),
                    });
                  }}
                  patientName={patient.patient_full_name}
                  patientChineseName={patient.patient_chinese_name}
                  maxDisplayLength={10}
                  canEdit={permissions.canEdit('notes', { fieldGroup: 'basic' })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* Return Tickets Modal */}
             <Dialog open={showReturnTicketsModal} onOpenChange={setShowReturnTicketsModal}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{patientTranslations.modals.returnTickets.title()}</DialogTitle>
           </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Transport Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_transport_type" className="text-right">
                {patientTranslations.modals.returnTickets.transportType()}
              </Label>
              <Select
                value={returnTicketsData.departure_transport_type}
                onValueChange={(value) => setReturnTicketsData(prev => ({ ...prev, departure_transport_type: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={patientTranslations.placeholders.selectTransport()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Самолет">Самолет</SelectItem>
                  <SelectItem value="Поезд">Поезд</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_city" className="text-right">
                {patientTranslations.modals.returnTickets.city()}
              </Label>
              <Select
                value={returnTicketsData.departure_city}
                onValueChange={(value) => setReturnTicketsData(prev => ({ ...prev, departure_city: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={patientTranslations.placeholders.selectCity()} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.city_name}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{patientTranslations.modals.returnTickets.dateTime()}</Label>
              <div className="col-span-3 flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {returnTicketsData.departure_datetime ? (
                        format(returnTicketsData.departure_datetime, 'dd.MM.yyyy HH:mm', { locale: ru })
                      ) : (
                        <span className="text-muted-foreground">Дата</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={returnTicketsData.departure_datetime || undefined}
                      onSelect={(date) => {
                        if (!date) {
                          setReturnTicketsData(prev => ({ ...prev, departure_datetime: null }));
                          return;
                        }
                        setReturnTicketsData(prev => {
                          const newDateTime = new Date(date);
                          if (prev.departure_datetime) {
                            newDateTime.setHours(prev.departure_datetime.getHours());
                            newDateTime.setMinutes(prev.departure_datetime.getMinutes());
                          } else {
                            newDateTime.setHours(12);
                            newDateTime.setMinutes(0);
                          }
                          return { ...prev, departure_datetime: newDateTime };
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={returnTicketsData.departure_datetime ? format(returnTicketsData.departure_datetime, 'HH:mm') : '12:00'}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    setReturnTicketsData(prev => {
                      const newDateTime = prev.departure_datetime ? new Date(prev.departure_datetime) : new Date();
                      newDateTime.setHours(hours);
                      newDateTime.setMinutes(minutes);
                      return { ...prev, departure_datetime: newDateTime };
                    });
                  }}
                  className="w-32"
                />
              </div>
            </div>

            {/* Flight Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_flight_number" className="text-right">
                {patientTranslations.modals.returnTickets.flightNumber()}
              </Label>
              <Input
                id="departure_flight_number"
                value={returnTicketsData.departure_flight_number}
                onChange={(e) => setReturnTicketsData(prev => ({ ...prev, departure_flight_number: e.target.value }))}
                className="col-span-3"
                placeholder={patientTranslations.modals.returnTickets.flightNumber()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReturnTickets}>
              {patientTranslations.modals.returnTickets.cancel()}
            </Button>
            <Button onClick={handleSaveReturnTickets}>
              {patientTranslations.modals.returnTickets.save()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
