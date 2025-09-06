-- Create finance management tables
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'DollarSign',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.budget_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date DATE,
  category TEXT DEFAULT 'Savings',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.bill_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT DEFAULT 'monthly', -- monthly, weekly, yearly, one-time
  category TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT DEFAULT 'Trophy',
  badge_color TEXT DEFAULT '#FFD700',
  points INTEGER DEFAULT 0,
  category TEXT NOT NULL, -- savings, budgeting, consistency, etc.
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  savings_streak INTEGER DEFAULT 0,
  budget_streak INTEGER DEFAULT 0,
  goals_completed INTEGER DEFAULT 0,
  total_saved DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'INR',
  salary DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_categories (public read, admin write)
CREATE POLICY "Expense categories are viewable by everyone" 
ON public.expense_categories FOR SELECT USING (true);

-- Create policies for expenses
CREATE POLICY "Users can view their own expenses" 
ON public.expenses FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own expenses" 
ON public.expenses FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own expenses" 
ON public.expenses FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own expenses" 
ON public.expenses FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for budget_goals
CREATE POLICY "Users can view their own budget goals" 
ON public.budget_goals FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own budget goals" 
ON public.budget_goals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own budget goals" 
ON public.budget_goals FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own budget goals" 
ON public.budget_goals FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for financial_goals
CREATE POLICY "Users can view their own financial goals" 
ON public.financial_goals FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own financial goals" 
ON public.financial_goals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own financial goals" 
ON public.financial_goals FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own financial goals" 
ON public.financial_goals FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for bill_reminders
CREATE POLICY "Users can view their own bill reminders" 
ON public.bill_reminders FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own bill reminders" 
ON public.bill_reminders FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own bill reminders" 
ON public.bill_reminders FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own bill reminders" 
ON public.bill_reminders FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements" 
ON public.achievements FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own achievements" 
ON public.achievements FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create policies for user_stats
CREATE POLICY "Users can view their own stats" 
ON public.user_stats FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own stats" 
ON public.user_stats FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own stats" 
ON public.user_stats FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, color, icon) VALUES
('Food & Dining', '#EF4444', 'UtensilsCrossed'),
('Transportation', '#3B82F6', 'Car'),
('Entertainment', '#8B5CF6', 'Film'),
('Healthcare', '#10B981', 'Heart'),
('Shopping', '#F59E0B', 'ShoppingBag'),
('Utilities', '#6B7280', 'Zap'),
('Education', '#14B8A6', 'GraduationCap'),
('Travel', '#EC4899', 'Plane'),
('Investment', '#059669', 'TrendingUp'),
('Other', '#6B7280', 'Package');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_goals_updated_at
  BEFORE UPDATE ON public.budget_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bill_reminders_updated_at
  BEFORE UPDATE ON public.bill_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();