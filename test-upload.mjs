import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Buffer } from 'buffer';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testUpload() {
  console.log("Starting upload test to bucket:", firebaseConfig.storageBucket);
  const buffer = Buffer.from('test image content', 'utf8');
  const path = `tests/test_${Date.now()}.txt`;
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, buffer, {
    contentType: 'text/plain',
  });

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
    },
    (error) => {
      console.error('Upload failed:', error);
      process.exit(1);
    },
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('Upload success! URL:', url);
      process.exit(0);
    }
  );
}

testUpload();
