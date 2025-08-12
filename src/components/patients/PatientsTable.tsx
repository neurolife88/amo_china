
import { useState, useEffect, useMemo } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { PatientFilters, FieldGroup } from '@/types/patient';
import { FilterPanel } from './FilterPanel';
import { PatientTableDesktop } from './PatientTableDesktop';
import { PatientCardsMobile } from './PatientCardsMobile';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getSortedPatientsForFieldGroup } from '@/lib/sorting';

export function PatientsTable() {
  const { profile } = useAuth();
  const { patients, loading, error, loadPatients, updatePatient } = usePatients();
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState<PatientFilters>({
    search: ''
  });

  const [visibleFieldGroups, setVisibleFieldGroups] = useState<FieldGroup[]>(['basic']);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load patients when filters change
  useEffect(() => {
    if (profile) {
      loadPatients(filters);
    }
  }, [filters, profile, loadPatients]);

  const handleFilterChange = (newFilters: PatientFilters) => {
    setFilters(newFilters);
  };

  const handleFieldGroupToggle = (group: FieldGroup) => {
    setVisibleFieldGroups([group]);
  };

  // Автоматическая сортировка и фильтрация пациентов в зависимости от выбранной группы полей
  const sortedPatients = useMemo(() => {
    if (patients.length === 0) return patients;
    
    const currentFieldGroup = visibleFieldGroups[0];
    if (!currentFieldGroup) return patients;
    

    
    // Фильтрация по статусам в зависимости от выбранной группы
    let filteredPatients = patients;
    
    switch (currentFieldGroup) {
      case 'arrival':
        // Только "Билеты куплены" и "квартира заказана"
        filteredPatients = patients.filter(p => 
          p.status_name === 'Билеты куплены' || p.status_name === 'квартира заказана'
        );
        break;
        
      case 'treatment':
        // Только "на лечении" и "обратные билеты с лечения"
        filteredPatients = patients.filter(p => 
          p.status_name === 'на лечении' || p.status_name === 'обратные билеты с лечения'
        );
        break;
        
      case 'departure':
        // Статус "на лечении" ИЛИ "обратные билеты с лечения" 
        // И заполнена дата убытия в правильном диапазоне (сегодня-2дня до сегодня+1год)
        filteredPatients = patients.filter(p => {
          // Проверяем статус
          const hasCorrectStatus = p.status_name === 'на лечении' || p.status_name === 'обратные билеты с лечения';
          
          // Если статус неправильный или дата убытия не заполнена - исключаем
          if (!hasCorrectStatus || !p.departure_datetime) return false;
          
          // Проверяем диапазон даты убытия
          try {
            const departureDate = new Date(p.departure_datetime);
            const now = new Date();
            
            // Сегодня минус 2 дня
            const twoDaysAgo = new Date(now);
            twoDaysAgo.setDate(now.getDate() - 2);
            
            // Сегодня плюс 1 год
            const oneYearFromNow = new Date(now);
            oneYearFromNow.setFullYear(now.getFullYear() + 1);
            
            return departureDate >= twoDaysAgo && departureDate <= oneYearFromNow;
          } catch (error) {
            // Если дата невалидная - исключаем
            return false;
          }
        });
        break;
        
      case 'basic':
      case 'visa':
      case 'personal':
        // Показываем всех (без фильтрации)
        break;
        
      default:
        break;
    }
    

    

    
    const sortedPatients = getSortedPatientsForFieldGroup(filteredPatients, currentFieldGroup);
    

    
    return sortedPatients;
  }, [patients, visibleFieldGroups]);

  if (!profile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Профиль пользователя не загружен. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Управление пациентами</h1>
        <p className="text-muted-foreground">
          {profile.role === 'coordinator' 
            ? `Клиника: ${profile.clinic_name}` 
            : 'Все клиники'}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel 
        onFilterChange={handleFilterChange} 
        currentFilters={filters}
      />

      {/* Field Group Toggles */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { 
              key: 'basic', 
              label: 'ВСЕ', 
              count: patients.length,
              enabled: true 
            },
            { 
              key: 'arrival', 
              label: 'Прибытие', 
              count: patients.filter(p => p.status_name === 'Билеты куплены' || p.status_name === 'квартира заказана').length,
              enabled: true 
            },
            { 
              key: 'treatment', 
              label: 'На лечении', 
              count: patients.filter(p => p.status_name === 'на лечении' || p.status_name === 'обратные билеты с лечения').length,
              enabled: true 
            },
            { 
              key: 'departure', 
              label: 'Обратные билеты', 
              count: patients.filter(p => p.status_name === 'обратные билеты с лечения').length,
              enabled: true 
            },
            { 
              key: 'visa', 
              label: 'Виза', 
              count: 0,
              enabled: true 
            },
            { 
              key: 'personal', 
              label: 'Личные данные', 
              count: 0,
              enabled: profile.role === 'super_admin' 
            }
          ].filter(group => group.enabled).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFieldGroupToggle(key as FieldGroup)}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex flex-col items-center gap-1 ${
                visibleFieldGroups.includes(key as FieldGroup)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки данных: {error}
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Пациенты не найдены</p>
          <p className="text-sm">Попробуйте изменить фильтры поиска</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <PatientCardsMobile 
              patients={sortedPatients}
              visibleFieldGroups={visibleFieldGroups}
              onPatientUpdate={updatePatient}
              userRole={profile.role}
            />
          ) : (
            <PatientTableDesktop 
              patients={sortedPatients}
              visibleFieldGroups={visibleFieldGroups}
              onPatientUpdate={updatePatient}
              userRole={profile.role}
            />
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            Найдено пациентов: {sortedPatients.length}
          </div>
        </>
      )}
    </div>
  );
}
