import { useEffect, useState } from 'react';
import { settingsApi, adminApi } from '@/api/api';
import { toast } from 'sonner';
import { Settings, Send, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [tab, setTab] = useState('general');

  const fetchSettings = async () => {
    try { const res = await settingsApi.get(); setSettings(res.settings || {}); }
    catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        site_name: settings.site_name, currency: settings.currency,
        min_deposit: settings.min_deposit, max_deposit: settings.max_deposit,
        min_withdrawal: settings.min_withdrawal, max_withdrawal: settings.max_withdrawal,
        withdrawal_fee_percent: settings.withdrawal_fee_percent,
        referral_bonus: settings.referral_bonus, referral_commission_percent: settings.referral_commission_percent,
        email_notifications: settings.email_notifications, withdrawals_enabled: settings.withdrawals_enabled,
        registration_enabled: settings.registration_enabled, maintenance_mode: settings.maintenance_mode,
        smtp_host: settings.smtp_host, smtp_port: settings.smtp_port, smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass, smtp_encryption: settings.smtp_encryption,
        smtp_from: settings.smtp_from, smtp_from_name: settings.smtp_from_name,
      };
      await settingsApi.update(data);
      toast.success('Settings saved');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleTestSMTP = async () => {
    if (!testEmail) { toast.error('Enter test email'); return; }
    try { await settingsApi.testSMTP(testEmail); toast.success('Test email sent'); }
    catch (err: any) { toast.error(err.message); }
  };

  const toggleGlobalWithdrawal = async () => {
    try {
      const newVal = !(settings.withdrawals_enabled ?? true);
      await adminApi.toggleGlobalWithdrawal(newVal);
      updateField('withdrawals_enabled', newVal ? 1 : 0);
      toast.success(`Global withdrawal ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const SwitchField = ({ label, field }: { label: string; field: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-gray-300">{label}</span>
      <button onClick={() => updateField(field, settings[field] ? 0 : 1)}>
        {settings[field] ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
      </button>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Platform Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure system-wide settings</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#14192A]">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]">General</TabsTrigger>
          <TabsTrigger value="smtp" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]">SMTP Email</TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]">Limits</TabsTrigger>
          <TabsTrigger value="toggles" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]">Toggles</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 bg-[#14192A] rounded-xl p-6 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400 mb-1 block">Site Name</label><Input value={settings.site_name || ''} onChange={(e) => updateField('site_name', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">Currency</label><Input value={settings.currency || ''} onChange={(e) => updateField('currency', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">Support Email</label><Input value={settings.support_email || ''} onChange={(e) => updateField('support_email', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">Referral Bonus ($)</label><Input type="number" value={settings.referral_bonus || ''} onChange={(e) => updateField('referral_bonus', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
          </div>
        </TabsContent>

        <TabsContent value="smtp" className="space-y-4 bg-[#14192A] rounded-xl p-6 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-400 mb-1 block">SMTP Host</label><Input value={settings.smtp_host || ''} onChange={(e) => updateField('smtp_host', e.target.value)} placeholder="smtp.gmail.com" className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">SMTP Port</label><Input type="number" value={settings.smtp_port || ''} onChange={(e) => updateField('smtp_port', e.target.value)} placeholder="587" className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">SMTP Username</label><Input value={settings.smtp_user || ''} onChange={(e) => updateField('smtp_user', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">SMTP Password</label><Input type="password" value={settings.smtp_pass || ''} onChange={(e) => updateField('smtp_pass', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">Encryption</label>
              <select value={settings.smtp_encryption || 'tls'} onChange={(e) => updateField('smtp_encryption', e.target.value)} className="w-full h-10 rounded-md bg-[#0A0C10] border border-white/10 text-white px-3 text-sm">
                <option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option>
              </select>
            </div>
            <div><label className="text-sm text-gray-400 mb-1 block">From Email</label><Input value={settings.smtp_from || ''} onChange={(e) => updateField('smtp_from', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
            <div><label className="text-sm text-gray-400 mb-1 block">From Name</label><Input value={settings.smtp_from_name || ''} onChange={(e) => updateField('smtp_from_name', e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" /></div>
          </div>
          <div className="pt-4 border-t border-white/5 flex gap-3">
            <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Test email address" className="bg-[#0A0C10] border-white/10 text-white flex-1" />
            <Button onClick={handleTestSMTP} variant="outline" className="border-[#F6FF2E]/30 text-[#F6FF2E] hover:bg-[#F6FF2E]/10"><Send className="w-4 h-4 mr-1" /> Test</Button>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 bg-[#14192A] rounded-xl p-6 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Min Deposit', field: 'min_deposit' }, { label: 'Max Deposit', field: 'max_deposit' },
              { label: 'Min Withdrawal', field: 'min_withdrawal' }, { label: 'Max Withdrawal', field: 'max_withdrawal' },
              { label: 'Withdrawal Fee %', field: 'withdrawal_fee_percent' }, { label: 'Referral Commission %', field: 'referral_commission_percent' },
            ].map((item) => (
              <div key={item.field}>
                <label className="text-sm text-gray-400 mb-1 block">{item.label}</label>
                <Input type="number" value={settings[item.field] || ''} onChange={(e) => updateField(item.field, e.target.value)} className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="toggles" className="bg-[#14192A] rounded-xl p-6 border border-white/5">
          <SwitchField label="Email Notifications" field="email_notifications" />
          <SwitchField label="Registration Enabled" field="registration_enabled" />
          <SwitchField label="Maintenance Mode" field="maintenance_mode" />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-300">Global Withdrawals</span>
            <button onClick={toggleGlobalWithdrawal}>
              {settings.withdrawals_enabled ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-red-400" />}
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
