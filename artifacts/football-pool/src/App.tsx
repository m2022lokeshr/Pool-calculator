import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FixturesPage from "@/pages/FixturesPage";
import StandingsPage from "@/pages/StandingsPage";
import PrintExport from "@/components/PrintExport";

const queryClient = new QueryClient();

function Navigation() {
  const [location] = useLocation();

  return (
    <header className="glass-nav football-pattern sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 text-lg border border-primary/60">
            ⚽
          </div>
          <span className="font-display text-xl font-bold text-white tracking-widest">
            POOL<span className="text-primary">CALC</span>
          </span>
        </div>
        <nav className="flex gap-1 h-full">
          <Link
            href="/"
            className={`flex items-center gap-1.5 h-full px-5 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              location === '/'
                ? 'border-primary text-white bg-white/5'
                : 'border-transparent text-white/55 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚽ Fixtures
          </Link>
          <Link
            href="/standings"
            className={`flex items-center gap-1.5 h-full px-5 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              location === '/standings'
                ? 'border-primary text-white bg-white/5'
                : 'border-transparent text-white/55 hover:text-white hover:bg-white/5'
            }`}
          >
            📊 Points Table
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={FixturesPage} />
      <Route path="/standings" component={StandingsPage} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
