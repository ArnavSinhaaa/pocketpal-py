-- Add annual_salary column to profiles table to persist salary data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS annual_salary numeric DEFAULT 0;