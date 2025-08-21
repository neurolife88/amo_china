-- =====================================================================
-- ИСПРАВЛЕНИЕ RPC ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ПРИМЕЧАНИЙ
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
