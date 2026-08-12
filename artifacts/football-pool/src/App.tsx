import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FixturesPage from "@/pages/FixturesPage";
import StandingsPage from "@/pages/StandingsPage";
import KnockoutPage from "@/pages/KnockoutPage";
import PrintExport from "@/components/PrintExport";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js';
import { motion } from "framer-motion";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuthReady } from '@/hooks/useAuthReady'
import { toast } from "@/hooks/use-toast"
import ViewPage from './pages/ViewPage'
import PickemPage from './pages/PickemPage'
import PoolDetailsPage from './pages/PoolDetailsPage'
import GuestPickemPage from './pages/GuestPickemPage'
import { isOrganizerUser } from './lib/authUser'

const queryClient = new QueryClient();

const NAV_TABS = [
  { href: "/dashboard",  label: "⌂ Overview",      testId: "nav-dashboard"   },
  { href: "/fixtures",   label: "⚽ Fixtures",      testId: "nav-fixtures"    },
  { href: "/standings",  label: "📊 Points Table",  testId: "nav-standings"   },
  { href: "/knockout",   label: "🏆 Knockout",      testId: "nav-knockout"    },
  { href: "/pickem",     label: "✦ Pick’em",        testId: "nav-pickem"      },
];

function AuthButton() {
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [, navigate] = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoading(false);
      if (isOrganizerUser(session?.user)) navigate('/dashboard');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isOrganizerUser(session?.user)) navigate('/dashboard');
    });

    return () => listener?.subscription.unsubscribe();
  }, []);
  if (isLoading) return null;

  return (
    <div className="flex w-full flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <button
        onClick={async () => {
          if (isSignUp) {
            const { error } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) toast({ variant: "destructive", title: "Sign up failed", description: error.message });
            else toast({ title: "Account created!", description: "Now switch to Log In." });
          } else {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) toast({ variant: "destructive", title: "Login failed", description: error.message });
            else navigate('/dashboard');
          }
        }}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
        data-testid="btn-login"
      >
        {isSignUp ? 'Sign Up' : 'Log In'}
      </button>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="self-center text-xs text-white/55 underline-offset-4 transition hover:text-white hover:underline"
      >
        {isSignUp ? 'Switch to Log In' : 'Switch to Sign Up'}
      </button>
    </div>
  );
}

function AccountActions() {
  const [user, setUser] = useState<User | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (!user || !isOrganizerUser(user)) return null;

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="hidden max-w-40 truncate text-xs text-white/55 sm:block" title={user.email ?? undefined}>
        {user.email}
      </span>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
        className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white"
        data-testid="btn-logout"
      >
        Sign out
      </button>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">

      {/* Glow orbs */}
      <div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute w-64 h-64 rounded-full bg-primary/5 blur-2xl bottom-1/4 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Ball */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-7xl mb-6 drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]"
      >
        ⚽
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-5xl font-black text-white tracking-widest mb-2"
        style={{ textShadow: "0 0 40px rgba(34,197,94,0.4)" }}
      >
        POOL<span className="text-primary">CALC</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-white/40 text-sm tracking-widest uppercase mb-10"
      >
        Football Tournament Manager
      </motion.p>

      {/* Authenticate before entering the tournament workspace. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-6 w-full max-w-sm rounded-2xl border border-white/10 bg-black/25 p-5 text-left shadow-2xl shadow-black/20 backdrop-blur-sm"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/80">
          Your tournament space
        </p>
        <p className="mb-5 text-sm text-white/60">
          Sign in to save your tournament
        </p>
        <AuthButton />
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-white/20 text-xs tracking-widest"
      >
        LEAGUE · STANDINGS · KNOCKOUT
      </motion.p>
    </div>
  );
}
function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <h1 className="font-display text-3xl font-bold tracking-wide">Tournament overview</h1>
      <p className="mt-2 max-w-xl text-white/55">Set up fixtures, record results, then create a Pick’em pool when you are ready to invite players.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/fixtures" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Set up fixtures</Link>
        <Link href="/pickem" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">Open Pick’em</Link>
      </div>
    </div>
  )
}
function Navigation() {
  const [location] = useLocation();
  if (location === "/" || location.startsWith('/pick/') || location.startsWith('/view/')) return null;

  return (
    <header className="glass-nav football-pattern sticky top-0 z-50 md:fixed md:inset-y-0 md:left-0 md:w-60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:h-full md:flex-col md:items-stretch md:py-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 text-lg border border-primary/60">
            ⚽
          </div>
          <span className="font-display text-xl font-bold text-white tracking-widest hidden sm:block">
            POOL<span className="text-primary">CALC</span>
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex h-full flex-1 overflow-x-auto scrollbar-hide md:flex-col md:gap-1 md:overflow-visible">
          {NAV_TABS.map(({ href, label, testId }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                className={`
                  flex items-center gap-1.5 h-full px-4 sm:px-5 text-xs sm:text-sm font-semibold
                  tracking-wide transition-all whitespace-nowrap border-b-2 shrink-0 md:h-auto md:rounded-lg md:border-0 md:py-3
                  ${active
                    ? "border-primary text-white bg-white/5"
                    : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="md:mt-auto"><AccountActions /></div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/fixtures" component={FixturesPage} />
      <Route path="/standings" component={StandingsPage} />
      <Route path="/knockout" component={KnockoutPage} />
      <Route path="/view/:token" component={ViewPage} />
      <Route path="/pickem" component={PickemPage} />
      <Route path="/pickem/:poolId" component={PoolDetailsPage} />
      <Route path="/pick/:token" component={GuestPickemPage} />
      <Route component={NotFound} />
      
    </Switch>
  );
}

function OrganizerRouteGuard({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isPublic = location === '/' || location.startsWith('/pick/') || location.startsWith('/view/');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isPublic && authChecked && !isOrganizerUser(user)) navigate('/');
  }, [authChecked, isPublic, navigate, user]);

  if (!isPublic && (!authChecked || !isOrganizerUser(user))) return null;
  return <>{children}</>;
}

function AppContent() {
  const [location] = useLocation();
  const isPublic = location === '/' || location.startsWith('/pick/') || location.startsWith('/view/');

  return (
    <div className={`min-h-screen flex flex-col selection:bg-primary/30 ${isPublic ? '' : 'md:pl-60'}`}>
      <OrganizerRouteGuard>
        <Navigation />
        <main className="flex-1"><Router /></main>
      </OrganizerRouteGuard>
    </div>
  );
}

function App() {
   const ready = useAuthReady()
if (!ready) return null 
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {/* Fixed stadium background layers */}
          <div className="pitch-bg-image" aria-hidden="true" />
          <div className="pitch-bg-overlay" aria-hidden="true" />

          <AppContent />
          <PrintExport />
        </WouterRouter>
        <Toaster />
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
