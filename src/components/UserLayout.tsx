import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { notificationApi } from '@/api/api';
import {
  LayoutDashboard, ListChecks, Wallet, ShieldCheck, Users,
  Bell, UserCircle, LogOut, ChevronLeft, ChevronRight, Menu,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plans', icon: Zap, label: 'Investment Plans' },
  { to: '/tasks', icon: ListChecks, label: 'Tasks' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/kyc', icon: ShieldCheck, label: 'KYC' },
  { to: '/referrals', icon: Users, label: 'Referrals' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function UserLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await notificationApi.unreadCount();
        if (data.success) setUnreadCount(data.count);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-[#14192A] border-r border-white/5 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#F6FF2E]" />
              <span className="font-bold text-lg">NEXPockEt</span>
            </div>
          )}
          {collapsed && <Zap className="w-6 h-6 text-[#F6FF2E] mx-auto" />}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="hidden md:block text-gray-400 hover:text-white">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-[#F6FF2E]/10 text-[#F6FF2E]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-[#F6FF2E] text-[#0A0C10] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <button
              onClick={() => { navigate('/admin'); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-[#F6FF2E] hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
            >
              <Zap className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </button>
          )}
        </nav>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#14192A]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 md:px-6">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-400">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">${(user?.balance || 0).toFixed(2)}</p>
            </div>
            <img src={user?.avatar || ''} alt="" className="w-9 h-9 rounded-full bg-gray-700 border border-[#F6FF2E]/20" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
