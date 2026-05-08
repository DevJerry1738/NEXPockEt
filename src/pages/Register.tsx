import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Zap, Mail, Lock, User, Eye, EyeOff, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { 
      toast.error('Password must be at least 6 characters'); 
      return; 
    }
    setLoading(true);
    try {
      await register({ name, email, password, referral_code: referral || undefined });
      setShowSuccessModal(true);
      // Auto-redirect after 5 seconds
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessModal) {
    return (
      <>
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center space-y-6 bg-[#14192A] rounded-2xl p-8 border border-white/5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F6FF2E]/10">
                <CheckCircle2 className="w-8 h-8 text-[#F6FF2E]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Account Created!</h2>
                <p className="text-gray-400 mt-2">Welcome to NEXPockEt</p>
              </div>
              <div className="bg-[#0A0C10] rounded-lg p-4 text-left border border-white/10">
                <p className="text-xs text-gray-400 mb-2">Save your referral code to share with others:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-[#F6FF2E]">Your referral code will appear in your profile</code>
                  <button className="text-gray-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400">Redirecting to login in 5 seconds...</p>
              <Button onClick={() => navigate('/login')} className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold h-11">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F6FF2E]/10 mb-4">
              <Zap className="w-8 h-8 text-[#F6FF2E]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Get Started</h1>
            <p className="text-gray-400 mt-1">Create your NEXPockEt account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-[#14192A] rounded-2xl p-6 border border-white/5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" className="pl-10 bg-[#0A0C10] border-white/10 text-white placeholder:text-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="pl-10 bg-[#0A0C10] border-white/10 text-white placeholder:text-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className="pl-10 pr-10 bg-[#0A0C10] border-white/10 text-white placeholder:text-gray-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Referral Code (optional)</label>
              <Input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())}
                placeholder="REF1234567890" className="bg-[#0A0C10] border-white/10 text-white placeholder:text-gray-600" />
              <p className="text-xs text-gray-500 mt-1">Get a referral code from someone already on NEXPockEt</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold h-11">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Already have an account? <Link to="/login" className="text-[#F6FF2E] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <p className="text-center text-gray-400 mt-2 text-xs">
        <a href="https://thenexpocket.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F6FF2E]">Back to Homepage</a>
      </p>
    </>
  );
}
