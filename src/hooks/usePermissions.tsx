/**
 * Хук для работы с системой прав доступа
 * 
 * Предоставляет удобный интерфейс для проверки прав
 * и интеграцию с системой авторизации
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { 
  PermissionChecker, 
  Permission, 
  PERMISSIONS,
  ROLES,
  canEditField,
  canViewPatients,
  hasPermission,
  hasRoleLevel,
  FieldGroup
} from '@/lib/permissions';
import type { AppRole } from '@/types/auth';
import { FieldGroup } from '@/types/patient';

export interface UsePermissionsReturn {
  // Основные проверки
  can: (permission: Permission) => boolean;
  canEdit: (field: string, context?: { fieldGroup?: string; targetClinic?: string }) => boolean;
  canView: (targetClinic?: string) => boolean;
  hasRole: (role: AppRole) => boolean;
  shouldShowField: (fieldName: string, fieldGroup: FieldGroup) => boolean; // Новое поле
  
  // Checker instance для сложных проверок
  checker: PermissionChecker | null;
  
  // Быстрые проверки для UI
  isCoordinator: boolean;
  isDirector: boolean;
  isSuperAdmin: boolean;
  
  // Контекст пользователя
  userRole: AppRole | null;
  userClinic: string | null;
  userId: string | null;
  
  // Состояние загрузки
  loading: boolean;

  shouldShowField: (fieldName: string, fieldGroup: FieldGroup) => boolean;
}

/**
 * Основной хук для работы с правами доступа
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, profile, loading } = useAuth();
  
  // Создаем checker только когда есть профиль
  const checker = useMemo(() => {
    if (!profile || !user) return null;
    
    return new PermissionChecker({
      role: profile.role,
      clinic: profile.clinic_name || undefined,
      userId: user.id,
    });
  }, [profile, user]);
  
  // Мемоизированные быстрые проверки
  const quickChecks = useMemo(() => {
    const role = profile?.role;
    
    return {
      isCoordinator: role === ROLES.COORDINATOR,
      isDirector: role === ROLES.DIRECTOR,
      isSuperAdmin: role === ROLES.SUPER_ADMIN,
    };
  }, [profile?.role]);
  
  // Функции проверки прав
  const can = (permission: Permission): boolean => {
    if (!profile) return false;
    return hasPermission(profile.role, permission);
  };
  
  const canEdit = (
    field: string, 
    context?: { fieldGroup?: string; targetClinic?: string }
  ): boolean => {
    if (!profile) return false;
    return canEditField(profile.role, field, {
      fieldGroup: context?.fieldGroup,
      userClinic: profile.clinic_name || undefined,
      patientClinic: context?.targetClinic,
    });
  };
  
  const canView = (targetClinic?: string): boolean => {
    if (!profile) return false;
    return canViewPatients(
      profile.role, 
      profile.clinic_name || undefined, 
      targetClinic
    );
  };
  
  const hasRole = (role: AppRole): boolean => {
    if (!profile) return false;
    return hasRoleLevel(profile.role, role);
  };

  return {
    // Основные функции
    can,
    canEdit,
    canView,
    hasRole,
    
    // Быстрые проверки
    ...quickChecks,
    
    // Контекст
    userRole: profile?.role || null,
    userClinic: profile?.clinic_name || null,
    userId: user?.id || null,
    
    // Состояние
    loading,

    shouldShowField: (fieldName: string, fieldGroup: FieldGroup) => 
      checker?.shouldShowField(fieldName, fieldGroup) ?? true,
  };
}

/**
 * Хук для проверки конкретного разрешения
 * Полезен для условного рендеринга компонентов
 */
export function useHasPermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Хук для проверки роли
 * Полезен для условного рендеринга компонентов
 */
export function useHasRole(role: AppRole): boolean {
  const { hasRole } = usePermissions();
  return hasRole(role);
}

/**
 * Хук для проверки возможности редактирования поля
 */
export function useCanEditField(
  field: string, 
  context?: { fieldGroup?: string; targetClinic?: string }
): boolean {
  const { canEdit } = usePermissions();
  return canEdit(field, context);
}

/**
 * Компонент для условного рендеринга на основе прав
 */
export interface PermissionGateProps {
  permission?: Permission;
  role?: AppRole;
  field?: string;
  fieldContext?: { fieldGroup?: string; targetClinic?: string };
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  permission, 
  role, 
  field, 
  fieldContext,
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { can, hasRole, canEdit } = usePermissions();
  
  let hasAccess = true;
  
  if (permission) {
    hasAccess = hasAccess && can(permission);
  }
  
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }
  
  if (field) {
    hasAccess = hasAccess && canEdit(field, fieldContext);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Экспорт констант для удобства
export { PERMISSIONS, ROLES } from '@/lib/permissions';
