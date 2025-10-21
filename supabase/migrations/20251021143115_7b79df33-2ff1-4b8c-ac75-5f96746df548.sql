-- Create table for indirect income sources
CREATE TABLE public.indirect_income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  income_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indirect_income_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own indirect income sources"
ON public.indirect_income_sources
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own indirect income sources"
ON public.indirect_income_sources
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indirect income sources"
ON public.indirect_income_sources
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indirect income sources"
ON public.indirect_income_sources
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_indirect_income_sources_updated_at
BEFORE UPDATE ON public.indirect_income_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();