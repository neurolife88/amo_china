
import { PatientData, FieldGroup } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, User, Plane, Calendar, FileText, Edit2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  const [editingField, setEditingField] = useState<{ dealId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (dealId: number, field: string, currentValue: string) => {
    setEditingField({ dealId, field });
    setEditValue(currentValue || '');
  };

  const saveEdit = async (dealId: number, field: string) => {
    try {
      const updates: Partial<PatientData> = {};
      
      if (field === 'apartment_number') {
        updates.apartment_number = editValue;
      } else if (field === 'departure_city') {
        updates.departure_city = editValue;
      } else if (field === 'departure_datetime') {
        updates.departure_datetime = editValue;
      } else if (field === 'departure_flight_number') {
        updates.departure_flight_number = editValue;
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

  const canEdit = (field: string) => {
    return userRole === 'coordinator' && [
      'apartment_number', // Включаю обратно
      'departure_city', 
      'departure_datetime', 
      'departure_flight_number'
    ].includes(field);
  };

  const renderEditableField = (patient: PatientData, field: string, value: string | null, label: string, formatValue?: (val: string | null) => string) => {
    const displayValue = formatValue ? formatValue(value) : (value || '-');
    const rawValue = value || '';

    if (isEditing(patient.deal_id, field)) {
      return (
        <div>
          <span className="text-muted-foreground">{label}:</span>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
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
          {canEdit(field) && (
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
                 </div>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
