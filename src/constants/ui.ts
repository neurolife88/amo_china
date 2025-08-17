/**
 * UI константы и стили
 * Устраняет дублирование CSS классов
 */

// Стили для таблиц
export const TABLE_STYLES = {
  TABLE: 'border-collapse border-2 border-gray-400',
  TABLE_FIXED: 'table-layout: fixed',
  TABLE_AUTO: 'width: max-content',
  
  HEADER: 'border-2 border-gray-400 px-4 py-2 font-medium text-left bg-gray-100 whitespace-normal break-words',
  HEADER_NARROW: 'border-2 border-gray-400 px-1 py-1 font-medium text-left bg-gray-100 whitespace-normal break-words text-xs',
  
  CELL: 'border-2 border-gray-400 px-4 py-2',
  CELL_NARROW: 'border-2 border-gray-400 px-1 py-1 text-xs',
} as const;

// Стили для форм
export const FORM_STYLES = {
  FORM_FIELD: 'space-y-2',
  FORM_GRID: 'grid grid-cols-4 items-center gap-4',
  
  INPUT: 'h-10',
  INPUT_SM: 'h-8 text-sm',
  INPUT_ERROR: 'border-red-500 focus:border-red-500',
  
  BUTTON_FULL: 'w-full',
  BUTTON_ICON_SM: 'h-6 w-6 p-0',
  
  LABEL_REQUIRED: "after:content-['*'] after:text-red-500 after:ml-1",
} as const;

// Стили состояний
export const STATE_STYLES = {
  LOADING: 'opacity-50 cursor-not-allowed',
  DISABLED: 'opacity-60 cursor-not-allowed',
  ERROR: 'border-red-500 text-red-500',
  SUCCESS: 'border-green-500 text-green-500',
} as const;

// Responsive breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
} as const;

// Utility function для объединения классов
export function combineStyles(...styles: (string | false | null | undefined)[]): string {
  return styles.filter(Boolean).join(' ');
}
