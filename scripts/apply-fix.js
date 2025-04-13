import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize dotenv for environment variables
dotenv.config();

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.'
  );
  console.error('Make sure these are set in your environment or .env file.');
  process.exit(1);
}

async function applyMigration() {
  try {
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Connected to Supabase, applying migration...');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20240713_fix_profile_policies.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration as a single SQL query
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSql,
    });

    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('Migration successfully applied.');
    console.log('The infinite recursion in profile policies has been fixed.');
    console.log('Please restart your application and try logging in again.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
