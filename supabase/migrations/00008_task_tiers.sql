-- 1. Add tier_level to plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 1;

-- 2. Update existing plans with appropriate tier levels based on name
UPDATE public.plans SET tier_level = 1 WHERE name ILIKE '%Starter%';
UPDATE public.plans SET tier_level = 2 WHERE name ILIKE '%Basic%';
UPDATE public.plans SET tier_level = 3 WHERE name ILIKE '%Premium%';
UPDATE public.plans SET tier_level = 4 WHERE name ILIKE '%Elite%';

-- 3. Add min_tier to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS min_tier INTEGER DEFAULT 1;

-- 4. Clear old demo tasks and insert professional seed data
TRUNCATE public.tasks CASCADE;

-- Note: The `reward` column is technically still in the schema, 
-- but our Edge Function calculates it dynamically based on the plan.
-- We will insert '0.00' for reward to reflect this, as the actual payout is dynamic.

INSERT INTO public.tasks (title, description, reward, platform, status, is_bonus, min_tier) VALUES
-- TIER 1 Tasks (Starter)
('Like a Facebook Post', 'Navigate to our sponsor page and like the latest post.', 0.00, 'Facebook', 'active', false, 1),
('Follow on Twitter/X', 'Follow the designated partner account on X to stay updated.', 0.00, 'Twitter', 'active', false, 1),
('Watch Promotional Video', 'Watch a 30-second promotional video on YouTube.', 0.00, 'YouTube', 'active', false, 1),
('Retweet Campaign', 'Retweet the pinned post from our marketing partner.', 0.00, 'Twitter', 'active', false, 1),
('Like an Instagram Reel', 'Like and save the sponsored Instagram Reel.', 0.00, 'Instagram', 'active', false, 1),

-- TIER 2 Tasks (Basic)
('Share LinkedIn Update', 'Share our partner''s latest industry update on your LinkedIn feed.', 0.00, 'LinkedIn', 'active', false, 2),
('Google Maps Review', 'Leave a positive 5-star rating for the local business partner.', 0.00, 'Google', 'active', false, 2),
('Join Telegram Community', 'Join the official Telegram group and say hello.', 0.00, 'Telegram', 'active', false, 2),
('App Download & Open', 'Download the partner app from the App Store and open it once.', 0.00, 'App Store', 'active', false, 2),
('Subscribe to Podcast', 'Subscribe to the weekly tech podcast on Spotify.', 0.00, 'Spotify', 'active', false, 2),

-- TIER 3 Tasks (Premium)
('TrustPilot Review', 'Write a thoughtful 2-sentence review on TrustPilot for our client.', 0.00, 'TrustPilot', 'active', false, 3),
('Market Research Survey', 'Complete a 5-minute survey about your online shopping habits.', 0.00, 'Survey', 'active', false, 3),
('Newsletter Signup', 'Sign up for the premium financial newsletter using your email.', 0.00, 'Web', 'active', false, 3),
('Beta Website Testing', 'Navigate through the new beta website and click on 3 different pages.', 0.00, 'Web', 'active', false, 3),
('Product Feedback', 'Provide written feedback on the new software UI mockup.', 0.00, 'Survey', 'active', false, 3),

-- TIER 4 Tasks (Elite)
('Video Testimonial', 'Record a short 15-second video sharing your experience with the platform.', 0.00, 'Video', 'active', false, 4),
('Software Installation', 'Install the desktop client and complete the onboarding tutorial.', 0.00, 'Desktop', 'active', false, 4),
('Detailed Financial Survey', 'Complete a comprehensive 10-minute survey regarding investment strategies.', 0.00, 'Survey', 'active', false, 4),
('Focus Group Registration', 'Register your details for an upcoming 10-minute focus group call.', 0.00, 'Web', 'active', false, 4),
('Premium App Review', 'Download the premium app and write a detailed 50-word review.', 0.00, 'App Store', 'active', false, 4);
