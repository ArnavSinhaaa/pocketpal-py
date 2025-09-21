-- Add missing DELETE policy for user_stats table
CREATE POLICY "Users can delete their own stats" 
ON public.user_stats 
FOR DELETE 
USING (auth.uid() = user_id);