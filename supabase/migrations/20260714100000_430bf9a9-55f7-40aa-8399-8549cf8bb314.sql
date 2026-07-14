
CREATE OR REPLACE FUNCTION public.prevent_client_privileged_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypasses trigger checks; only guard against authenticated clients
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Preserve privileged fields on client-initiated updates
  NEW.assigned_designer := OLD.assigned_designer;
  NEW.payment_status := OLD.payment_status;
  NEW.deposit_amount := OLD.deposit_amount;
  NEW.stripe_session_id := OLD.stripe_session_id;
  NEW.confirmation_email_sent_at := OLD.confirmation_email_sent_at;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consultations_prevent_privileged_updates ON public.consultations;
CREATE TRIGGER consultations_prevent_privileged_updates
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_privileged_updates();
