ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS deposit_currency TEXT NOT NULL DEFAULT 'aed';

CREATE INDEX IF NOT EXISTS consultations_stripe_session_id_idx
  ON public.consultations (stripe_session_id);