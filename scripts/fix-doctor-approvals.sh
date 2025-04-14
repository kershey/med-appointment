#!/bin/bash

# Script to fix doctor approval issues in MedClinic database
# This script will run the necessary SQL migrations to fix inconsistencies

# Display header
echo "===================================="
echo "MedClinic - Fix Doctor Approvals"
echo "===================================="
echo ""

# Check if SUPABASE_URL and SUPABASE_SERVICE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set."
    echo "These can be found in your Supabase project dashboard."
    echo ""
    echo "Example usage:"
    echo "  SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co SUPABASE_SERVICE_KEY=eyxxxxxxxxxxxxxxxx ./fix-doctor-approvals.sh"
    exit 1
fi

echo "Applying database schema updates..."

# Add the approval fields if they don't exist
echo "1. Adding approval fields to profiles table if missing..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false; ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;"
  }'

echo -e "\n2. Creating approval status management trigger..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE OR REPLACE FUNCTION ensure_single_approval_status() RETURNS TRIGGER AS $$ BEGIN IF NEW.is_approved = true AND NEW.is_rejected = true THEN RAISE EXCEPTION '"'"'A doctor cannot be both approved and rejected'"'"'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql; DROP TRIGGER IF EXISTS check_approval_status ON profiles; CREATE TRIGGER check_approval_status BEFORE UPDATE ON profiles FOR EACH ROW WHEN (NEW.role = '"'"'doctor'"'"') EXECUTE FUNCTION ensure_single_approval_status();"
  }'

echo -e "\n3. Creating fix_doctor_approvals function..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE OR REPLACE FUNCTION fix_doctor_approvals() RETURNS INTEGER AS $$ DECLARE fixed_count INTEGER := 0; BEGIN UPDATE profiles SET is_approved = COALESCE(is_approved, false), is_rejected = COALESCE(is_rejected, false) WHERE role = '"'"'doctor'"'"' AND (is_approved IS NULL OR is_rejected IS NULL); GET DIAGNOSTICS fixed_count = ROW_COUNT; UPDATE profiles SET is_rejected = false WHERE role = '"'"'doctor'"'"' AND is_approved = true AND is_rejected = true; UPDATE profiles SET is_approved = true, is_rejected = false WHERE role = '"'"'doctor'"'"' AND is_approved = false AND id IN (SELECT DISTINCT doctor_id FROM appointments); RETURN fixed_count; END; $$ LANGUAGE plpgsql SECURITY DEFINER;"
  }'

echo -e "\n4. Running fix_doctor_approvals function..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/fix_doctor_approvals" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\nDoctor approval database fixes complete!"
echo "You can now access the Fix Doctor Approvals page at /admin/fix-doctor-approvals to verify the fixes."
echo "====================================" 