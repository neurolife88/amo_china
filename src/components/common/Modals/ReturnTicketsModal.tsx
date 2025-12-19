/**
 * Модалка для редактирования обратных билетов
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Trash2, Plane, TrainFront } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslations } from '@/hooks/useTranslations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReturnTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    departure_transport_type: string;
    departure_city: string;
    departure_datetime: Date | null;
    departure_flight_number: string;
  };
  onDataChange: (updates: Partial<ReturnTicketsModalProps['data']>) => void;
  onSave: (data?: ReturnTicketsModalProps['data']) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  cities: Array<{ id: number; city_name: string }>;
}

export function ReturnTicketsModal({
  open,
  onOpenChange,
  data,
  onDataChange,
  onSave,
  loading = false,
  cities,
}: ReturnTicketsModalProps) {
  const { patients: patientTranslations } = useTranslations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleSave = async () => {
    if (loading) return;
    await onSave(data);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    // Установить все поля в null в локальном состоянии
    onDataChange({
      departure_transport_type: null,
      departure_city: null,
      departure_datetime: null,
      departure_flight_number: null
    });

    // Вызвать onSave для сохранения в БД с null значениями
    await onSave({
      departure_transport_type: null,
      departure_city: null,
      departure_datetime: null,
      departure_flight_number: null
    });

    // Закрыть диалог подтверждения и модальное окно
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  // Проверяем, есть ли данные в полях
  const hasData = data?.departure_transport_type || data?.departure_city || 
    data?.departure_datetime || data?.departure_flight_number;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={data?.departure_transport_type || ''}
              onValueChange={(value) => onDataChange({ departure_transport_type: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={patientTranslations.placeholders.selectTransport()} />
              </SelectTrigger>
              <SelectContent>
                   <SelectItem value="Самолет">
                     <div className="flex items-center gap-2">
                       <Plane className="h-4 w-4" />
                       <span>Самолет</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="Поезд">
                     <div className="flex items-center gap-2">
                       <TrainFront className="h-4 w-4" />
                       <span>Поезд</span>
                     </div>
                   </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departure_city" className="text-right">
              {patientTranslations.modals.returnTickets.city()}
            </Label>
            <Select
              value={data?.departure_city || ''}
              onValueChange={(value) => onDataChange({ departure_city: value })}
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
                    {data?.departure_datetime ? (
                      format(data.departure_datetime, 'dd.MM.yyyy HH:mm', { locale: ru })
                    ) : (
                      <span className="text-muted-foreground">Дата</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                                  <CalendarComponent
                  mode="single"
                  selected={data?.departure_datetime || undefined}
                  onSelect={(date) => {
                    if (!date) {
                      onDataChange({ departure_datetime: null });
                      return;
                    }
                    const newDateTime = new Date(date);
                    if (data?.departure_datetime) {
                      newDateTime.setHours(data.departure_datetime.getHours());
                      newDateTime.setMinutes(data.departure_datetime.getMinutes());
                    } else {
                      // Установить время по умолчанию, если дата устанавливается впервые
                      newDateTime.setHours(12);
                      newDateTime.setMinutes(0);
                    }
                    onDataChange({ departure_datetime: newDateTime });
                  }}
                  initialFocus
                />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={data?.departure_datetime ? format(data.departure_datetime, 'HH:mm') : '12:00'}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  if (data?.departure_datetime) {
                    const newDateTime = new Date(data.departure_datetime);
                    newDateTime.setHours(hours);
                    newDateTime.setMinutes(minutes);
                    onDataChange({ departure_datetime: newDateTime });
                  } else {
                    // Если дата не выбрана, установить текущую дату с выбранным временем
                    const newDateTime = new Date();
                    newDateTime.setHours(hours);
                    newDateTime.setMinutes(minutes);
                    onDataChange({ departure_datetime: newDateTime });
                  }
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
              value={data?.departure_flight_number || ''}
              onChange={(e) => onDataChange({ departure_flight_number: e.target.value })}
              className="col-span-3"
              placeholder={patientTranslations.modals.returnTickets.flightNumber()}
            />
          </div>
        </div>
        <DialogFooter>
            <div className="flex justify-between w-full">
              {/* Кнопка удаления слева (показывать условно) */}
              {hasData && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить билеты
                </Button>
              )}
              
              {/* Кнопки Отмена/Сохранить справа */}
              <div className={`flex gap-2 ${!hasData ? 'ml-auto' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {patientTranslations.modals.returnTickets.cancel()}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {patientTranslations.modals.returnTickets.save()}
          </Button>
              </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить данные о билетах?</AlertDialogTitle>
            <AlertDialogDescription>
              Все данные об обратных билетах будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
