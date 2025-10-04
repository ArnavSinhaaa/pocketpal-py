-- Add last_expense_date column to track when user last logged an expense
ALTER TABLE public.user_stats 
ADD COLUMN IF NOT EXISTS last_expense_date DATE;

-- Drop all existing triggers that depend on the function
DROP TRIGGER IF EXISTS update_stats_on_expense ON public.expenses;
DROP TRIGGER IF EXISTS update_stats_on_goal_completion ON public.financial_goals;
DROP TRIGGER IF EXISTS trigger_update_user_stats_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trigger_update_user_stats_goals ON public.financial_goals;
DROP TRIGGER IF EXISTS on_expense_created ON public.expenses;
DROP TRIGGER IF EXISTS on_goal_updated ON public.financial_goals;

-- Now drop the function
DROP FUNCTION IF EXISTS public.update_user_stats();

-- Create improved function to properly track daily streaks
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_date DATE;
  new_streak INTEGER;
BEGIN
  -- Update expenses count and streak when new expense is added
  IF TG_TABLE_NAME = 'expenses' AND TG_OP = 'INSERT' THEN
    -- Get the user's last expense date
    SELECT last_expense_date INTO last_date
    FROM public.user_stats
    WHERE user_id = NEW.user_id;
    
    -- Only update streak if this is a new day
    IF last_date IS NULL OR last_date < CURRENT_DATE THEN
      -- Calculate new streak
      IF last_date IS NULL THEN
        -- First expense ever
        new_streak := 1;
      ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day - increment streak
        SELECT current_streak + 1 INTO new_streak
        FROM public.user_stats
        WHERE user_id = NEW.user_id;
      ELSIF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Missed days - reset streak
        new_streak := 1;
      ELSE
        -- Same day or future date (shouldn't happen) - keep current streak
        SELECT current_streak INTO new_streak
        FROM public.user_stats
        WHERE user_id = NEW.user_id;
      END IF;
      
      -- Update stats with new streak and date
      UPDATE public.user_stats 
      SET 
        expenses_count = expenses_count + 1,
        current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_expense_date = CURRENT_DATE,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Same day - just increment expense count
      UPDATE public.user_stats 
      SET 
        expenses_count = expenses_count + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  -- Update goals completed when goal is marked complete
  IF TG_TABLE_NAME = 'financial_goals' AND TG_OP = 'UPDATE' THEN
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
$$;

-- Recreate trigger for expenses
CREATE TRIGGER on_expense_created
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats();

-- Recreate trigger for goals
CREATE TRIGGER on_goal_updated
  AFTER UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats();