import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function listDoctorLicenses() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(
        'id, license_number, specialty, profile:profiles(first_name, last_name, is_approved, is_rejected)'
      );

    if (error) {
      console.error('Error fetching doctors:', error);
      return;
    }

    console.log('Found', data.length, 'doctor records');

    // Count by status
    const pending = data.filter(
      (d) => !d.profile?.is_approved && !d.profile?.is_rejected
    );
    const approved = data.filter((d) => d.profile?.is_approved);
    const rejected = data.filter((d) => d.profile?.is_rejected);

    console.log(
      `Status summary: ${pending.length} pending, ${approved.length} approved, ${rejected.length} rejected\n`
    );

    console.log('License numbers in use:');
    data.forEach((doc) => {
      let status = 'Unknown';
      if (doc.profile?.is_approved) status = 'Approved';
      else if (doc.profile?.is_rejected) status = 'Rejected';
      else status = 'Pending';

      console.log(
        `- ${doc.license_number} (${doc.profile?.first_name || 'Unknown'} ${doc.profile?.last_name || 'Doctor'}) - ${status}`
      );
    });

    // Check for a specific license number
    await checkLicenseNumber(supabase, '123456');
    await checkLicenseNumber(supabase, 'PENDING');
    await checkLicenseNumber(supabase, '42151251');
  } catch (err) {
    console.error('Exception:', err);
  }
}

async function checkLicenseNumber(supabase, licenseNumber) {
  console.log(`\nChecking if license number "${licenseNumber}" exists...`);

  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, license_number, profile:profiles(first_name, last_name)')
      .eq('license_number', licenseNumber);

    if (error) {
      console.error('Error checking license number:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(
        `License number "${licenseNumber}" EXISTS and is used by:`,
        data
          .map(
            (d) =>
              `${d.profile?.first_name || 'Unknown'} ${d.profile?.last_name || 'Doctor'}`
          )
          .join(', ')
      );
    } else {
      console.log(`License number "${licenseNumber}" is AVAILABLE for use.`);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

listDoctorLicenses();
