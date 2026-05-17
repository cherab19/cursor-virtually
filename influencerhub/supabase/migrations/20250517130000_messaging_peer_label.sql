-- Safe display names for messaging partners (only when a thread exists).

CREATE OR REPLACE FUNCTION public.messaging_peer_label(peer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.full_name, 'Member')
  FROM public.profiles p
  WHERE p.user_id = peer_id
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE (
          (m.sender_id = auth.uid() AND m.recipient_id = peer_id)
          OR (m.sender_id = peer_id AND m.recipient_id = auth.uid())
        )
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.messaging_peer_label(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.messaging_peer_label(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_peer_label(uuid) TO service_role;
