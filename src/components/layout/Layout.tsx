import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, Target, Radio, BookOpen, Settings, LogOut,
  Menu, Bell, X, Shield, PieChart, History, TrendingUp, Heart, Database 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { AutoJournalModal } from '../journal/AutoJournalModal';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Triage', path: '/triage' },
  { icon: Target, label: 'Roadmap', path: '/roadmap' },
  { icon: PieChart, label: 'Budget', path: '/budget' },
  { icon: Database, label: 'Ingestion', path: '/ingestion' }, 
  { icon: History, label: 'Ledger', path: '/ledger' },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
  { icon: Heart, label: 'Generosity', path: '/generosity' },
  { icon: Radio, label: 'Signals', path: '/signals' },
  { icon: BookOpen, label: 'Journal', path: '/journal' },
  { icon: Shield, label: 'Rules', path: '/constitution' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface LayoutProps {
  onLogout: () => void;
}

export const Layout = ({ onLogout }: LayoutProps) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-black font-sans text-white selection:bg-accent-success/30 relative">

      <AutoJournalModal />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-white/10 bg-black/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:bg-transparent",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 md:h-20 items-center justify-between px-6 md:px-8 border-b border-white/5 shrink-0">
          <div className="text-lg md:text-xl font-bold tracking-wider text-white">
            THE <span className="text-accent-success">riot'</span> SOP
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-2 -mr-2">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 md:space-y-1 px-3 md:px-4 py-4 md:py-6 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 md:gap-4 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold transition-all duration-200",
                  isActive 
                    ? "bg-accent-success/10 text-accent-success border border-accent-success/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <item.icon className={cn("h-4 w-4 md:h-5 md:w-5", isActive && "animate-pulse")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 md:p-4 shrink-0">
          <button 
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent"
          >
            <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full min-w-0 relative flex flex-col h-screen overflow-hidden">
        <header className="shrink-0 flex h-14 md:h-20 items-center justify-between border-b border-white/10 bg-black/50 px-4 md:px-8 backdrop-blur-xl z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-400 hover:text-white p-1">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-sm tracking-widest text-white">THE riot' SOP</span>
          </div>

          <div className="hidden text-[10px] md:text-xs font-mono font-bold text-gray-500 lg:block tracking-widest uppercase">
            // FINANCIAL COMMAND CENTER
          </div>

          <div className="flex items-center gap-4 md:gap-6">
             <div className="hidden md:flex items-center gap-2 rounded-full border border-accent-success/20 bg-accent-success/5 px-3 py-1 md:px-4 md:py-1.5 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 md:h-2 md:w-2 animate-pulse rounded-full bg-accent-success shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[9px] md:text-[10px] font-bold tracking-widest text-accent-success">SYSTEM ONLINE</span>
             </div>
             <button className="relative text-gray-400 hover:text-white transition-colors p-1">
               <Bell className="h-4 w-4 md:h-5 md:w-5" />
               <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent-danger animate-ping"></span>
               <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent-danger"></span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
