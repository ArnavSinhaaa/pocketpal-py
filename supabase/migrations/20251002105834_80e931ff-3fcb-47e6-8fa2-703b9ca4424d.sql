-- Fix the update_user_stats trigger to properly handle different tables
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expenses count and streak when new expense is added
  IF TG_TABLE_NAME = 'expenses' AND TG_OP = 'INSERT' THEN
    UPDATE public.user_stats 
    SET 
      expenses_count = expenses_count + 1,
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Update goals completed when goal is marked complete (only for financial_goals table)
  IF TG_TABLE_NAME = 'financial_goals' AND TG_OP = 'UPDATE' THEN
    -- Only check current_amount when we know we're in the financial_goals table
    IF NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
      UPDATE public.user_stats 
      SET 
        goals_completed = goals_completed + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;