
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
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
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
      
      if (field === 'apartment_number') {
        updates.apartment_number = editValue;
      } else if (field === 'departure_city') {
        updates.departure_city = editValue;
      } else if (field === 'departure_datetime') {
        if (editValue) {
          try {
            const date = new Date(editValue);
            updates.departure_datetime = date.toISOString();
          } catch (error) {
            updates.departure_datetime = editValue;
          }
        } else {
          updates.departure_datetime = editValue;
        }
      } else if (field === 'departure_flight_number') {
        updates.departure_flight_number = editValue;
      } else if (field === 'departure_transport_type') {
        updates.departure_transport_type = editValue;
      } else if (field === 'patient_chinese_name') {
        updates.patient_chinese_name = editValue;
      }

      console.log('Saving mobile edit for dealId:', dealId, 'field:', field, 'value:', editValue);
      await onPatientUpdate(dealId, updates);
      setEditingField(null);
      toast({
        title: "Успешно обновлено",
        description: "Данные пациента обновлены",
      });
    } catch (error) {
      console.error('Error saving mobile edit:', error);
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

  const renderEditableField = (patient: PatientData, field: string, value: string | null, label: string, formatValue?: (val: string | null) => string, fieldGroup?: string) => {
    const displayValue = formatValue ? formatValue(value) : (value || '-');
    const rawValue = value || '';

    if (isEditing(patient.deal_id, field)) {
      return (
        <div>
          <span className="text-muted-foreground">{label}:</span>
          <div className="flex items-center gap-2 mt-1">
            {field === 'departure_city' ? (
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
            ) : field === 'departure_transport_type' ? (
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
                className="h-8 text-sm"
                autoFocus
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveEdit(patient.deal_id, field)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="text-muted-foreground">{label}:</span>
        <div className="flex items-center justify-between group">
          <span>{displayValue}</span>
          {canEdit(field, fieldGroup) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(patient.deal_id, field, rawValue)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
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
      departure_time: patient?.departure_time || '12:00',
      departure_flight_number: patient?.departure_flight_number || ''
    });
    setShowReturnTicketsModal(true);
  };

  const handleSaveReturnTickets = async () => {
    if (!selectedDealId) return;
    
    try {
              await onPatientUpdate(selectedDealId, {
          departure_transport_type: returnTicketsData.departure_transport_type,
          departure_city: returnTicketsData.departure_city,
          departure_datetime: returnTicketsData.departure_datetime ? returnTicketsData.departure_datetime.toISOString() : null,
          departure_time: returnTicketsData.departure_time,
          departure_flight_number: returnTicketsData.departure_flight_number
        });
      
      setShowReturnTicketsModal(false);
      setSelectedDealId(null);
      toast({
        title: "Успешно сохранено",
        description: "Обратные билеты добавлены",
      });
    } catch (error) {
      console.error('Error saving return tickets:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить обратные билеты",
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
    <div className="space-y-4">
      {patients.map((patient) => (
        <Card key={patient.deal_id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{patient.patient_full_name || 'Без имени'}</span>
              </CardTitle>
              {patient.patient_chinese_name && (
                <div className="text-sm text-muted-foreground font-normal">
                  中文名字: {patient.patient_chinese_name}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {patient.clinic_name || 'Клиника не указана'}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Arrival Section */}
            {visibleFieldGroups.includes('arrival') && (
              <Collapsible
                open={openCards.has(patient.deal_id)}
                onOpenChange={() => toggleCard(patient.deal_id)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Прибытие</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openCards.has(patient.deal_id) ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Пациент:</span>
                      <div>{patient.patient_full_name || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Страна:</span>
                      <div>{patient.deal_country || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Клиника:</span>
                      <div>{patient.clinic_name || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Статус сделки:</span>
                      <div>{patient.status_name || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата и время прибытия:</span>
                      <div>{formatDate(patient.arrival_datetime)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Транспорт:</span>
                      <div>{patient.arrival_transport_type || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Код аэропорта:</span>
                      <div>{patient.departure_airport_code || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Город прибытия:</span>
                      <div>{patient.arrival_city || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Рейс:</span>
                      <div>{patient.arrival_flight_number || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Терминал:</span>
                      <div>{patient.arrival_terminal || '-'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Количество пассажиров:</span>
                      <div>{patient.passengers_count || '-'}</div>
                    </div>
                    {renderEditableField(patient, 'apartment_number', patient.apartment_number, 'Квартира')}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

                         {/* Departure Section */}
             {visibleFieldGroups.includes('departure') && (
               <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/20 space-y-2">
                 <div className="flex items-center space-x-2">
                   <Plane className="h-4 w-4 text-orange-600 rotate-45" />
                   <span className="font-medium text-sm">Обратные билеты</span>
                 </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {renderEditableField(patient, 'departure_datetime', patient.departure_datetime, 'Дата', formatDate)}
                    {renderEditableField(patient, 'departure_city', patient.departure_city, 'Город')}
                    {renderEditableField(patient, 'departure_flight_number', patient.departure_flight_number, 'Рейс')}
                  </div>
               </div>
             )}

             {/* Treatment Section */}
             {visibleFieldGroups.includes('treatment') && (
               <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 space-y-2">
                 <div className="flex items-center space-x-2">
                   <User className="h-4 w-4 text-blue-600" />
                   <span className="font-medium text-sm">Лечение</span>
                 </div>
                 <div className="grid grid-cols-1 gap-2 text-sm">
                   <div>
                     <span className="text-muted-foreground">Статус:</span>
                     <div>{patient.status_name || '-'}</div>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Клиника:</span>
                     <div>{patient.clinic_name || '-'}</div>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Дата начала:</span>
                     <div>{formatDate(patient.arrival_datetime)}</div>
                   </div>
                   {renderEditableField(patient, 'apartment_number', patient.apartment_number, 'Квартира')}
                   {renderEditableField(patient, 'patient_chinese_name', patient.patient_chinese_name, '中文名字', undefined, 'treatment')}
                 </div>
                 
                                   {/* Add Return Tickets Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => handleAddReturnTickets(patient.deal_id)}
                  >
                    <Plane className="h-4 w-4 mr-2 rotate-45" />
                    {patient.departure_datetime ? 'Редактировать билеты' : 'Добавить обратные билеты'}
                  </Button>
               </div>
             )}

             {/* Visa Section */}
             {visibleFieldGroups.includes('visa') && (
              <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Виза</span>
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
                  <span className="text-muted-foreground">Тип:</span> {patient.visa_type || '-'}
                </div>
                {patient.days_until_visa_expires !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">До истечения:</span>{' '}
                    {patient.days_until_visa_expires > 0 
                      ? `${patient.days_until_visa_expires} дней` 
                      : patient.days_until_visa_expires === 0 
                        ? 'Истекает сегодня' 
                        : `Просрочено на ${Math.abs(patient.days_until_visa_expires)} дней`}
                  </div>
                )}
              </div>
            )}

            {/* Personal Section (Super Admin only) */}
            {visibleFieldGroups.includes('personal') && userRole === 'super_admin' && (
              <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Личные данные</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Телефон:</span> {patient.patient_phone || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {patient.patient_email || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Паспорт:</span> {patient.patient_passport || '-'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes Section - показываем в нужных закладках */}
            {(visibleFieldGroups.includes('basic') || 
              visibleFieldGroups.includes('arrival') || 
              visibleFieldGroups.includes('treatment') || 
              visibleFieldGroups.includes('departure')) && patient.notes && (
              <div className="p-2 rounded bg-gray-50 dark:bg-gray-950/20 space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">Примечание</span>
                </div>
                <ExpandableText text={patient.notes} maxLength={10} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* Return Tickets Modal */}
             <Dialog open={showReturnTicketsModal} onOpenChange={setShowReturnTicketsModal}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Добавить обратные билеты</DialogTitle>
           </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Transport Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_transport_type" className="text-right">
                Транспорт
              </Label>
              <Select
                value={returnTicketsData.departure_transport_type}
                onValueChange={(value) => setReturnTicketsData(prev => ({ ...prev, departure_transport_type: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите транспорт" />
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
                Город
              </Label>
              <Select
                value={returnTicketsData.departure_city}
                onValueChange={(value) => setReturnTicketsData(prev => ({ ...prev, departure_city: value }))}
              >
                <SelectTrigger className="col-span-3">
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
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Дата и время</Label>
              <div className="col-span-3 flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {returnTicketsData.departure_datetime ? (
                        format(returnTicketsData.departure_datetime, 'dd.MM.yyyy', { locale: ru })
                      ) : (
                        <span className="text-muted-foreground">Дата</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={returnTicketsData.departure_datetime}
                      onSelect={(date) => setReturnTicketsData(prev => ({ ...prev, departure_datetime: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={returnTicketsData.departure_time}
                  onChange={(e) => setReturnTicketsData(prev => ({ ...prev, departure_time: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>

            {/* Flight Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_flight_number" className="text-right">
                Рейс
              </Label>
              <Input
                id="departure_flight_number"
                value={returnTicketsData.departure_flight_number}
                onChange={(e) => setReturnTicketsData(prev => ({ ...prev, departure_flight_number: e.target.value }))}
                className="col-span-3"
                placeholder="Номер рейса"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReturnTickets}>
              Отмена
            </Button>
            <Button onClick={handleSaveReturnTickets}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
