-- Investment Portfolio Table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_type TEXT NOT NULL, -- stocks, mutual_funds, bonds, real_estate, gold, crypto, fd, ppf
  name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  current_price NUMERIC,
  current_value NUMERIC,
  category TEXT, -- equity, debt, hybrid, commodity
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assets Table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL, -- property, vehicle, jewelry, business, other
  name TEXT NOT NULL,
  purchase_date DATE,
  purchase_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  depreciation_rate NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Liabilities/Debts Table
CREATE TABLE public.liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  liability_type TEXT NOT NULL, -- home_loan, personal_loan, car_loan, credit_card, other
  lender TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  outstanding_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  emi_amount NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tax Deductions Table
CREATE TABLE public.tax_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deduction_type TEXT NOT NULL, -- 80c, 80d, home_loan_interest, hra, other
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  financial_year TEXT NOT NULL,
  proof_document_url TEXT,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents Table
CREATE TABLE public.financial_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- receipt, invoice, tax_document, investment_proof, loan_agreement, other
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  related_expense_id UUID,
  related_investment_id UUID,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insurance Policies Table
CREATE TABLE public.insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_type TEXT NOT NULL, -- life, health, vehicle, property, other
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_amount NUMERIC NOT NULL,
  premium_amount NUMERIC NOT NULL,
  premium_frequency TEXT NOT NULL, -- monthly, quarterly, yearly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_premium_date DATE,
  beneficiaries TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Investments
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Assets
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Liabilities
CREATE POLICY "Users can view their own liabilities" ON public.liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own liabilities" ON public.liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own liabilities" ON public.liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own liabilities" ON public.liabilities FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Tax Deductions
CREATE POLICY "Users can view their own tax deductions" ON public.tax_deductions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tax deductions" ON public.tax_deductions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax deductions" ON public.tax_deductions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tax deductions" ON public.tax_deductions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Financial Documents
CREATE POLICY "Users can view their own documents" ON public.financial_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.financial_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.financial_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.financial_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Insurance Policies
CREATE POLICY "Users can view their own insurance policies" ON public.insurance_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insurance policies" ON public.insurance_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insurance policies" ON public.insurance_policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insurance policies" ON public.insurance_policies FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON public.liabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_deductions_updated_at BEFORE UPDATE ON public.tax_deductions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON public.insurance_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();