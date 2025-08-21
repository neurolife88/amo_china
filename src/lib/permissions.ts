/**
 * Централизованная система управления правами доступа
 * 
 * Определяет все права и роли в одном месте для консистентности
 * между frontend и backend
 */

import { AppRole } from '@/types/auth';

// =============================================================================
// ОПРЕДЕЛЕНИЕ РОЛЕЙ И ИХ ИЕРАРХИИ
// =============================================================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin' as const,
  DIRECTOR: 'director' as const,
  COORDINATOR: 'coordinator' as const,
} as const;

// Иерархия ролей (высшая роль включает права нижестоящих)
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  coordinator: 1,
  director: 2,
  super_admin: 3,
};

// =============================================================================
// ОПРЕДЕЛЕНИЕ РАЗРЕШЕНИЙ (PERMISSIONS)
// =============================================================================

export const PERMISSIONS = {
  // Управление пользователями
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_USERS: 'view_all_users',
  CHANGE_USER_ROLES: 'change_user_roles',
  
  // Управление пациентами
  VIEW_ALL_PATIENTS: 'view_all_patients',
  VIEW_OWN_CLINIC_PATIENTS: 'view_own_clinic_patients',
  EDIT_PATIENT_BASIC: 'edit_patient_basic',
  EDIT_PATIENT_ADVANCED: 'edit_patient_advanced',
  
  // Управление клиниками
  MANAGE_CLINICS: 'manage_clinics',
  VIEW_ALL_CLINICS: 'view_all_clinics',
  
  // Специальные права
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  BYPASS_RLS: 'bypass_rls',
  
  // Поля пациентов
  EDIT_APARTMENT_NUMBER: 'edit_apartment_number',
  EDIT_DEPARTURE_INFO: 'edit_departure_info',
  EDIT_NOTES: 'edit_notes',
  EDIT_CHINA_ENTRY_DATE: 'edit_china_entry_date',
  EDIT_CHINESE_NAME: 'edit_chinese_name',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// =============================================================================
// КАРТА РОЛЕЙ И РАЗРЕШЕНИЙ
// =============================================================================

// Базовые права для coordinator
const COORDINATOR_PERMISSIONS: Permission[] = [
  PERMISSIONS.VIEW_OWN_CLINIC_PATIENTS,
  PERMISSIONS.EDIT_PATIENT_BASIC,
  PERMISSIONS.EDIT_APARTMENT_NUMBER,
  PERMISSIONS.EDIT_DEPARTURE_INFO,
  PERMISSIONS.EDIT_NOTES,
  PERMISSIONS.EDIT_CHINA_ENTRY_DATE,
  PERMISSIONS.EDIT_CHINESE_NAME,
];

// Дополнительные права для director
const DIRECTOR_ADDITIONAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.VIEW_ALL_PATIENTS,
  PERMISSIONS.VIEW_ALL_CLINICS,
  PERMISSIONS.EDIT_PATIENT_ADVANCED,
];

// Дополнительные права для super_admin
const SUPER_ADMIN_ADDITIONAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.VIEW_ALL_USERS,
  PERMISSIONS.CHANGE_USER_ROLES,
  PERMISSIONS.MANAGE_CLINICS,
  PERMISSIONS.VIEW_AUDIT_LOGS,
  PERMISSIONS.BYPASS_RLS,
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  coordinator: COORDINATOR_PERMISSIONS,
  
  director: [
    ...COORDINATOR_PERMISSIONS,
    ...DIRECTOR_ADDITIONAL_PERMISSIONS,
  ],
  
  super_admin: [
    ...COORDINATOR_PERMISSIONS,
    ...DIRECTOR_ADDITIONAL_PERMISSIONS,
    ...SUPER_ADMIN_ADDITIONAL_PERMISSIONS,
  ],
};

// =============================================================================
// ФУНКЦИИ ПРОВЕРКИ ПРАВ
// =============================================================================

/**
 * Проверяет, имеет ли роль определенное разрешение
 */
export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Проверяет, имеет ли роль уровень доступа не ниже указанного
 */
export function hasRoleLevel(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Получает все разрешения для роли
 */
export function getRolePermissions(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Проверяет, может ли пользователь редактировать определенное поле
 */
export function canEditField(
  userRole: AppRole, 
  field: string, 
  context?: { fieldGroup?: string; userClinic?: string; patientClinic?: string }
): boolean {
  const { fieldGroup, userClinic, patientClinic } = context || {};
  
  // Отладочная информация для поля notes
  if (field === 'notes') {
    console.log('🔍 canEditField notes debug:', {
      userRole,
      fieldGroup,
      userClinic,
      patientClinic,
      hasPermission: hasPermission(userRole, PERMISSIONS.EDIT_NOTES),
      isCoordinator: userRole === ROLES.COORDINATOR,
      clinicMatch: userClinic === patientClinic
    });
  }
  
  // Проверка доступа к клинике (для coordinator)
  if (userRole === ROLES.COORDINATOR && userClinic && patientClinic) {
    if (userClinic !== patientClinic) {
      return false;
    }
  }
  
  // Проверка конкретных полей
  switch (field) {
    case 'apartment_number':
      return hasPermission(userRole, PERMISSIONS.EDIT_APARTMENT_NUMBER);
      
    case 'departure_city':
    case 'departure_datetime':
    case 'departure_flight_number':
    case 'departure_transport_type':
      return hasPermission(userRole, PERMISSIONS.EDIT_DEPARTURE_INFO);
      
    case 'notes':
      // Проверяем разрешение и доступ к клинике
      if (!hasPermission(userRole, PERMISSIONS.EDIT_NOTES)) {
        return false;
      }
      
      // Для coordinator проверяем доступ к клинике
      if (userRole === ROLES.COORDINATOR && userClinic && patientClinic) {
        return userClinic === patientClinic;
      }
      
      return true;
      
    case 'china_entry_date':
      return hasPermission(userRole, PERMISSIONS.EDIT_CHINA_ENTRY_DATE);
      
    case 'patient_chinese_name':
      // Специальная логика: только в группе "treatment"
      return hasPermission(userRole, PERMISSIONS.EDIT_CHINESE_NAME) && 
             fieldGroup === 'treatment';
             
    default:
      return hasPermission(userRole, PERMISSIONS.EDIT_PATIENT_BASIC);
  }
}

/**
 * Проверяет, может ли пользователь видеть данные пациентов
 */
export function canViewPatients(
  userRole: AppRole,
  userClinic?: string,
  patientClinic?: string
): boolean {
  // Super admin и director видят всех
  if (hasPermission(userRole, PERMISSIONS.VIEW_ALL_PATIENTS)) {
    return true;
  }
  
  // Coordinator видит только свою клинику
  if (hasPermission(userRole, PERMISSIONS.VIEW_OWN_CLINIC_PATIENTS)) {
    return userClinic === patientClinic;
  }
  
  return false;
}

// =============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// =============================================================================

export interface UserContext {
  role: AppRole;
  clinic?: string;
  userId: string;
}

export interface PermissionContext {
  fieldGroup?: string;
  targetClinic?: string;
  targetUserId?: string;
}

/**
 * Основной класс для проверки прав доступа
 */
export class PermissionChecker {
  constructor(private user: UserContext) {}
  
  can(permission: Permission, context?: PermissionContext): boolean {
    return hasPermission(this.user.role, permission);
  }
  
  canEdit(field: string, context?: PermissionContext): boolean {
    return canEditField(this.user.role, field, {
      fieldGroup: context?.fieldGroup,
      userClinic: this.user.clinic,
      patientClinic: context?.targetClinic,
    });
  }
  
  canView(targetClinic?: string): boolean {
    return canViewPatients(this.user.role, this.user.clinic, targetClinic);
  }
  
  hasRole(role: AppRole): boolean {
    return hasRoleLevel(this.user.role, role);
  }
}
