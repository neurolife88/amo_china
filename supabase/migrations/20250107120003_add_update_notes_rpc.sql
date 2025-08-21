-- Create RPC function for updating notes in deals table
CREATE OR REPLACE FUNCTION public.update_deal_notes(
  p_deal_id bigint,
  p_notes text
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
    -- Get current user's role and clinic
    SELECT get_current_user_role() INTO current_role;
    SELECT get_current_user_clinic() INTO current_clinic;
    
    -- Get the clinic for this deal
    SELECT clinic_name INTO deal_clinic 
    FROM public.deals 
    WHERE id = p_deal_id;
    
    -- Check permissions based on role
    IF current_role = 'coordinator' THEN
        -- Coordinators can only update notes for deals in their clinic
        IF deal_clinic != current_clinic THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Access denied: You can only update notes for deals in your clinic'
            );
        END IF;
    ELSIF current_role NOT IN ('director', 'super_admin') THEN
        -- Only coordinators, directors, and super_admins can update notes
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied: Insufficient permissions to update notes'
        );
    END IF;
    
    -- Update the notes
    UPDATE public.deals 
    SET notes = p_notes,
        updated_at = NOW()
    WHERE id = p_deal_id;
    
    -- Check if update was successful
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_deal_notes(bigint, text) TO authenticated;
