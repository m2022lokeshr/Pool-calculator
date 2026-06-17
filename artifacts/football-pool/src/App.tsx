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
import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js';
import { SpeedInsights } from '@vercel/speed-insights/react';

const queryClient = new QueryClient();

const NAV_TABS = [
  { href: "/fixtures",   label: "⚽ Fixtures",      testId: "nav-fixtures"    },
  { href: "/standings",  label: "📊 Points Table",  testId: "nav-standings"   },
  { href: "/knockout",   label: "🏆 Knockout",      testId: "nav-knockout"    },
];

function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (isLoading) return null;

  if (user) {
    return (
      <button
        onClick={() => supabase.auth.signOut()}
        className="shrink-0 text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-md px-3 py-1.5 transition-colors"
        data-testid="btn-logout"
      >
        {user.email ? `Sign out (${user.email})` : "Sign out"}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
      />
      <button
        onClick={async () => {
          if (isSignUp) {
            const { error } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) alert(error.message);
            else alert('Account created! Now switch to Log In.');
          } else {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) alert(error.message);
          }
        }}
        className="shrink-0 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-md px-3 py-1.5 transition-colors shadow shadow-primary/30"
        data-testid="btn-login"
      >
        {isSignUp ? 'Sign Up' : 'Log In'}
      </button>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          fontSize: '12px',
          color: '#666',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        {isSignUp ? 'Switch to Log In' : 'Switch to Sign Up'}
      </button>
    </div>
  );
}
import { motion } from "framer-motion";

function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">

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

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/fixtures")}
        className="relative px-10 py-4 bg-primary text-white font-bold rounded-2xl text-base tracking-wide shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_50px_rgba(34,197,94,0.7)] transition-shadow"
      >
        🏟️ Start Tournament
        {/* Button inner glow */}
        <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      </motion.button>

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
function Navigation() {
  const [location] = useLocation();
  if (location === "/") return null; // Hide nav on landing page

  return (
    <header className="glass-nav football-pattern sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
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
        <nav className="flex h-full overflow-x-auto scrollbar-hide flex-1">
          {NAV_TABS.map(({ href, label, testId }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                className={`
                  flex items-center gap-1.5 h-full px-4 sm:px-5 text-xs sm:text-sm font-semibold
                  tracking-wide transition-all whitespace-nowrap border-b-2 shrink-0
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

        {/* Auth */}
        <AuthButton />
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/fixtures" component={FixturesPage} />
      <Route path="/standings" component={StandingsPage} />
      <Route path="/knockout" component={KnockoutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {/* Fixed stadium background layers */}
          <div className="pitch-bg-image" aria-hidden="true" />
          <div className="pitch-bg-overlay" aria-hidden="true" />

          <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30">
            <Navigation />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <PrintExport />
        </WouterRouter>
        <Toaster />
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
