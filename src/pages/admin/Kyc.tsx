import { useEffect, useState } from 'react';
import { kycApi, storageApi } from '@/api/api';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle, XCircle, Eye, FileText, User as UserIcon, Calendar, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function AdminKyc() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});

  const fetchKyc = async () => {
    try {
      const res = await kycApi.adminList();
      setKycList(res.kyc_list || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKyc(); }, []);

  const handleVerify = async (id: number) => {
    try {
      await kycApi.verify(id);
      toast.success('KYC verified successfully');
      fetchKyc();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    try {
      await kycApi.reject(selected.id, rejectReason);
      toast.success('KYC rejected');
      setRejectDialog(false);
      setSelected(null);
      setRejectReason('');
      fetchKyc();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openView = async (kyc: any) => {
    setSelected(kyc);
    // Fetch signed URLs for all images
    const urls: { [key: string]: string } = {};
    if (kyc.front_image_url) urls.front = await storageApi.getKycUrl(kyc.front_image_url) || '';
    if (kyc.back_image_url) urls.back = await storageApi.getKycUrl(kyc.back_image_url) || '';
    if (kyc.selfie_image_url) urls.selfie = await storageApi.getKycUrl(kyc.selfie_image_url) || '';
    setSignedUrls(urls);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-[#F6FF2E]" />
            KYC Verification
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and verify user identity documents
          </p>
        </div>
        <div className="bg-[#1a1f35] border border-white/5 px-4 py-2 rounded-xl">
          <p className="text-xs text-gray-400">Pending Review</p>
          <p className="text-xl font-bold text-[#F6FF2E]">
            {kycList.filter(k => k.status === 'pending').length}
          </p>
        </div>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Document Type</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Number</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kycList.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{k.profiles?.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500">{k.profiles?.email || 'No Email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-300 capitalize bg-white/5 px-2 py-1 rounded-md">
                        {k.document_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-mono">
                      {k.id_number}
                    </td>
                    <td className="p-4">
                      <span className={`
                        px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight
                        ${k.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                          k.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'}
                      `}>
                        {k.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(k.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => openView(k)}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {k.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleVerify(k.id)}
                              className="h-8 px-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => { setSelected(k); setRejectDialog(true); }}
                              variant="ghost"
                              className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {kycList.length === 0 && (
              <div className="p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No KYC submissions found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selected && !rejectDialog} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#F6FF2E]" />
              Verification Review: {selected?.profiles?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-[#0A0C10] p-4 rounded-xl border border-white/5 space-y-3">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Document Type</p>
                  <p className="text-sm text-white capitalize">{selected?.document_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">ID Number</p>
                  <p className="text-sm text-white font-mono">{selected?.id_number}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Current Status</p>
                  <span className={`text-xs capitalize ${selected?.status === 'approved' ? 'text-green-400' : 'text-amber-400'}`}>
                    {selected?.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Submitted Date</p>
                  <p className="text-sm text-white">{selected?.submitted_at && new Date(selected.submitted_at).toLocaleString()}</p>
                </div>
              </div>

              {selected?.status === 'pending' && (
                <div className="space-y-2">
                  <Button onClick={() => handleVerify(selected.id)} className="w-full bg-green-600 hover:bg-green-500">
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Identity
                  </Button>
                  <Button onClick={() => setRejectDialog(true)} variant="ghost" className="w-full text-red-400 hover:bg-red-400/10">
                    <XCircle className="w-4 h-4 mr-2" /> Reject with Reason
                  </Button>
                </div>
              )}

              {selected?.status === 'rejected' && (
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <p className="text-xs text-red-400 font-bold uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-300">{selected.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {signedUrls.front && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" /> ID Front</p>
                      <a href={signedUrls.front} target="_blank" rel="noreferrer" className="block border border-white/10 rounded-xl overflow-hidden hover:border-[#F6FF2E]/50 transition-colors">
                        <img src={signedUrls.front} alt="Front" className="w-full h-40 object-cover" />
                      </a>
                    </div>
                  )}
                  {signedUrls.back && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" /> ID Back</p>
                      <a href={signedUrls.back} target="_blank" rel="noreferrer" className="block border border-white/10 rounded-xl overflow-hidden hover:border-[#F6FF2E]/50 transition-colors">
                        <img src={signedUrls.back} alt="Back" className="w-full h-40 object-cover" />
                      </a>
                    </div>
                  )}
                </div>
                {signedUrls.selfie && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Selfie with ID</p>
                    <a href={signedUrls.selfie} target="_blank" rel="noreferrer" className="block border border-white/10 rounded-xl overflow-hidden hover:border-[#F6FF2E]/50 transition-colors">
                      <img src={signedUrls.selfie} alt="Selfie" className="w-full h-64 object-cover" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="bg-[#14192A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Reject Identity Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Rejection Reason</label>
              <Input 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)} 
                placeholder="e.g., Image is blurry, Expired ID, Name mismatch..." 
                className="bg-[#0A0C10] border-white/10 text-white" 
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setRejectDialog(false)} variant="ghost" className="flex-1">Cancel</Button>
              <Button onClick={handleReject} variant="destructive" className="flex-1">Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
