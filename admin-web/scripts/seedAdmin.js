/**
 * Seed Admin Script
 *
 * Creates a default admin account in the `admins` Firestore collection.
 * Run once with: node scripts/seedAdmin.js
 *
 * Requires: npm install firebase crypto-js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import pkg from 'crypto-js';
const { SHA256 } = pkg;

const firebaseConfig = {
  apiKey: 'AIzaSyAVUvaheCVIWhIQP506vTWTDWZUJd-SAfA',
  authDomain: 'algebrawl-7c3eb.firebaseapp.com',
  projectId: 'algebrawl-7c3eb',
  storageBucket: 'algebrawl-7c3eb.firebasestorage.app',
  messagingSenderId: '575851005324',
  appId: '1:575851005324:web:cd6079d082ae3d903942a9',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ── Default admin account ─────────────────────── */
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'testadmin@email.com',
  password: 'Admin@123',          // change this after first login
};

async function seed() {
  console.log('🔧 Seeding admin account...\n');

  // Check if admin already exists
  const q = query(
    collection(db, 'admins'),
    where('email', '==', DEFAULT_ADMIN.email),
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    console.log(`⚠️  Admin with email "${DEFAULT_ADMIN.email}" already exists. Skipping.`);
    process.exit(0);
  }

  const passwordHash = SHA256(DEFAULT_ADMIN.password).toString();

  const adminDoc = {
    username: DEFAULT_ADMIN.username,
    email: DEFAULT_ADMIN.email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const docRef = doc(collection(db, 'admins'));
  await setDoc(docRef, adminDoc);

  console.log('✅ Default admin created successfully!');
  console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
  console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  console.log(`   Doc ID:   ${docRef.id}`);
  console.log('\n⚠️  Change the default password after your first login!\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
