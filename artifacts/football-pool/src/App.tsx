import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FixturesPage from "@/pages/FixturesPage";
import StandingsPage from "@/pages/StandingsPage";

const queryClient = new QueryClient();

function Navigation() {
  const [location] = useLocation();

  return (
    <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
            ⚽
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground tracking-wide">
            POOL<span className="text-primary-foreground/70">CALC</span>
          </span>
        </div>
        <nav className="flex gap-2 h-full">
          <Link href="/" className={`flex items-center h-full px-4 text-sm font-medium transition-colors border-b-2 ${location === '/' ? 'border-primary text-primary-foreground' : 'border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
            Fixtures
          </Link>
          <Link href="/standings" className={`flex items-center h-full px-4 text-sm font-medium transition-colors border-b-2 ${location === '/standings' ? 'border-primary text-primary-foreground' : 'border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
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
          <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
            <Navigation />
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
