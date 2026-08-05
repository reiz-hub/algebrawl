/**
 * Seed Admin Script
 *
 * Creates a default admin account in the `admins` Supabase table.
 * Run once with: node scripts/seedAdmin.js
 *
 * Requires: npm install @supabase/supabase-js crypto-js
 */
import { createClient } from '@supabase/supabase-js';
import pkg from 'crypto-js';
const { SHA256 } = pkg;

const supabaseUrl = 'https://bhjkpepmrklicrkqparx.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoamtwZXBtcmtsaWNya3FwYXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkzNTM3OCwiZXhwIjoyMTAxNTExMzc4fQ.4By3cQveLZZNmUrk66VNcnA5x_wun4JN5y5xdiQdPFE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/* ── Default admin account ─────────────────────── */
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'testadmin@email.com',
  password: 'Admin@123',          // change this after first login
};

async function seed() {
  console.log('🔧 Seeding admin account...\n');

  // Check if admin already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', DEFAULT_ADMIN.email)
    .limit(1)
    .single();

  if (existing) {
    console.log(`⚠️  Admin with email "${DEFAULT_ADMIN.email}" already exists. Skipping.`);
    process.exit(0);
  }

  const passwordHash = SHA256(DEFAULT_ADMIN.password).toString();

  const { data, error } = await supabase
    .from('admins')
    .insert({
      username: DEFAULT_ADMIN.username,
      email: DEFAULT_ADMIN.email,
      password_hash: passwordHash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log('✅ Default admin created successfully!');
  console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
  console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  console.log(`   Doc ID:   ${data.id}`);
  console.log('\n⚠️  Change the default password after your first login!\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
