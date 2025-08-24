# 🏥 Система "Встреча гостей" - Медицинский туризм в Китай

Веб-интерфейс для сотрудников китайских медицинских учреждений, работающих с иностранными пациентами. Система интегрирована с AmoCRM через n8n для автоматической синхронизации данных о прибывающих пациентах.

**Платформа разработки:** CURSOR AI-powered IDE

## 📋 Описание проекта

**🤖 AI-powered разработка в CURSOR IDE**

Система предназначена для управления потоками иностранных пациентов в китайских клиниках на всех этапах. Разрабатывается с использованием CURSOR IDE для ускорения разработки через AI-ассистента.

**Основные модули:**
- **Встреча гостей** - отслеживание прибывающих пациентов
- **Пациенты на лечении** - управление пребыванием в клинике  
- **Планирование отъезда** - организация обратного трансфера

### Ключевые возможности:
- ✅ **Real-time синхронизация** с AmoCRM
- ✅ **Ролевая система доступа** (Super Admin / Director / Coordinator)
- ✅ **Многобольничная архитектура** - поддержка нескольких клиник
- ✅ **Адаптивный интерфейс** - mobile-first дизайн
- ✅ **Система аудита** - логирование всех изменений
- ✅ **Real-time уведомления** - мгновенные обновления данных

## 🛠️ Технологический стек

### IDE & Разработка
- **CURSOR** - AI-powered IDE с GitHub Copilot интеграцией
- **AI Assistance** - автоматическое написание кода и рефакторинг
- **.cursorrules** - настройки для контекста проекта

### Frontend
- **React 18** + **TypeScript** - основной фреймворк
- **Vite** - система сборки
- **Tailwind CSS** - стилизация
- **shadcn/ui** - компонентная библиотека
- **Radix UI** - примитивы интерфейса

### Backend & Database
- **Supabase** - PostgreSQL база данных + Authentication
- **Row Level Security (RLS)** - контроль доступа на уровне БД
- **Real-time subscriptions** - WebSocket соединения

### Интеграции
- **n8n** - автоматизация синхронизации между AmoCRM и Supabase
- **AmoCRM** - источник данных о пациентах и сделках
- **Supabase Edge Functions** - серверная логика

## 🏗️ Архитектура системы

### Поток данных
```

## 🚀 Развертывание
AmoCRM → n8n → Supabase → Веб-интерфейс
   ↑                           ↓
   ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

**Синхронизация:**
- **AmoCRM → n8n → Supabase** - автоматический импорт новых сделок, контактов, билетов
- **Веб-интерфейс → Supabase** - редактирование полей координаторами  
- **Supabase → n8n → AmoCRM** - обратная синхронизация изменений (при необходимости)

### Центральная схема данных
Все данные организованы вокруг **сделки (deal)** - каждая сделка объединяет:

```
Сделка (Deal)
├── Контактная информация пациента (contacts)
├── Визовые данные (visas) 
├── Билеты прибытия в Китай (tickets_to_china)
├── Билеты отъезда из лечения (tickets_from_treatment)
└── Привязка к клинике (clinics_directory)
```

### Основные таблицы

#### 1. **Контакты** (`contacts`)
Персональная информация пациентов
- ФИО, телефон, email
- Паспортные данные
- Страна происхождения

#### 2. **Сделки** (`deals`) 
Центральная бизнес-логика
- Название сделки
- Статус и воронка продаж
- Привязка к клинике
- Страна и город визы

#### 3. **Визы** (`visas`)
Документооборот виз
- Номер и тип визы
- Сроки пребывания
- Статус оформления

#### 4. **Билеты в Китай** (`tickets_to_china`)
Информация о прибытии
- Дата и время прилета
- Номер рейса, терминал
- Тип транспорта
- Количество пассажиров

#### 5. **Билеты из лечения** (`tickets_from_treatment`)
Планирование отъезда
- Дата и время отправления
- Город и способ отъезда
- Номер обратного рейса

## 👥 Ролевая система

### 🔴 Super Admin
- Полный доступ ко всем функциям системы
- Управление пользователями и правами доступа
- Просмотр аудита операций всех пользователей
- Системные настройки и конфигурация

### 🟠 Director
- Просмотр данных по всем больницам
- Аналитика и отчеты по всей сети клиник
- Мониторинг ключевых метрик
- Управление координаторами

### 🟡 Coordinator  
- Работа только со своей клиникой
- Редактирование данных пациентов
- Планирование размещения и отъезда
- Обновление статусов встречи

## 🎯 Основные интерфейсы

### Модуль "Встреча гостей"
**Источник данных:** AmoCRM → автоматическая синхронизация

**Функции координатора:**
- Просмотр списка прибывающих пациентов
- Фильтрация по дате и статусу прибытия
- Обновление статуса встречи (прибыл → встречен)
- Редактирование номера комнаты

### Модуль "Пациенты на лечении" 
**Источник данных:** AmoCRM + редактирование в веб-интерфейсе

**Функции координатора:**
- Управление размещением пациентов
- Планирование даты отъезда
- Контроль сроков визы (автоматические алерты)
- Бронирование обратных билетов

### Dashboard для Director/Super Admin
**Функции:**
- Сводка по всем больницам
- Статистика встреч и размещений
- Мониторинг срочных случаев (истекающие визы)
- Аналитика загруженности клиник

## 💻 Способы редактирования кода

### Основной способ - CURSOR IDE (рекомендуется)

**CURSOR** - это AI-powered IDE, оптимизированная для данного проекта:

- Склонируйте репозиторий: `git clone https://github.com/neurolife88/amo_china.git`
- Откройте проект в CURSOR IDE
- Используйте `.cursorrules` для контекста проекта
- Применяйте AI-ассистента для написания кода

### Альтернативные способы

**Редактирование файла напрямую в GitHub:**
- Перейдите к нужному файлу
- Нажмите кнопку "Edit" (иконка карандаша) в правом верхнем углу
- Внесите изменения и закоммитьте

**GitHub Codespaces:**
- Перейдите на главную страницу репозитория
- Нажмите кнопку "Code" (зеленая кнопка) в правом верхнем углу
- Выберите вкладку "Codespaces"
- Нажмите "New codespace" для запуска среды
- Редактируйте файлы прямо в Codespace

**Другие IDE (VS Code, WebStorm и т.д.):**
```bash
# Требования: Node.js v22.15.0
# Установка с помощью nvm: https://github.com/nvm-sh/nvm
git clone https://github.com/neurolife88/amo_china.git
cd amo_china
npm i
npm run dev
```

### Локальная разработка

**Требования:**
- **Node.js v22.15.0** (протестировано и работает стабильно)
- **Git** для синхронизации с репозиторием
- **SSH доступ** к серверу Beget.ru

1. **Клонирование репозитория**
```bash
git clone https://github.com/neurolife88/amo_china.git
cd amo_china
```

2. **Установка зависимостей**
```bash
npm i
```

3. **Настройка окружения**
```bash
cp .env.example .env.local
# Настройте переменные Supabase в .env.local
```

4. **Запуск разработки**
```bash
npm run dev
```

### Продакшн развертывание

**Хостинг:** [Beget.ru](https://beget.ru)  
**Домен:** [https://88.n8ndcpchina.ru](https://88.n8ndcpchina.ru)  
**SSH доступ:** `cdmaseoy@cdmaseoy.beget.tech`

**Развертывание через Git:**
```bash
# Коммит изменений в CURSOR
git add .
git commit -m "Update production build"
git push origin main

# SSH подключение к Beget
ssh cdmaseoy@cdmaseoy.beget.tech

# На сервере: обновление кода
cd /path/to/your/project
git pull origin main

# Установка зависимостей и сборка (если требуется)
npm install
npm run build

# Перезапуск сервиса (если используется PM2)
pm2 restart your-app-name
```

**Автоматическое развертывание через webhook:**
```bash
# Настройка webhook на Beget для автодеплоя
# При push в main ветку → автоматическое обновление на сервере
```

### Домен и SSL

**Домен:** [https://88.n8ndcpchina.ru](https://88.n8ndcpchina.ru) ✅ **Настроен**

Домен подключен через **Beget.ru** с автоматическим SSL сертификатом.

**DNS настройки:**
- A-запись указывает на IP сервера Beget  
- SSL сертификат обновляется автоматически
- Поддержка HTTP/2 включена

**Настройка веб-сервера на Beget:**
```nginx
# Конфигурация Nginx (управляется Beget)
server {
    listen 443 ssl http2;
    server_name 88.n8ndcpchina.ru;
    
    # SSL сертификат (автоматический от Beget)
    ssl_certificate /path/to/ssl/cert;
    ssl_certificate_key /path/to/ssl/key;
    
    # Статические файлы React приложения
    location / {
        root /path/to/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API прокси к Supabase (если нужно)
    location /api/ {
        proxy_pass https://your-supabase-url;
        proxy_set_header Host $host;
    }
}
```

## ⚙️ Конфигурация

### Переменные окружения

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n интеграция
N8N_WEBHOOK_URL=your_n8n_webhook_endpoint
N8N_API_KEY=your_n8n_api_key

# Продакшн домен (Beget.ru)
VITE_APP_URL=https://88.n8ndcpchina.ru
VITE_ENVIRONMENT=production

# AmoCRM (настраивается в n8n)
# AMOCRM_SUBDOMAIN=your_amocrm_subdomain
# AMOCRM_CLIENT_ID=your_client_id  
# AMOCRM_CLIENT_SECRET=your_client_secret
```

### Beget.ru конфигурация

**Файловая структура на сервере:**
```
/domains/88.n8ndcpchina.ru/
├── public_html/          # Собранное React приложение (npm run build)
├── .git/                 # Git репозиторий для синхронизации
├── node_modules/         # Зависимости (если нужны на сервере)
└── package.json          # Конфигурация проекта
```

**Команды для локального развертывания:**
```bash
# Локальная сборка перед деплоем
npm run build

# Синхронизация с сервером через SSH
rsync -avz --delete dist/ cdmaseoy@cdmaseoy.beget.tech:/domains/88.n8ndcpchina.ru/public_html/
```

### База данных Supabase

Основные настройки:
- **Row Level Security (RLS)** - включен для всех таблиц
- **Real-time** - подключения для моментальных обновлений
- **Authentication** - управление пользователями через Supabase Auth

### n8n Workflows

Настройка автоматизации синхронизации:

1. **AmoCRM → Supabase** (основной поток):
   - Webhook от AmoCRM на создание/обновление сделок
   - Трансформация данных в формат Supabase
   - Вставка/обновление записей в БД

2. **Supabase → AmoCRM** (обратная синхронизация):
   - Trigger на изменения в таблицах
   - Отправка обновлений статусов обратно в AmoCRM
   - Синхронизация пользовательских изменений

3. **Мониторинг и логирование**:
   - Отслеживание ошибок синхронизации
   - Уведомления о проблемах
   - Автоматический retry неудачных операций

## 📊 Структура проекта

```
src/
├── components/           # React компоненты
│   ├── ui/              # Базовые UI компоненты (shadcn/ui)
│   ├── layout/          # Компоненты макета (Header, Sidebar)
│   ├── patients/        # Компоненты для работы с пациентами
│   └── dashboard/       # Компоненты панели управления
├── hooks/               # React хуки
│   ├── useAuth.ts       # Аутентификация
│   ├── useSupabase.ts   # Подключение к БД
│   └── usePermissions.ts # Ролевая система
├── lib/                 # Утилиты и конфигурация
│   ├── supabase.ts      # Настройка Supabase клиента
│   ├── utils.ts         # Общие утилиты
│   └── n8n.ts           # n8n интеграция и webhooks
├── pages/               # Страницы приложения
│   ├── Dashboard.tsx    # Главная панель
│   ├── MeetingGuests.tsx # Встреча гостей
│   └── PatientsInTreatment.tsx # Пациенты на лечении
└── types/               # TypeScript типы
    ├── database.types.ts # Автогенерированные типы БД
    └── app.types.ts     # Типы приложения

### CURSOR конфигурация

```
.cursorrules             # Правила для CURSOR AI
src/.cursorrules         # Специфичные правила для src/
```

**.cursorrules** содержит:
- Контекст проекта (медицинский туризм)
- Технологический стек (React + Supabase)  
- Стандарты кода и архитектуры
- Специфику интеграции с AmoCRM через n8n
```

## 🔧 Интеграция через n8n

### Архитектура синхронизации

**AmoCRM → n8n → Supabase:**
```javascript
// Workflow в n8n для синхронизации новых сделок
{
  "nodes": [
    {
      "name": "AmoCRM Trigger",
      "type": "webhook", 
      "webhookUrl": "amocrm/leads/created"
    },
    {
      "name": "Transform Data",
      "type": "function",
      "code": "// Преобразование данных AmoCRM в формат Supabase"
    },
    {
      "name": "Supabase Insert", 
      "type": "supabase",
      "operation": "insert",
      "table": "deals"
    }
  ]
}
```

**Типы синхронизации:**

1. **Новые сделки** → создание записей пациентов
2. **Обновления контактов** → актуализация данных
3. **Изменения статусов** → обновление состояний
4. **Билетная информация** → данные о прибытии/отъезде

### Суprаbase Edge Functions

Вспомогательные серверные функции для обработки данных:

```typescript
// supabase/functions/process-amocrm-data/index.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization',
}

// Обработка данных от n8n
Deno.serve(async (req) => {
  const { type, data } = await req.json()
  
  switch(type) {
    case 'new_deal':
      // Создание новой записи пациента
      break
    case 'update_contact':
      // Обновление контактной информации
      break
    case 'sync_tickets':
      // Синхронизация билетной информации
      break
  }
})
```

## 🛡️ Безопасность

### Row Level Security (RLS)

Политики доступа на уровне базы данных:

```sql
-- Координаторы видят только свою клинику
CREATE POLICY "coordinators_own_clinic" ON deals
FOR SELECT USING (
  clinic_name = (
    SELECT clinic_name FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Директора видят все клиники
CREATE POLICY "directors_all_clinics" ON deals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('director', 'super_admin')
  )
);
```

### Аудит операций

Все критические изменения логируются:

```sql
-- Таблица аудита
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  changed_by UUID REFERENCES auth.users(id),
  hospital_id UUID,
  sync_source TEXT DEFAULT 'web', -- web, amocrm, system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📈 Мониторинг и аналитика

### Ключевые метрики

- **Количество встреч в день** по каждой больнице
- **Время пребывания пациентов** в среднем
- **Загруженность координаторов** 
- **Сроки истечения виз** (алерты)

### Real-time обновления

```typescript
// Подписка на изменения в реальном времени
const subscription = supabase
  .channel('meeting-guests-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tickets_to_china' }, 
    (payload) => {
      // Обновление UI при изменениях
    }
  )
  .subscribe()
```

## 🤝 Участие в разработке

### Принципы разработки

1. **AI-First подход** - максимальное использование CURSOR AI для написания кода
2. **Mobile-first** - приоритет мобильным устройствам
3. **Типобезопасность** - строгая TypeScript типизация  
4. **Компонентный подход** - переиспользуемые компоненты
5. **Real-time первым** - мгновенные обновления данных

### Работа в CURSOR

1. **Настройка контекста:**
   - Файл `.cursorrules` настроен для проекта
   - AI понимает архитектуру AmoCRM ↔ n8n ↔ Supabase
   - Контекст медицинского туризма

2. **AI-assisted разработка:**
   ```bash
   # Используйте Ctrl+K для AI команд
   "Создай компонент PatientCard с данными из Supabase"
   "Добавь валидацию формы с react-hook-form"  
   "Оптимизируй запрос к БД для таблицы встреч"
   ```

3. **Рефакторинг и оптимизация:**
   - AI помогает оптимизировать производительность
   - Автоматическое исправление типов TypeScript
   - Генерация тестов для компонентов

### Рекомендуемые инструменты

- **CURSOR IDE** - AI-powered разработка с GitHub Copilot
- **Git Bash** - синхронизация с Beget.ru через SSH  
- **Beget.ru Panel** - управление хостингом и доменом
- **Supabase CLI** - управление базой данных
- **n8n** - настройка workflows для интеграции
- **Figma** - дизайн интерфейсов

## 📞 Поддержка

При возникновении вопросов или проблем:

1. **Документация проекта** - проверьте файлы в `/docs`
2. **Issues GitHub** - создайте issue с описанием проблемы
3. **База знаний** - изучите техническую документацию

---

## 📄 Лицензия

Этот проект создан для китайских медицинских учреждений и их партнеров.

---

*Последнее обновление: Август 2025*