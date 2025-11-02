# 🚀 FinMG Coding Guide

Welcome to the FinMG codebase! This guide will help you understand the project structure, make changes, and extend functionality.

---

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (buttons, cards, etc.)
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── insights/       # AI insights components
│   ├── hooks/              # Custom React hooks for data management
│   ├── contexts/           # React contexts (Auth, Theme, etc.)
│   ├── pages/              # Page components (Index, Auth, etc.)
│   ├── lib/                # Utility functions
│   └── integrations/       # External service integrations (Supabase)
├── supabase/
│   ├── functions/          # Edge functions (serverless backend)
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

---

## 🎯 Key Concepts

### 1. **State Management**
- **Local State**: Use `useState` for component-specific data
- **Server State**: Use custom hooks (`useExpenses`, `useProfile`) for database data
- **Global State**: Use React Context (`AuthContext`) for app-wide data

**Example:**
```tsx
// ✅ Good: Custom hook for server data
const { expenses, addExpense } = useExpenses();

// ❌ Avoid: Fetching in component directly
useEffect(() => {
  fetch('/api/expenses').then(...)
}, [])
```

### 2. **Custom Hooks Pattern**
All data fetching and business logic should be in custom hooks:
- `useExpenses()` - Expense CRUD operations
- `useProfile()` - User profile management
- `useGoals()` - Financial goals
- `useBills()` - Bill reminders

**Benefits:**
- Reusable across components
- Easier to test
- Clean component code
- Centralized business logic

### 3. **Real-time Updates**
We use Supabase subscriptions for live data updates:

```tsx
useEffect(() => {
  const channel = supabase
    .channel('table_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      // Handle INSERT, UPDATE, DELETE
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user]);
```

---

## 💡 Common Coding Patterns

### Adding a New Feature

**1. Database First**
```sql
-- Create table in Supabase
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON new_feature FOR SELECT
  USING (auth.uid() = user_id);
```

**2. Create Custom Hook**
```tsx
// src/hooks/useNewFeature.tsx
export const useNewFeature = () => {
  const [data, setData] = useState([]);
  const { user } = useAuth();

  const fetchData = async () => {
    const { data } = await supabase
      .from('new_feature')
      .select('*')
      .eq('user_id', user.id);
    setData(data);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { data, fetchData };
};
```

**3. Create Component**
```tsx
// src/components/NewFeature.tsx
export function NewFeature() {
  const { data } = useNewFeature();
  
  return (
    <Card>
      {data.map(item => (
        <div key={item.id}>{item.data}</div>
      ))}
    </Card>
  );
}
```

**4. Add to Dashboard**
```tsx
// src/pages/Index.tsx
import { NewFeature } from '@/components/NewFeature';

// Add in appropriate tab
<TabsContent value="new">
  <NewFeature />
</TabsContent>
```

---

## 🎨 Styling Guidelines

### Design System First
**ALWAYS** use design tokens from `src/index.css`:

```tsx
// ✅ Good: Using design tokens
<div className="bg-primary text-primary-foreground">

// ❌ Bad: Direct colors
<div className="bg-blue-500 text-white">
```

### Conditional Styling
Use the `cn()` utility for combining classes:

```tsx
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    "base-classes",
    isActive && "active-classes",
    { "disabled": isDisabled }
  )}
/>
```

### Responsive Design
Always use mobile-first approach:

```tsx
<div className="
  grid 
  grid-cols-1      /* Mobile: 1 column */
  md:grid-cols-2   /* Tablet: 2 columns */
  lg:grid-cols-3   /* Desktop: 3 columns */
">
```

---

## 🔐 Security Best Practices

### 1. **Row Level Security (RLS)**
Every table MUST have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. **Client-Side Auth Checks**
```tsx
const { user } = useAuth();

if (!user) {
  return <Navigate to="/auth" />;
}
```

### 3. **Edge Function Auth**
```typescript
// Always verify user in edge functions
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 🤖 AI Integration Guide

### Using Lovable AI Gateway

**1. Edge Function Setup**
```typescript
// supabase/functions/your-ai-function/index.ts
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'Your system prompt here' },
      { role: 'user', content: userInput }
    ],
    stream: true  // or false for complete response
  }),
});
```

**2. Client-Side Calling**
```tsx
const { data, error } = await supabase.functions.invoke('your-ai-function', {
  body: { message: userInput }
});
```

### Available Models
- `google/gemini-2.5-flash` - **Default** (fast, balanced)
- `google/gemini-2.5-pro` - Highest quality
- `google/gemini-2.5-flash-lite` - Fastest, cheapest
- `openai/gpt-5` - OpenAI's best model

### Error Handling
```typescript
// Always handle these errors!
if (response.status === 429) {
  // Rate limit - wait and retry
}
if (response.status === 402) {
  // Out of credits - show user message
}
```

---

## 📊 Database Patterns

### Financial Calculations
```tsx
// Indian Rupee formatting
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);

// Tax calculations (FY 2025-26)
const calculateTax = (income: number) => {
  if (income <= 400000) return 0;
  if (income <= 800000) return (income - 400000) * 0.05;
  // ... more slabs
};
```

### Aggregations
```tsx
// Sum expenses by category
const categoryTotals = expenses.reduce((acc, expense) => {
  acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
  return acc;
}, {} as Record<string, number>);
```

---

## 🧪 Testing & Debugging

### Console Logging
```tsx
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}
```

### Edge Function Logs
View in Supabase Dashboard → Edge Functions → Select function → Logs

### Common Issues

**1. "User not found"**
- Check if user is logged in
- Verify auth token is being passed
- Check RLS policies

**2. "Failed to fetch"**
- Check CORS headers in edge function
- Verify edge function is deployed
- Check network tab for actual error

**3. "Rate limit exceeded"**
- Add delays between AI calls
- Implement caching
- Consider upgrading plan

---

## 🚀 Performance Tips

### 1. **Memoization**
```tsx
import { useMemo } from 'react';

const expensiveCalculation = useMemo(() => {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}, [expenses]); // Only recalculate when expenses change
```

### 2. **Lazy Loading**
```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

### 3. **Debouncing**
```tsx
import { useState, useEffect } from 'react';

const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500);
  return () => clearTimeout(timer);
}, [search]);
```

---

## 📝 Useful Code Snippets

### Toast Notification
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success! ✅",
  description: "Your expense has been added.",
  duration: 3000,
});
```

### Confetti Celebration
```tsx
const triggerConfetti = () => {
  const confetti = (window as any).confetti;
  if (confetti) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
};
```

### Date Formatting
```tsx
import { format } from 'date-fns';

const formattedDate = format(new Date(), 'dd MMM yyyy');
// Output: "15 Jan 2025"
```

---

## 🔧 Configuration Files

### Environment Variables
```env
# .env (DO NOT COMMIT!)
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Tailwind Config
```ts
// tailwind.config.ts
// Edit for custom colors, fonts, spacing
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        // Add custom colors here
      }
    }
  }
}
```

### Index.css
```css
/* src/index.css */
/* Edit CSS variables for theme customization */
:root {
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 20% 98%;
  /* ... more variables */
}
```

---

## 📚 Resources

### Documentation
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Helpful Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎓 Learning Path

1. **Understand the Auth Flow** (src/contexts/AuthContext.tsx)
2. **Study a Custom Hook** (src/hooks/useExpenses.tsx)
3. **Examine a Component** (src/components/dashboard/ExpenseTracker.tsx)
4. **Review an Edge Function** (supabase/functions/finbuddy-chat/index.ts)
5. **Make Your First Change** (Add a new category or feature)

---

## 💬 Need Help?

- Check inline code comments for specific guidance
- Review similar existing features for patterns
- Test in development before deploying
- Use browser DevTools and console logs
- Check Supabase dashboard for database/auth issues

---

**Happy Coding! 🚀**

Remember: 
- Keep it simple
- Comment your code
- Test your changes
- Follow existing patterns
- Ask for help when needed
