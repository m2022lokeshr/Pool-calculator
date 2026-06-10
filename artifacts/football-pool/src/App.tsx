import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FixturesPage from "@/pages/FixturesPage";
import StandingsPage from "@/pages/StandingsPage";
import KnockoutPage from "@/pages/KnockoutPage";
import PrintExport from "@/components/PrintExport";

const queryClient = new QueryClient();

const NAV_TABS = [
  { href: "/",           label: "⚽ Fixtures",      testId: "nav-fixtures"    },
  { href: "/standings",  label: "📊 Points Table",  testId: "nav-standings"   },
  { href: "/knockout",   label: "🏆 Knockout",      testId: "nav-knockout"    },
];

function Navigation() {
  const [location] = useLocation();

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
        <nav className="flex h-full overflow-x-auto scrollbar-hide">
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
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={FixturesPage} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
