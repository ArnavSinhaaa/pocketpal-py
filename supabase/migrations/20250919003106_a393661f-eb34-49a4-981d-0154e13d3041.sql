-- Fix the trigger that's causing the expense insertion error
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
  IF TG_TABLE_NAME = 'financial_goals' AND TG_OP = 'UPDATE' AND 
     NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount THEN
    UPDATE public.user_stats 
    SET 
      goals_completed = goals_completed + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers for the update_user_stats function
DROP TRIGGER IF EXISTS trigger_update_user_stats_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trigger_update_user_stats_goals ON public.financial_goals;

CREATE TRIGGER trigger_update_user_stats_expenses
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

CREATE TRIGGER trigger_update_user_stats_goals
  AFTER UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();