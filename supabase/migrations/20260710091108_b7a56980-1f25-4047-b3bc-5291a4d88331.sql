
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE DEFAULT ('SPC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  project_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  consultation_datetime TIMESTAMPTZ NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  property_location TEXT NOT NULL,
  project_budget TEXT NOT NULL,
  project_description TEXT,
  inspiration_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.consultations TO anon, authenticated;
GRANT ALL ON public.consultations TO service_role;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a consultation request
CREATE POLICY "Anyone can submit a consultation"
ON public.consultations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND length(client_name) BETWEEN 1 AND 120
  AND length(client_phone) BETWEEN 5 AND 30
  AND length(client_email) BETWEEN 5 AND 160
  AND length(property_location) BETWEEN 1 AND 200
  AND length(project_type) BETWEEN 1 AND 60
  AND length(service_type) BETWEEN 1 AND 60
  AND length(project_budget) BETWEEN 1 AND 60
  AND (project_description IS NULL OR length(project_description) <= 2000)
);

CREATE INDEX consultations_created_at_idx ON public.consultations (created_at DESC);
