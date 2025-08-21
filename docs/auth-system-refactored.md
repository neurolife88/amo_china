# Рефакторированная система авторизации

## 🎯 Обзор

Система авторизации была полностью рефакторирована для обеспечения:
- **Централизованного управления правами** доступа
- **Лучшей производительности** RLS политик
- **Более простой поддержки** и расширения
- **Консистентности** проверок прав между frontend и backend

## 🏗️ Архитектура

### Frontend (React/TypeScript)

```
src/lib/permissions.ts          # Централизованная система прав
src/hooks/usePermissions.tsx    # Хук для работы с правами
src/hooks/useAuth.tsx           # Улучшенный хук авторизации
```

### Backend (Supabase/PostgreSQL)

```
public.get_user_role()          # Получение роли пользователя
public.get_user_clinic()        # Получение клиники пользователя
public.is_super_admin_user()    # Проверка super_admin
public.is_director_or_higher()  # Проверка director+
public.is_coordinator_or_higher() # Проверка coordinator+
```

## 🔐 Система ролей и прав

### Роли (иерархические)

1. **`coordinator`** (уровень 1) - базовая роль
2. **`director`** (уровень 2) - включает права coordinator
3. **`super_admin`** (уровень 3) - включает права director

### Разрешения (Permissions)

```typescript
const PERMISSIONS = {
  // Управление пользователями
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_USERS: 'view_all_users',
  CHANGE_USER_ROLES: 'change_user_roles',
  
  // Управление пациентами
  VIEW_ALL_PATIENTS: 'view_all_patients',
  VIEW_OWN_CLINIC_PATIENTS: 'view_own_clinic_patients',
  EDIT_PATIENT_BASIC: 'edit_patient_basic',
  EDIT_PATIENT_ADVANCED: 'edit_patient_advanced',
  
  // Поля пациентов
  EDIT_APARTMENT_NUMBER: 'edit_apartment_number',
  EDIT_DEPARTURE_INFO: 'edit_departure_info',
  EDIT_NOTES: 'edit_notes',
  EDIT_CHINA_ENTRY_DATE: 'edit_china_entry_date',
  EDIT_CHINESE_NAME: 'edit_chinese_name',
  
  // Специальные права
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  BYPASS_RLS: 'bypass_rls',
} as const;
```

### Карта ролей и разрешений

```typescript
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  coordinator: [
    'view_own_clinic_patients',
    'edit_patient_basic',
    'edit_apartment_number',
    'edit_departure_info',
    'edit_notes',
    'edit_china_entry_date',
    'edit_chinese_name',
  ],
  
  director: [
    // Все права coordinator +
    'view_all_patients',
    'view_all_clinics',
    'edit_patient_advanced',
  ],
  
  super_admin: [
    // Все права director +
    'manage_users',
    'view_all_users',
    'change_user_roles',
    'manage_clinics',
    'view_audit_logs',
    'bypass_rls',
  ],
};
```

## 🎣 Использование хуков

### usePermissions - основной хук

```typescript
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

function MyComponent() {
  const permissions = usePermissions();
  
  // Проверка конкретного разрешения
  if (permissions.can(PERMISSIONS.EDIT_NOTES)) {
    // Показать кнопку редактирования
  }
  
  // Проверка возможности редактирования поля
  if (permissions.canEdit('apartment_number', { 
    targetClinic: patient.clinic_name 
  })) {
    // Показать поле для редактирования
  }
  
  // Быстрые проверки ролей
  if (permissions.isSuperAdmin) {
    // Показать админ панель
  }
  
  return <div>...</div>;
}
```

### PermissionGate - компонент для условного рендеринга

```typescript
import { PermissionGate, PERMISSIONS } from '@/hooks/usePermissions';

function PatientTable() {
  return (
    <div>
      {/* Показать только пользователям с правом редактирования заметок */}
      <PermissionGate permission={PERMISSIONS.EDIT_NOTES}>
        <EditNotesButton />
      </PermissionGate>
      
      {/* Показать только super_admin */}
      <PermissionGate role="super_admin">
        <AdminPanel />
      </PermissionGate>
      
      {/* Показать только если можно редактировать поле */}
      <PermissionGate 
        field="apartment_number" 
        fieldContext={{ targetClinic: patient.clinic_name }}
      >
        <EditApartmentButton />
      </PermissionGate>
    </div>
  );
}
```

### Специализированные хуки

```typescript
import { 
  useHasPermission, 
  useHasRole, 
  useCanEditField 
} from '@/hooks/usePermissions';

// Проверка конкретного разрешения
const canManageUsers = useHasPermission(PERMISSIONS.MANAGE_USERS);

// Проверка роли
const isSuperAdmin = useHasRole('super_admin');

// Проверка возможности редактирования поля
const canEditNotes = useCanEditField('notes', { 
  targetClinic: patient.clinic_name 
});
```

## 🗄️ RLS политики (оптимизированные)

### Принципы оптимизации

1. **STABLE функции** - кэшируются в рамках запроса
2. **Простые индексы** - для быстрого поиска
3. **Минимум подзапросов** - избегание рекурсии
4. **Четкая структура** - одна политика на операцию

### Основные функции безопасности

```sql
-- Получение роли (оптимизированная, STABLE)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
    SELECT role 
    FROM public.user_profiles 
    WHERE user_id = user_uuid
    LIMIT 1;
$function$;

-- Проверка super_admin (быстрая)
CREATE OR REPLACE FUNCTION public.is_super_admin_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = user_uuid AND role = 'super_admin'
    );
$function$;
```

### Пример политики для таблицы deals

```sql
-- Одна политика для SELECT с четкой логикой
CREATE POLICY "deals_select_policy" ON deals
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR 
    (get_user_role() = 'coordinator' AND clinic_name = get_user_clinic())
);
```

## 🚀 Преимущества новой системы

### ✅ Централизация
- Все права определены в одном месте
- Консистентность между frontend и backend
- Легкое добавление новых ролей и прав

### ✅ Производительность
- STABLE функции кэшируются
- Оптимизированные индексы
- Минимум подзапросов в RLS

### ✅ Безопасность
- Четкая иерархия ролей
- Проверки на уровне базы данных
- Аудит изменений ролей

### ✅ Удобство разработки
- Типизированные разрешения
- Хуки для React компонентов
- Компонент PermissionGate

### ✅ Масштабируемость
- Легко добавить новые роли
- Простое расширение прав
- Поддержка сложных сценариев

## 🔧 Миграция

Для применения новой системы:

1. **Применить миграцию**:
   ```bash
   # Через Supabase CLI или MCP
   supabase db push
   ```

2. **Обновить импорты** в компонентах:
   ```typescript
   // Старый способ
   import { useAuth } from '@/hooks/useAuth';
   const { profile } = useAuth();
   const canEdit = profile.role === 'super_admin';
   
   // Новый способ
   import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
   const permissions = usePermissions();
   const canEdit = permissions.can(PERMISSIONS.EDIT_NOTES);
   ```

3. **Заменить проверки ролей** на проверки разрешений:
   ```typescript
   // Старый способ
   if (userRole === 'coordinator' || userRole === 'super_admin') {
     // логика
   }
   
   // Новый способ
   if (permissions.canEdit('notes', { targetClinic })) {
     // логика
   }
   ```

## 📊 Мониторинг и отладка

### Проверка прав в консоли браузера

```javascript
// В DevTools Console
const permissions = window.__PERMISSIONS_DEBUG__;
console.log('User role:', permissions.userRole);
console.log('Can edit notes:', permissions.canEdit('notes'));
console.log('All permissions:', permissions.getAllPermissions());
```

### SQL запросы для отладки

```sql
-- Проверить роль пользователя
SELECT get_user_role('user-uuid-here');

-- Проверить клинику пользователя
SELECT get_user_clinic('user-uuid-here');

-- Проверить права super_admin
SELECT is_super_admin_user('user-uuid-here');
```

### Логи аудита

```sql
-- Посмотреть изменения ролей
SELECT * FROM audit_log 
WHERE action = 'role_elevation' 
ORDER BY timestamp DESC;
```

## 🎯 Следующие шаги

1. **Тестирование** новой системы на всех ролях
2. **Добавление новых разрешений** по мере необходимости
3. **Мониторинг производительности** RLS запросов
4. **Документирование** специфических бизнес-правил
5. **Обучение команды** новому API

---

*Документация обновлена: 8 января 2025*
