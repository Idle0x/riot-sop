import { Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Radio, 
  BookOpen, 
  Settings, 
  LogOut,
  Menu,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn'; // We will create this utility next, don't worry about error

// Navigation Items
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Triage', path: '/triage' },
  { icon: Target, label: 'Roadmap', path: '/roadmap' },
  { icon: Radio, label: 'Signals', path: '/signals' },
  { icon: BookOpen, label: 'Journal', path: '/journal' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg-primary font-sans text-white">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="fixed hidden h-screen w-64 flex-col border-r border-glass-border bg-glass/30 backdrop-blur-xl lg:flex">
        {/* Logo Area */}
        <div className="flex h-20 items-center px-8">
          <div className="text-xl font-bold tracking-wider text-white">
            THE <span className="text-accent-success">riot'</span> SOP
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-8">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-accent-success/10 text-accent-success shadow-glass-sm" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-glass-border p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400">
            <LogOut className="h-5 w-5" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-glass-border bg-glass/50 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold">THE riot' SOP</span>
          </div>

          <div className="hidden text-sm font-medium text-gray-400 lg:block">
            // FINANCIAL COMMAND CENTER
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 rounded-full border border-glass-border bg-black/20 px-4 py-1.5 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent-success"></div>
                <span className="text-xs font-bold tracking-wider text-accent-success">SYSTEM ONLINE</span>
             </div>
             <button className="relative text-gray-400 hover:text-white">
               <Bell className="h-5 w-5" />
               <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-danger"></span>
             </button>
          </div>
        </header>

        {/* Page Content Injection Point */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
