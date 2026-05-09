// services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAVUvaheCVIWhIQP506vTWTDWZUJd-SAfA',
  authDomain: 'algebrawl-7c3eb.firebaseapp.com',
  projectId: 'algebrawl-7c3eb',
  storageBucket: 'algebrawl-7c3eb.firebasestorage.app',
  messagingSenderId: '575851005324',
  appId: '1:575851005324:web:cd6079d082ae3d903942a9',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, auth, db };
