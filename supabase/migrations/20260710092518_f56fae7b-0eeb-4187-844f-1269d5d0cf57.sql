
-- Add user_id + assigned_designer to consultations
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_designer text;

CREATE INDEX IF NOT EXISTS consultations_user_id_idx ON public.consultations(user_id);

-- Allow authenticated users to link their new bookings to themselves
DROP POLICY IF EXISTS "Anyone can submit a consultation" ON public.consultations;

CREATE POLICY "Anonymous can submit a consultation"
  ON public.consultations
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND status = 'pending'
    AND length(client_name) BETWEEN 1 AND 120
    AND length(client_phone) BETWEEN 5 AND 30
    AND length(client_email) BETWEEN 5 AND 160
    AND length(property_location) BETWEEN 1 AND 200
    AND length(project_type) BETWEEN 1 AND 60
    AND length(service_type) BETWEEN 1 AND 60
    AND length(project_budget) BETWEEN 1 AND 60
    AND (project_description IS NULL OR length(project_description) <= 2000)
  );

CREATE POLICY "Authenticated can submit their own consultation"
  ON public.consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND length(client_name) BETWEEN 1 AND 120
    AND length(client_phone) BETWEEN 5 AND 30
    AND length(client_email) BETWEEN 5 AND 160
    AND length(property_location) BETWEEN 1 AND 200
    AND length(project_type) BETWEEN 1 AND 60
    AND length(service_type) BETWEEN 1 AND 60
    AND length(project_budget) BETWEEN 1 AND 60
    AND (project_description IS NULL OR length(project_description) <= 2000)
  );

CREATE POLICY "Clients read their own consultations"
  ON public.consultations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients update their own consultations"
  ON public.consultations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('pending', 'confirmed', 'cancelled', 'completed')
  );

-- Messages table
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'designer')),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultation_messages_consultation_idx
  ON public.consultation_messages(consultation_id, created_at);

GRANT SELECT, INSERT ON public.consultation_messages TO authenticated;
GRANT ALL ON public.consultation_messages TO service_role;

ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients read messages on their consultations"
  ON public.consultation_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_messages.consultation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients send messages on their consultations"
  ON public.consultation_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'client'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_messages.consultation_id
        AND c.user_id = auth.uid()
    )
  );
