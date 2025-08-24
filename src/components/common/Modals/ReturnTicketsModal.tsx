/**
 * Модалка для редактирования обратных билетов
 */
import React from 'react';
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
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  onSave: () => void | Promise<void>;
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
  const handleSave = async () => {
    if (loading) return;
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать обратные билеты</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Transport Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departure_transport_type" className="text-right">
              Транспорт
            </Label>
            <Select
              value={data?.departure_transport_type || ''}
              onValueChange={(value) => onDataChange({ departure_transport_type: value })}
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
              value={data?.departure_city || ''}
              onValueChange={(value) => onDataChange({ departure_city: value })}
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
              Рейс
            </Label>
            <Input
              id="departure_flight_number"
              value={data?.departure_flight_number || ''}
              onChange={(e) => onDataChange({ departure_flight_number: e.target.value })}
              className="col-span-3"
              placeholder="Номер рейса"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
