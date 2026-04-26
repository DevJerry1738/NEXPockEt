import { useEffect, useState } from 'react';
import { kycApi, storageApi } from '@/api/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle, Clock, XCircle, FileText, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UserKyc() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<any>(null);
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState('');
  
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    front: null,
    back: null,
    selfie: null
  });
  const [previews, setPreviews] = useState<{ [key: string]: string }>({
    front: '',
    back: '',
    selfie: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchKyc = async () => {
    try {
      const res = await kycApi.my();
      setKyc(res.kyc);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchKyc(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large (max 5MB)');
        return;
      }
      setFiles(prev => ({ ...prev, [side]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [side]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!idNumber.trim()) { toast.error('ID number is required'); return; }
    if (!files.front || !files.selfie) { toast.error('Front image and selfie are required'); return; }
    if (idType !== 'passport' && !files.back) { toast.error('Back image is required'); return; }

    setSubmitting(true);
    try {
      // 1. Upload images
      const uploadResults = await Promise.all([
        storageApi.uploadKyc(files.front, user!.id, 'front'),
        files.back ? storageApi.uploadKyc(files.back, user!.id, 'back') : Promise.resolve({ success: true, path: '', message: '' }),
        storageApi.uploadKyc(files.selfie, user!.id, 'selfie')
      ]);

      const failed = uploadResults.find(r => !r.success);
      if (failed) throw new Error((failed as any).message || 'Upload failed');

      // 2. Submit KYC data
      const res = await kycApi.submit({
        document_type: idType,
        id_number: idNumber,
        front_image_url: uploadResults[0].path,
        back_image_url: uploadResults[1].path,
        selfie_image_url: uploadResults[2].path,
      });

      if (res.success) {
        toast.success('KYC submitted for review');
        setKyc(res.kyc);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const FileUpload = ({ label, side, icon: Icon, required }: { label: string; side: string; icon: any; required?: boolean }) => (
    <div className="space-y-2">
      <label className="block text-sm text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, side)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`
          h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all
          ${previews[side] ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-[#0A0C10] group-hover:border-[#F6FF2E]/50 group-hover:bg-[#F6FF2E]/5'}
        `}>
          {previews[side] ? (
            <img src={previews[side]} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
          ) : (
            <>
              <Icon className="w-8 h-8 text-gray-500 mb-2 group-hover:text-[#F6FF2E]" />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">Click to upload</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-gray-400 text-sm mt-1">Verify your identity to unlock withdrawals</p>
      </div>

      {(kyc?.status === 'verified' || kyc?.status === 'approved') && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <div>
            <h3 className="font-semibold text-green-400">Identity Verified</h3>
            <p className="text-sm text-green-300/70">Your identity has been verified. You can now request withdrawals.</p>
          </div>
        </div>
      )}

      {kyc?.status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex items-center gap-4">
          <Clock className="w-10 h-10 text-amber-400" />
          <div>
            <h3 className="font-semibold text-amber-400">Verification Pending</h3>
            <p className="text-sm text-amber-300/70">Your KYC is under review. Please wait for admin approval.</p>
          </div>
        </div>
      )}

      {kyc?.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-3">
            <XCircle className="w-10 h-10 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Verification Rejected</h3>
              <p className="text-sm text-red-300/70 font-medium">Reason: {kyc.rejection_reason || 'Please resubmit with correct documents.'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setKyc(null)} className="text-sm border-red-500/50 text-red-400 hover:bg-red-500/10">
            Resubmit Documents
          </Button>
        </div>
      )}

      {(!kyc) && (
        <div className="bg-[#14192A] rounded-xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Identity Documents</h3>
              <p className="text-xs text-gray-400">Please provide clear images of your legal ID</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">ID Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full h-10 rounded-md bg-[#0A0C10] border border-white/10 text-white px-3 text-sm focus:border-[#F6FF2E]/50 outline-none">
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">ID Number</label>
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter ID number" className="bg-[#0A0C10] border-white/10 text-white focus:border-[#F6FF2E]/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload label="ID Front" side="front" icon={ImageIcon} required />
            {idType !== 'passport' && (
              <FileUpload label="ID Back" side="back" icon={ImageIcon} required />
            )}
            <FileUpload label="Selfie with ID" side="selfie" icon={Camera} required />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] h-12 font-bold text-lg">
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0A0C10]" />
                Uploading & Submitting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Submit Verification
              </div>
            )}
          </Button>
          <p className="text-[10px] text-gray-500 text-center">
            By submitting, you agree to our terms of service and identity verification policies.
            Data is stored securely using industry-standard encryption.
          </p>
        </div>
      )}
    </div>
  );
}
