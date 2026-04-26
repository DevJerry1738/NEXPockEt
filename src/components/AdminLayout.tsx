import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ListChecks, Gift, ArrowLeftRight,
  ShieldCheck, CreditCard, Settings, ScrollText, Bell,
  LogOut, ChevronLeft, ChevronRight, Menu, Zap, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/tasks', icon: ListChecks, label: 'Tasks' },
  { to: '/admin/bonus-tasks', icon: Gift, label: 'Bonus Tasks' },
  { to: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/admin/kyc', icon: ShieldCheck, label: 'KYC Verification' },
  { to: '/admin/plans', icon: BarChart3, label: 'Plans' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-[#1a1f35] border-r border-white/5 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#F6FF2E]" />
              <span className="font-bold text-lg">Admin</span>
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
              end={item.to === '/admin'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-[#F6FF2E]/10 text-[#F6FF2E]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-white/5 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-[#F6FF2E] hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            {!collapsed && <span>User View</span>}
          </button>
          <button
            onClick={() => { logout(); toast.success('Logged out'); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#1a1f35]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 md:px-6">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-400">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            {user?.avatar && (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full bg-gray-700 border border-[#F6FF2E]/20" />
            )}
            {!user?.avatar && (
              <div className="w-9 h-9 rounded-full bg-gray-700 border border-[#F6FF2E]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
