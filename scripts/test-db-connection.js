#!/usr/bin/env node

// A script to test Supabase database connection from the command line
// Run with: node scripts/test-db-connection.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Check environment variables
function checkEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const issues = [];

  if (!url) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  } else if (!url.includes('supabase.co')) {
    issues.push(
      'NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL'
    );
  }

  if (!anonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (anonKey.length < 20) {
    issues.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short to be valid'
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    vars: {
      url: url ? `${url.substring(0, 8)}...` : 'not set',
      anonKey: anonKey ? `${anonKey.substring(0, 5)}...` : 'not set',
    },
  };
}

// Main function
async function main() {
  console.log('🔍 Testing Supabase database connection...\n');

  // Check environment variables
  const envCheck = checkEnvVars();
  console.log('🔑 Environment Variables:');
  console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${envCheck.vars.url}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envCheck.vars.anonKey}`);

  if (!envCheck.isValid) {
    console.error('\n❌ Environment variable issues:');
    envCheck.issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  }

  console.log('\n✅ Environment variables look valid');

  // Test direct HTTP request to Supabase API health
  console.log('\n🔍 Testing Supabase API health...');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Just test /rest/v1/ endpoint without any specific table
    const response = await axios({
      method: 'GET',
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    console.log(
      `API Response Status: ${response.status} ${response.statusText}`
    );
    console.log('\n✅ REST API connection successful!');
  } catch (error) {
    console.error('\n❌ API request error:');

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`  - Status: ${error.response.status}`);
      console.error(
        `  - Response: ${JSON.stringify(error.response.data, null, 2)}`
      );

      // Let's also check if the Supabase host is reachable
      try {
        console.log('\n🔍 Testing basic connectivity to Supabase host...');
        const pingResponse = await axios.head(
          process.env.NEXT_PUBLIC_SUPABASE_URL
        );
        console.log(`Host ping response: ${pingResponse.status}`);
      } catch (pingError) {
        console.error(`  - Host ping error: ${pingError.message}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`  - Request error: ${error.message}`);
      console.error(`  - No response received from server`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`  - Setup error: ${error.message}`);
    }

    process.exit(1);
  }

  // Create Supabase client
  try {
    console.log('\n🔌 Connecting to Supabase via SDK...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test query - try different tables
    console.log('🔍 Testing query on doctors table...');
    const { error: doctorsError, count: doctorsCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    if (doctorsError) {
      console.error('\n❌ Doctors table query failed:');
      console.error(
        `  - Message: ${doctorsError.message || 'No error message provided'}`
      );
      console.error(
        `  - Code: ${doctorsError.code || 'No error code provided'}`
      );
      console.error(
        `  - Details: ${doctorsError.details || 'No error details provided'}`
      );
      console.error(`  - Full error: ${JSON.stringify(doctorsError, null, 2)}`);
    } else {
      console.log(`✅ Doctors table query successful: ${doctorsCount} records`);
    }

    // Try appointments table too
    console.log('\n🔍 Testing query on appointments table...');
    const { error: apptError, count: apptCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (apptError) {
      console.error('\n❌ Appointments table query failed:');
      console.error(
        `  - Message: ${apptError.message || 'No error message provided'}`
      );
      console.error(`  - Code: ${apptError.code || 'No error code provided'}`);
      console.error(
        `  - Details: ${apptError.details || 'No error details provided'}`
      );
      console.error(`  - Full error: ${JSON.stringify(apptError, null, 2)}`);
      process.exit(1);
    } else {
      console.log(
        `✅ Appointments table query successful: ${apptCount} records`
      );
    }

    console.log('\n✅ Database connection successful!');

    // Test auth
    console.log('\n🔍 Testing auth connection...');
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('\n❌ Auth connection failed:');
      console.error(`  - ${authError.message}`);
      process.exit(1);
    }

    const isAuthenticated = !!authData.user;
    console.log(
      `✅ Auth connection successful! ${
        isAuthenticated ? 'User is authenticated' : 'No active user'
      }`
    );

    // Optional: Test RLS
    console.log('\n🔍 Testing RLS policies on tables...');
    const tables = ['doctors', 'appointments', 'medical_records', 'payments'];

    for (const table of tables) {
      const { error: tableError, count: tableCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (tableError) {
        console.log(`  - ${table}: ❌ ${tableError.message}`);
      } else {
        console.log(
          `  - ${table}: ✅ Access granted (${tableCount || 0} rows)`
        );
      }
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n❌ Fatal error:');
    console.error(
      `  - Message: ${error.message || 'No error message provided'}`
    );
    console.error(`  - Full error: ${JSON.stringify(error, null, 2)}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
