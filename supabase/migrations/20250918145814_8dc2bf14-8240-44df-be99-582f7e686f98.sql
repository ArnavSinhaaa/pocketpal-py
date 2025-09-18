-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the update_user_stats function
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
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
  
  -- Update goals completed when goal is marked complete
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;