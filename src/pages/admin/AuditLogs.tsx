import { useEffect, useState } from 'react';
import { adminApi } from '@/api/api';
import { toast } from 'sonner';
import { ScrollText, Shield, User, Globe } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.auditLogs().then((res) => { if (res.success) setLogs(res.logs || []); })
      .catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  const actionIcons: any = {
    user_update: <User className="w-4 h-4 text-blue-400" />,
    password_reset: <Shield className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ScrollText className="w-6 h-6" /> Audit Logs</h1>
        <p className="text-gray-400 text-sm">{logs.length} recorded actions</p>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 overflow-hidden">
        {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6FF2E]" /></div> :
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left p-3 text-xs font-medium text-gray-400">Action</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Details</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Admin</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">IP Address</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        {actionIcons[log.action] || <Globe className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm text-white capitalize">{log.action.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{log.details}</td>
                    <td className="p-3 text-xs text-gray-500">{log.admin_id || 'System'}</td>
                    <td className="p-3 text-xs text-gray-500 font-mono">{log.ip_address}</td>
                    <td className="p-3 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No audit logs yet</p>}
          </div>
        }
      </div>
    </div>
  );
}
