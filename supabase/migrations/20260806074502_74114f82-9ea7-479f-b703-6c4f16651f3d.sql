ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  project_name text NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  designer text,
  budget text,
  project_value numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'consultation',
  status text NOT NULL DEFAULT 'active',
  start_date date,
  expected_completion date,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  address text NOT NULL,
  visit_at timestamptz NOT NULL,
  designer text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON public.site_visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.projects (project_name, client_name, client_email, client_phone, designer, budget, project_value, stage, status, start_date, expected_completion, progress) VALUES
('Warsan Villa Renovation', 'Ahmed Al Mansoori', 'ahmed@example.ae', '+971501112233', 'Layla Haddad', 'AED 250k - 500k', 380000, 'execution', 'in progress', CURRENT_DATE - 40, CURRENT_DATE + 12, 72),
('Marina Loft Interiors', 'Sara Khan', 'sara@example.ae', '+971502223344', 'Omar Rahal', 'AED 100k - 250k', 195000, '3d visualization', 'awaiting approval', CURRENT_DATE - 18, CURRENT_DATE + 30, 45),
('Textile City Office Fitout', 'Ravi Menon', 'ravi@example.ae', '+971503334455', 'Layla Haddad', 'AED 500k+', 640000, 'concept design', 'active', CURRENT_DATE - 7, CURRENT_DATE + 60, 20),
('Downtown Kitchen Remodel', 'Fatima Noor', 'fatima@example.ae', '+971504445566', 'Yousef Karim', 'AED 50k - 100k', 88000, 'material selection', 'in progress', CURRENT_DATE - 25, CURRENT_DATE + 15, 58),
('JVC Bedroom Suite', 'Daniel Cruz', 'daniel@example.ae', '+971505556677', 'Omar Rahal', 'AED 50k - 100k', 72000, 'consultation', 'active', CURRENT_DATE - 3, CURRENT_DATE + 75, 8),
('Palm Residence Refresh', 'Nadia Aziz', 'nadia@example.ae', '+971506667788', 'Yousef Karim', 'AED 250k - 500k', 310000, 'completed', 'completed', CURRENT_DATE - 150, CURRENT_DATE - 10, 100),
('Business Bay Cafe', 'Hassan Ali', 'hassan@example.ae', '+971507778899', 'Layla Haddad', 'AED 100k - 250k', 210000, 'completed', 'completed', CURRENT_DATE - 200, CURRENT_DATE - 45, 100);

INSERT INTO public.site_visits (project_id, client_name, address, visit_at, designer, status)
SELECT p.id, p.client_name, 'Warsan 1 St, International City, Dubai', now() + interval '1 day' + interval '10 hour', p.designer, 'scheduled' FROM public.projects p WHERE p.project_name = 'Warsan Villa Renovation';

INSERT INTO public.site_visits (project_id, client_name, address, visit_at, designer, status)
SELECT p.id, p.client_name, 'Dubai Marina, Tower 3, Apt 1204', now() + interval '3 day' + interval '4 hour', p.designer, 'scheduled' FROM public.projects p WHERE p.project_name = 'Marina Loft Interiors';

INSERT INTO public.site_visits (project_id, client_name, address, visit_at, designer, status)
SELECT p.id, p.client_name, 'Dubai Textile City, Warehouse 7', now() + interval '5 day' + interval '6 hour', p.designer, 'scheduled' FROM public.projects p WHERE p.project_name = 'Textile City Office Fitout';