
DROP POLICY IF EXISTS "Clients update their own consultations" ON public.consultations;

CREATE POLICY "Clients update their own consultations"
  ON public.consultations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('pending', 'cancelled')
  );

CREATE OR REPLACE FUNCTION public.prevent_client_admin_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypasses this trigger via session_user check
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.assigned_designer IS DISTINCT FROM OLD.assigned_designer THEN
    RAISE EXCEPTION 'Clients cannot modify assigned_designer';
  END IF;

  IF NEW.reference_number IS DISTINCT FROM OLD.reference_number THEN
    RAISE EXCEPTION 'Clients cannot modify reference_number';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Clients cannot reassign user_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_client_admin_field_changes_trg ON public.consultations;
CREATE TRIGGER prevent_client_admin_field_changes_trg
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_admin_field_changes();
