-- Run once in Supabase Dashboard -> SQL Editor. Safe to rerun.
-- If you previously created public.subscribers, it is reused.
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Per-IP, per-hour counters use a one-way hash, not raw IP addresses.
CREATE TABLE IF NOT EXISTS public.signup_rate_limits (
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_start)
);
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Call this only from the Vercel server, using a Supabase secret key.
-- Atomic upsert prevents bypassing the signup limit with parallel requests.
CREATE OR REPLACE FUNCTION public.signup_to_waitlist(p_email text, p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count integer;
BEGIN
  IF p_email IS NULL OR length(p_email) > 254 OR length(p_email) < 3
     OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_signup_input';
  END IF;

  INSERT INTO public.signup_rate_limits (ip_hash, window_start, attempt_count)
  VALUES (p_ip_hash, date_trunc('hour', now()), 1)
  ON CONFLICT (ip_hash, window_start)
  DO UPDATE SET attempt_count = public.signup_rate_limits.attempt_count + 1
  RETURNING attempt_count INTO current_count;

  IF current_count > 10 THEN
    RETURN false;
  END IF;

  INSERT INTO public.subscribers (email)
  VALUES (lower(trim(p_email)))
  ON CONFLICT (email) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_to_waitlist(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.signup_to_waitlist(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.signup_to_waitlist(text, text) TO service_role;

-- Optional cleanup: periodically delete old counters using a scheduled task.
-- DELETE FROM public.signup_rate_limits WHERE window_start < now() - interval '7 days';
