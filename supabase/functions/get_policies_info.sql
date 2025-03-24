-- Create a function to get RLS policy information
CREATE OR REPLACE FUNCTION get_policies_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'table_name', t.tablename,
    'policies', (
      SELECT json_agg(json_build_object(
        'policy_name', p.policyname,
        'roles', p.roles,
        'cmd', p.cmd,
        'using_expr', p.using_expr,
        'with_check_expr', p.with_check_expr
      ))
      FROM pg_policies p
      WHERE p.tablename = t.tablename
    )
  ))
  INTO result
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
  AND t.tablename IN ('profiles', 'doctors', 'appointments');
  
  RETURN result;
END;
$$; 