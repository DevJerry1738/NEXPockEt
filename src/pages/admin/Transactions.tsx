import { useEffect, useState } from 'react';
import { transactionApi, storageApi } from '@/api/api';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle, Clock, ArrowLeftRight, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Proof viewer state
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  // Reject with reason state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await transactionApi.adminList();
      setTransactions(res.transactions || []);
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this transaction? This will update the user balance.')) return;
    try { await transactionApi.approve(id); toast.success('Transaction approved'); fetchTransactions(); }
    catch (err: any) { toast.error(err.message); }
  };

  const openReject = (id: number) => { setRejectId(id); setRejectReason(''); setRejectOpen(true); };

  const handleReject = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setRejectSubmitting(true);
    try {
      await transactionApi.reject(rejectId, rejectReason.trim());
      toast.success('Transaction rejected');
      setRejectOpen(false); setRejectId(null); setRejectReason('');
      fetchTransactions();
    } catch (err: any) { toast.error(err.message); }
    finally { setRejectSubmitting(false); }
  };

  const viewProof = async (path: string) => {
    setProofLoading(true);
    setProofOpen(true);
    setProofUrl(null);
    try {
      const url = await storageApi.getProofUrl(path);
      setProofUrl(url);
    } catch { toast.error('Failed to load proof image'); }
    finally { setProofLoading(false); }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'deposit-pending', label: 'Pending Deposits' },
    { value: 'withdraw-pending', label: 'Pending Withdrawals' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdraw', label: 'Withdrawals' },
  ];

  const filtered = transactions.filter((t) => {
    if (!filter) return true;
    if (filter === 'deposit-pending') return t.type === 'deposit' && t.status === 'pending';
    if (filter === 'withdraw-pending') return (t.type === 'withdraw' || t.type === 'withdrawal') && t.status === 'pending';
    if (filter === 'deposit') return t.type === 'deposit';
    if (filter === 'withdraw') return t.type === 'withdraw' || t.type === 'withdrawal';
    return true;
  });

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6" /> Transactions
            {pendingCount > 0 && (
              <span className="text-sm bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">{pendingCount} pending</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button key={f.value} size="sm" onClick={() => setFilter(f.value)}
              className={filter === f.value ? 'bg-[#F6FF2E] text-[#0A0C10]' : 'border border-white/10 bg-transparent text-gray-300 hover:bg-white/5'}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 overflow-hidden">
        {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6FF2E]" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-3 text-xs font-medium text-gray-400">User</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Type</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Method</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Proof</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <p className="text-sm text-white">{tx.profiles?.name || tx.user_name || '—'}</p>
                      <p className="text-xs text-gray-500">{tx.profiles?.email || tx.user_email || ''}</p>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                        <span className="text-xs capitalize text-gray-300">{tx.type}</span>
                      </span>
                    </td>
                    <td className="p-3 text-sm font-medium text-white">${parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="p-3">
                      <p className="text-xs text-gray-300 font-medium">{tx.payment_method}</p>
                      {tx.details && (
                        <p className="text-[10px] text-gray-500 font-mono mt-1 bg-white/5 p-1 rounded border border-white/5 break-all max-w-[150px]">
                          {tx.details}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      {tx.proof_url ? (
                        <button onClick={() => viewProof(tx.proof_url)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 px-2 py-1 rounded-md transition-colors">
                          <ImageIcon className="w-3 h-3" /> View
                        </button>
                      ) : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs capitalize flex items-center gap-1 ${tx.status === 'pending' ? 'text-amber-400' : tx.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                        {tx.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                      {tx.rejection_reason && <p className="text-xs text-red-400/70 mt-0.5 max-w-[120px] truncate" title={tx.rejection_reason}>{tx.rejection_reason}</p>}
                    </td>
                    <td className="p-3 text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      {tx.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => handleApprove(tx.id)} className="h-7 px-2 bg-green-600 hover:bg-green-500 text-white text-xs">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" onClick={() => openReject(tx.id)} variant="destructive" className="h-7 px-2 text-xs">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-gray-500 text-sm">No transactions found</p>}
          </div>
        )}
      </div>

      {/* Proof Image Viewer Dialog */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Proof of Payment</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-center min-h-[200px]">
            {proofLoading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" />
            ) : proofUrl ? (
              <img src={proofUrl} alt="Proof of payment" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <X className="w-10 h-10" />
                <p className="text-sm">Could not load image</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject with Reason Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" /> Reject Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-400">Please provide a reason for rejection. This will be shown to the user.</p>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment proof is unclear, amount does not match..."
              className="bg-[#0A0C10] border-white/10 text-white min-h-[100px]" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRejectOpen(false)} className="flex-1 border-white/10 text-gray-300">Cancel</Button>
              <Button onClick={handleReject} disabled={rejectSubmitting} variant="destructive" className="flex-1">
                {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
