/**
 * Константы статусов пациентов и модалок
 * Устраняет хардкод строк по всему проекту
 */

export type DealStatus = 'В работе' | 'Успешно реализовано' | 'Закрыто и не реализовано';
export type VisaStatus = 'Active' | 'Expiring Soon' | 'Expired';

export const DEAL_STATUS_CONFIG = {
  'В работе': { variant: 'default' as const, label: 'В работе' },
  'Успешно реализовано': { variant: 'default' as const, label: 'Успешно реализовано' },
  'Закрыто и не реализовано': { variant: 'secondary' as const, label: 'Закрыто и не реализовано' }
} as const;

export const VISA_STATUS_CONFIG = {
  'Active': { variant: 'default' as const, label: 'Активна' },
  'Expiring Soon': { variant: 'destructive' as const, label: 'Истекает' },
  'Expired': { variant: 'secondary' as const, label: 'Истекла' }
} as const;

export const MODAL_TITLES = {
  EDIT_RETURN_TICKETS: 'Редактировать обратные билеты'
} as const;
