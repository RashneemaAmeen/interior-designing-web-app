CREATE OR REPLACE FUNCTION public.prevent_client_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.assigned_designer := OLD.assigned_designer;
  NEW.payment_status := OLD.payment_status;
  NEW.deposit_amount := OLD.deposit_amount;
  NEW.deposit_currency := OLD.deposit_currency;
  NEW.stripe_session_id := OLD.stripe_session_id;
  NEW.confirmation_email_sent_at := OLD.confirmation_email_sent_at;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$function$;