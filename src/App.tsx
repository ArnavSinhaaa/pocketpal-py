/**
 * ========================================
 * APP.TSX - Main Application Entry Point
 * ========================================
 * 
 * This is the root component that sets up all the global providers and routing.
 * Think of this as the "wrapper" that contains your entire app.
 * 
 * CODING TIP: Keep this file clean and minimal. All business logic should be in
 * components, hooks, or contexts - not here!
 */

import { lazy, Suspense } from "react";

// UI Components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// React Query for server state management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Routing
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Global Providers
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-loaded Pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

/**
 * QueryClient Configuration
 * 
 * This manages all server state (API calls, cache, refetching)
 * CODING TIP: You can add default options here like:
 * new QueryClient({
 *   defaultOptions: {
 *     queries: { staleTime: 1000 * 60 * 5 } // 5 minutes
 *   }
 * })
 */
const queryClient = new QueryClient();

/**
 * Main App Component
 * 
 * Provider Hierarchy (order matters!):
 * 1. QueryClientProvider - Enables React Query throughout the app
 * 2. ThemeProvider - Manages dark/light mode
 * 3. TooltipProvider - Enables tooltips globally
 * 4. AuthProvider - Manages user authentication state
 * 5. BrowserRouter - Enables routing
 * 
 * CODING TIP: When adding new global providers, consider their dependencies
 * and place them in the correct order. For example, if a provider needs auth,
 * it should be inside AuthProvider.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Theme Provider: Handles dark/light mode with system preference detection */}
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Tooltip Provider: Makes tooltips available everywhere */}
      <TooltipProvider>
        {/* Auth Provider: Makes user auth state available to all components */}
        <AuthProvider>
          {/* Toast Notifications: Two types for different use cases */}
          <Toaster />  {/* Standard toasts */}
          <Sonner />   {/* Sonner-style toasts (more modern) */}
          
          {/* Router: Manages all page navigation */}
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                
                {/* Protected route: Requires authentication */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route: Must be last! Handles 404s */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
