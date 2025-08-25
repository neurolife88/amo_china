# 🌐 Руководство по переводам

## 📋 Обзор

Система интернационализации построена на **i18next** с полной типизацией TypeScript.

## 🏗️ Архитектура

```
src/
├── locales/
│   ├── ru.json          # Русские переводы
│   ├── zh.json          # Китайские переводы
│   └── en.json          # Английские переводы (будущее)
├── types/
│   └── translations.ts  # Типы для переводов
├── hooks/
│   ├── useLanguage.tsx  # Управление языками
│   └── useTranslations.tsx # Удобные функции переводов
├── utils/
│   └── translationHelpers.ts # Утилиты для переводов
└── i18n.ts              # Конфигурация i18next
```

## 🚀 Быстрый старт

### 1. Использование в компонентах

```tsx
import { useTranslations } from '@/hooks/useTranslations';

const MyComponent = () => {
  const { patients, common, messages } = useTranslations();
  
  return (
    <div>
      <h1>{patients.title()}</h1>
      <button>{common.save()}</button>
      <p>{messages.patientUpdated()}</p>
    </div>
  );
};
```

### 2. Переводы с параметрами

```tsx
// В файле переводов
{
  "patients": {
    "daysLeft": "{{days}} дней",
    "expiredDaysAgo": "Просрочено на {{days}} дней"
  }
}

// В компоненте
const { patients } = useTranslations();
<p>{patients.daysLeft(5)}</p> // "5 дней"
<p>{patients.expiredDaysAgo(3)}</p> // "Просрочено на 3 дней"
```

## 📝 Добавление новых переводов

### 1. Добавить в типы

```typescript
// src/types/translations.ts
export interface PatientTranslations {
  // ... существующие поля
  newField: string; // Добавить новое поле
}
```

### 2. Добавить в хук

```typescript
// src/hooks/useTranslations.tsx
patients: {
  // ... существующие поля
  newField: () => t('patients.newField'),
},
```

### 3. Добавить в файлы переводов

```json
// src/locales/ru.json
{
  "patients": {
    "newField": "Новое поле"
  }
}

// src/locales/zh.json
{
  "patients": {
    "newField": "新字段"
  }
}
```

## 🔧 Утилиты

### Проверка наличия перевода

```typescript
import { hasTranslation } from '@/utils/translationHelpers';

const hasKey = hasTranslation('patients.title');
```

### Добавление перевода в runtime

```typescript
import { addTranslation } from '@/utils/translationHelpers';

addTranslation('ru', 'patients.newField', 'Новое поле');
```

### Валидация переводов

```typescript
import { validateTranslations } from '@/utils/translationHelpers';

const requiredKeys = ['patients.title', 'patients.addPatient'];
const validation = validateTranslations(translations, requiredKeys);

if (!validation.valid) {
  console.warn('Missing translations:', validation.missing);
}
```

## 🎯 Лучшие практики

### 1. Структура ключей

```
[section].[subsection].[action/field]
patients.title
patients.addPatient
common.save
auth.login
```

### 2. Именование

- **Ключи**: camelCase, описательные
- **Файлы**: snake_case для языков (ru.json, zh.json)
- **Типы**: PascalCase с суффиксом Translations

### 3. Организация

- Группируйте связанные переводы в секции
- Используйте вложенные объекты для сложных структур
- Документируйте сложные переводы

### 4. Параметры

```typescript
// Хорошо
"welcome": "Добро пожаловать, {{name}}!"

// Плохо
"welcome": "Добро пожаловать!"
```

## 🔍 Отладка

### 1. Проверка текущего языка

```typescript
const { currentLanguage } = useLanguage();
console.log('Current language:', currentLanguage);
```

### 2. Проверка переводов в консоли

```typescript
// В консоли браузера
console.log('Translation:', i18next.t('patients.title'));
console.log('All keys:', Object.keys(i18next.getResourceBundle('ru')));
```

### 3. Режим отладки

```typescript
// В i18n.ts
debug: process.env.NODE_ENV === 'development'
```

## 📦 Добавление нового языка

### 1. Создать файл перевода

```json
// src/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### 2. Добавить в конфигурацию

```typescript
// src/i18n.ts
const resources = {
  ru: { translation: ruTranslations },
  zh: { translation: zhTranslations },
  en: { translation: enTranslations }, // Добавить
};
```

### 3. Обновить типы

```typescript
// src/types/translations.ts
export type SupportedLanguage = 'ru' | 'zh' | 'en';
```

## 🚨 Частые ошибки

### 1. Забыли добавить в типы
```typescript
// Ошибка: Property 'newField' does not exist
const { patients } = useTranslations();
patients.newField(); // ❌
```

### 2. Неправильный ключ
```typescript
// Ошибка: Translation key not found
t('patients.wrongKey'); // ❌
```

### 3. Забыли параметры
```typescript
// Ошибка: Missing interpolation
t('patients.daysLeft'); // ❌ Нужно: t('patients.daysLeft', { days: 5 })
```

## 📚 Дополнительные ресурсы

- [i18next документация](https://www.i18next.com/)
- [react-i18next документация](https://react.i18next.com/)
- [TypeScript с i18next](https://www.i18next.com/overview/typescript)
