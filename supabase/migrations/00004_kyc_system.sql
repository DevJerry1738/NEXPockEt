-- KYC Storage Policies
-- Run this in your Supabase SQL Editor

-- 1. Upgrade kyc_documents table
ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS selfie_image_url TEXT;

-- 3. Trigger to update profile kyc_status when document is reviewed
CREATE OR REPLACE FUNCTION public.handle_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles SET kyc_status = 'verified' WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles SET kyc_status = 'rejected' WHERE id = NEW.user_id;
  ELSIF NEW.status = 'pending' THEN
    UPDATE public.profiles SET kyc_status = 'pending' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_kyc_status_change ON public.kyc_documents;
CREATE TRIGGER on_kyc_status_change
  AFTER INSERT OR UPDATE OF status ON public.kyc_documents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_kyc_status_change();

-- 4. Storage RLS for kyc bucket

-- Users can upload their own KYC files
CREATE POLICY "Users can upload own kyc"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own KYC files
CREATE POLICY "Users can view own kyc"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all KYC files
CREATE POLICY "Admins can view all kyc"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc' AND public.get_my_role() = 'admin');
