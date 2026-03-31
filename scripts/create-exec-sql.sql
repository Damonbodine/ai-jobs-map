CREATE OR REPLACE FUNCTION exec_sql(query text, params text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  result jsonb;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t'
    INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$fn$;
