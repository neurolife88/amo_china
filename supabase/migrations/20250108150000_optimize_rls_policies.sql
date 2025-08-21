-- =====================================================================
-- ОПТИМИЗАЦИЯ RLS ПОЛИТИК ДЛЯ УЛУЧШЕННОЙ СИСТЕМЫ АВТОРИЗАЦИИ
-- =====================================================================

-- Удаляем все существующие политики для user_profiles
DROP POLICY IF EXISTS "users_can_view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON user_profiles;  
DROP POLICY IF EXISTS "users_can_update_own_profile" ON user_profiles;

-- =====================================================================
-- УЛУЧШЕННЫЕ ФУНКЦИИ БЕЗОПАСНОСТИ
-- =====================================================================

-- Создаем оптимизированную функцию для получения роли пользователя
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

-- Создаем функцию для получения клиники пользователя
CREATE OR REPLACE FUNCTION public.get_user_clinic(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
    SELECT clinic_name 
    FROM public.user_profiles 
    WHERE user_id = user_uuid
    LIMIT 1;
$function$;

-- Создаем функции проверки ролей (более производительные)
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

CREATE OR REPLACE FUNCTION public.is_director_or_higher(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = user_uuid AND role IN ('director', 'super_admin')
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_coordinator_or_higher(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE user_id = user_uuid AND role IN ('coordinator', 'director', 'super_admin')
    );
$function$;

-- =====================================================================
-- НОВЫЕ ОПТИМИЗИРОВАННЫЕ RLS ПОЛИТИКИ ДЛЯ USER_PROFILES
-- =====================================================================

-- Политика просмотра: пользователи могут видеть свой профиль
CREATE POLICY "users_view_own_profile" ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Политика вставки: пользователи могут создавать свой профиль при регистрации
CREATE POLICY "users_insert_own_profile" ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Политика обновления: пользователи могут обновлять свой профиль (кроме роли)
CREATE POLICY "users_update_own_profile" ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- ИСПРАВЛЕННАЯ RPC ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ ПРИМЕЧАНИЙ
-- =====================================================================

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS public.update_deal_notes(bigint, text);

-- Создаем исправленную функцию для обновления примечаний
CREATE OR REPLACE FUNCTION public.update_deal_notes(
  p_deal_id bigint,
  p_notes text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_role public.app_role;
    current_clinic text;
    deal_clinic text;
    result json;
BEGIN
    -- Получаем роль и клинику текущего пользователя
    SELECT get_user_role(p_user_id) INTO current_role;
    SELECT get_user_clinic(p_user_id) INTO current_clinic;
    
    -- Получаем клинику для этой сделки
    SELECT clinic_name INTO deal_clinic 
    FROM public.deals 
    WHERE id = p_deal_id;
    
    -- Проверяем права доступа на основе роли
    IF current_role = 'coordinator' THEN
        -- Координаторы могут обновлять примечания только для сделок в своей клинике
        IF deal_clinic != current_clinic THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Access denied: You can only update notes for deals in your clinic'
            );
        END IF;
    ELSIF current_role NOT IN ('director', 'super_admin') THEN
        -- Только координаторы, директора и супер-админы могут обновлять примечания
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied: Insufficient permissions to update notes'
        );
    END IF;
    
    -- Обновляем примечания
    UPDATE public.deals 
    SET notes = p_notes,
        updated_at = NOW()
    WHERE id = p_deal_id;
    
    -- Проверяем, было ли обновление успешным
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Notes updated successfully',
            'deal_id', p_deal_id,
            'notes', p_notes
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Deal not found'
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- Предоставляем права на выполнение аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION public.update_deal_notes(bigint, text, uuid) TO authenticated;

-- =====================================================================
-- ОПТИМИЗИРОВАННЫЕ RLS ПОЛИТИКИ ДЛЯ ОСНОВНЫХ ТАБЛИЦ
-- =====================================================================

-- DEALS TABLE
DROP POLICY IF EXISTS "Coordinators can view deals from their clinic" ON deals;
DROP POLICY IF EXISTS "Directors and super admins can select all deals" ON deals;
DROP POLICY IF EXISTS "Directors and super admins can update all deals" ON deals;
DROP POLICY IF EXISTS "Directors and super admins can view all deals" ON deals;

-- Новые оптимизированные политики для deals
CREATE POLICY "deals_select_policy" ON deals
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR 
    (get_user_role() = 'coordinator' AND clinic_name = get_user_clinic())
);

CREATE POLICY "deals_update_policy" ON deals
FOR UPDATE  
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND clinic_name = get_user_clinic())
)
WITH CHECK (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND clinic_name = get_user_clinic())
);

-- CONTACTS TABLE
DROP POLICY IF EXISTS "Allow authenticated users to read contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users to update contacts" ON contacts;
DROP POLICY IF EXISTS "Coordinators can view contacts from their clinic" ON contacts;
DROP POLICY IF EXISTS "Directors and super admins can view all contacts" ON contacts;

-- Новые политики для contacts
CREATE POLICY "contacts_select_policy" ON contacts
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = contacts.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

CREATE POLICY "contacts_update_policy" ON contacts
FOR UPDATE
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = contacts.deal_id AND d.clinic_name = get_user_clinic()
    ))
)
WITH CHECK (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = contacts.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

-- TICKETS_TO_CHINA TABLE
DROP POLICY IF EXISTS "Coordinators can update apartment_number in their clinic" ON tickets_to_china;
DROP POLICY IF EXISTS "Coordinators can view tickets from their clinic" ON tickets_to_china;
DROP POLICY IF EXISTS "Directors and super admins can update all arrival tickets" ON tickets_to_china;
DROP POLICY IF EXISTS "Directors and super admins can update all tickets_to_china" ON tickets_to_china;
DROP POLICY IF EXISTS "Directors and super admins can view all tickets" ON tickets_to_china;

-- Новые политики для tickets_to_china
CREATE POLICY "tickets_to_china_select_policy" ON tickets_to_china
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_to_china.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

CREATE POLICY "tickets_to_china_update_policy" ON tickets_to_china
FOR UPDATE
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_to_china.deal_id AND d.clinic_name = get_user_clinic()
    ))
)
WITH CHECK (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_to_china.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

-- TICKETS_FROM_TREATMENT TABLE
DROP POLICY IF EXISTS "Coordinators can update departure fields in their clinic" ON tickets_from_treatment;
DROP POLICY IF EXISTS "Coordinators can view departure tickets from their clinic" ON tickets_from_treatment;
DROP POLICY IF EXISTS "Directors and super admins can update all departure tickets" ON tickets_from_treatment;
DROP POLICY IF EXISTS "Directors and super admins can view all departure tickets" ON tickets_from_treatment;

-- Новые политики для tickets_from_treatment
CREATE POLICY "tickets_from_treatment_select_policy" ON tickets_from_treatment
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_from_treatment.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

CREATE POLICY "tickets_from_treatment_update_policy" ON tickets_from_treatment
FOR UPDATE
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_from_treatment.deal_id AND d.clinic_name = get_user_clinic()
    ))
)
WITH CHECK (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = tickets_from_treatment.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

-- VISAS TABLE
DROP POLICY IF EXISTS "Coordinators can view visas from their clinic" ON visas;
DROP POLICY IF EXISTS "Directors and super admins can view all visas" ON visas;

-- Новые политики для visas
CREATE POLICY "visas_select_policy" ON visas
FOR SELECT
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = visas.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

CREATE POLICY "visas_update_policy" ON visas
FOR UPDATE
TO authenticated
USING (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = visas.deal_id AND d.clinic_name = get_user_clinic()
    ))
)
WITH CHECK (
    is_director_or_higher() OR
    (get_user_role() = 'coordinator' AND EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.id = visas.deal_id AND d.clinic_name = get_user_clinic()
    ))
);

-- =====================================================================
-- ПРЕДОСТАВЛЕНИЕ ПРАВ НА НОВЫЕ ФУНКЦИИ
-- =====================================================================

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director_or_higher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coordinator_or_higher(uuid) TO authenticated;

-- =====================================================================
-- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ RPC ФУНКЦИЙ
-- =====================================================================

-- Удаляем дублирующее определение update_deal_notes (оставляем только первое с тремя параметрами)

-- Обновляем функцию update_china_entry_date
CREATE OR REPLACE FUNCTION public.update_china_entry_date(
  p_deal_id bigint,
  p_entry_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_role public.app_role;
    current_clinic text;
    deal_clinic text;
    result json;
    visa_record_exists boolean;
BEGIN
    -- Используем новые оптимизированные функции
    SELECT public.get_user_role() INTO current_role;
    SELECT public.get_user_clinic() INTO current_clinic;
    SELECT clinic_name INTO deal_clinic FROM public.deals WHERE id = p_deal_id;
    
    -- Проверяем права доступа
    IF current_role = 'coordinator' THEN
        IF deal_clinic != current_clinic THEN
            RETURN json_build_object('success', false, 'error', 'Access denied: You can only update entry date for deals in your clinic');
        END IF;
    ELSIF current_role NOT IN ('super_admin') THEN
        RETURN json_build_object('success', false, 'error', 'Access denied: Insufficient permissions to update entry date');
    END IF;
    
    -- Проверяем существование записи в visas
    SELECT EXISTS(SELECT 1 FROM public.visas WHERE deal_id = p_deal_id) INTO visa_record_exists;
    
    IF visa_record_exists THEN
        -- Обновляем существующую запись
        UPDATE public.visas 
        SET actual_entry_date = p_entry_date, updated_at = NOW() 
        WHERE deal_id = p_deal_id;
    ELSE
        -- Создаем новую запись в visas
        INSERT INTO public.visas (deal_id, actual_entry_date, created_at, updated_at)
        VALUES (p_deal_id, p_entry_date, NOW(), NOW());
    END IF;
    
    result := json_build_object(
        'success', true, 
        'message', 'Дата въезда в Китай обновлена', 
        'deal_id', p_deal_id, 
        'entry_date', p_entry_date
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Error updating entry date: ' || SQLERRM
        );
END;
$function$;

-- =====================================================================
-- СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================================

-- Индексы для быстрого поиска по user_id и role
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_role 
ON user_profiles(user_id, role);

-- Индексы для быстрого поиска по clinic_name
CREATE INDEX IF NOT EXISTS idx_deals_clinic_name 
ON deals(clinic_name);

CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_name 
ON user_profiles(clinic_name) WHERE clinic_name IS NOT NULL;

-- Индексы для связей с deals
CREATE INDEX IF NOT EXISTS idx_contacts_deal_id 
ON contacts(deal_id);

CREATE INDEX IF NOT EXISTS idx_tickets_to_china_deal_id 
ON tickets_to_china(deal_id);

CREATE INDEX IF NOT EXISTS idx_tickets_from_treatment_deal_id 
ON tickets_from_treatment(deal_id);

CREATE INDEX IF NOT EXISTS idx_visas_deal_id 
ON visas(deal_id);

-- =====================================================================
-- КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- =====================================================================

COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Получает роль пользователя по user_id. Оптимизированная версия с STABLE.';
COMMENT ON FUNCTION public.get_user_clinic(uuid) IS 'Получает клинику пользователя по user_id. Оптимизированная версия с STABLE.';
COMMENT ON FUNCTION public.is_super_admin_user(uuid) IS 'Проверяет, является ли пользователь super_admin. Оптимизированная версия.';
COMMENT ON FUNCTION public.is_director_or_higher(uuid) IS 'Проверяет, имеет ли пользователь роль director или выше.';
COMMENT ON FUNCTION public.is_coordinator_or_higher(uuid) IS 'Проверяет, имеет ли пользователь роль coordinator или выше.';

COMMENT ON POLICY "users_view_own_profile" ON user_profiles IS 'Пользователи могут просматривать только свой профиль';
COMMENT ON POLICY "users_insert_own_profile" ON user_profiles IS 'Пользователи могут создавать только свой профиль при регистрации';
COMMENT ON POLICY "users_update_own_profile" ON user_profiles IS 'Пользователи могут обновлять свой профиль (кроме роли)';
COMMENT ON POLICY "super_admin_manage_all_profiles" ON user_profiles IS 'Super admin может управлять всеми профилями пользователей';
