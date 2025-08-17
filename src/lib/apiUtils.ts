/**
 * API утилиты для обработки ошибок и оптимистичных обновлений
 */
import { toast } from '@/hooks/use-toast';

export const handleApiError = (error: any, toast: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  const message = error?.message || `Ошибка при ${action}`;
  
  toast({
    title: 'Ошибка',
    description: message,
    variant: 'destructive',
  });
};

export const showSuccessToast = (toast: any, title: string, description: string) => {
  toast({
    title,
    description,
    variant: 'default',
  });
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  toast: any,
  actionName: string
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    handleApiError(error, toast, actionName);
    return undefined;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
