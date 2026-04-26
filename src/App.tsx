import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import UserLayout from '@/components/UserLayout';
import AdminLayout from '@/components/AdminLayout';

import UserDashboard from '@/pages/user/Dashboard';
import UserTasks from '@/pages/user/Tasks';
import UserWallet from '@/pages/user/Wallet';
import UserKyc from '@/pages/user/Kyc';
import UserReferrals from '@/pages/user/Referrals';
import UserNotifications from '@/pages/user/Notifications';
import UserProfile from '@/pages/user/Profile';
import UserPlans from '@/pages/user/Plans';


import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminTasks from '@/pages/admin/Tasks';
import AdminBonusTasks from '@/pages/admin/BonusTasks';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminKyc from '@/pages/admin/Kyc';
import AdminPlans from '@/pages/admin/Plans';
import AdminPayments from '@/pages/admin/Payments';
import AdminSettings from '@/pages/admin/Settings';
import AdminAuditLogs from '@/pages/admin/AuditLogs';
import AdminNotifications from '@/pages/admin/Notifications';

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6FF2E]" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/tasks" element={<UserTasks />} />
        <Route path="/wallet" element={<UserWallet />} />
        <Route path="/kyc" element={<UserKyc />} />
        <Route path="/referrals" element={<UserReferrals />} />
        <Route path="/notifications" element={<UserNotifications />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/plans" element={<UserPlans />} />

      </Route>

      <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/tasks" element={<AdminTasks />} />
        <Route path="/admin/bonus-tasks" element={<AdminBonusTasks />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/kyc" element={<AdminKyc />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}
