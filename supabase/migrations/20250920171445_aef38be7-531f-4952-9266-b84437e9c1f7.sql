-- Fix user achievements table policies
CREATE POLICY "Users can delete their own achievements" 
ON public.user_achievements 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);