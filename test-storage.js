import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const testRef = ref(storage, 'test.txt');

uploadString(testRef, 'hello world').then(() => {
  console.log('Storage upload success');
}).catch((err) => {
  console.error('Storage upload failed:', err);
});
