
// TikTok Lite - MVP Web Application
// Tech Stack: React (Vite) + Tailwind CSS + Firebase (Auth, Firestore, Storage)
// This is a simplified example; backend integration with Firebase and media handling included

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAL9CGWlJZrjnddJ2NiCJDN_HVkIFadIOQ",
  authDomain: "tiktok-lite-7c168.firebaseapp.com",
  projectId: "tiktok-lite-7c168",
  storageBucket: "tiktok-lite-7c168.firebasestorage.app",
  messagingSenderId: "880776831160",
  appId: "1:880776831160:web:cc3e3f139ad4ba64e4144d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export default function App() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
    const q = query(collection(db, 'videos'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const loginWithProvider = (provider) => signInWithPopup(auth, provider);
  const loginWithEmail = () => signInWithEmailAndPassword(auth, email, password).catch(console.error);
  const registerWithEmail = () => createUserWithEmailAndPassword(auth, email, password).catch(console.error);
  const logout = () => signOut(auth);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `videos/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', null, console.error, async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db, 'videos'), {
        url,
        username: user.displayName || email,
        uid: user.uid,
        avatar: user.photoURL || '',
        timestamp: Date.now()
      });
      setUploading(false);
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex justify-between p-4">
        <h1 className="text-xl font-bold">TikTok Lite</h1>
        {user ? (
          <div className="flex items-center gap-4">
            {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />}
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-x-2">
              <button onClick={() => loginWithProvider(new GoogleAuthProvider())}>Login with Google</button>
              <button onClick={() => loginWithProvider(new FacebookAuthProvider())}>Login with Facebook</button>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="p-2 text-black rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="p-2 text-black rounded"
              />
              <button onClick={loginWithEmail} className="bg-blue-600 p-2 rounded">Login with Email</button>
              <button onClick={registerWithEmail} className="bg-green-600 p-2 rounded">Register</button>
            </div>
          </div>
        )}
      </header>

      {user && (
        <div className="p-4">
          <input type="file" accept="video/*" onChange={handleUpload} className="mb-4" />
          {uploading && <p>Uploading...</p>}
        </div>
      )}

      <main className="space-y-4 p-4">
        {videos.map(video => (
          <div key={video.id} className="bg-gray-900 p-2 rounded-md">
            <video controls src={video.url} className="w-full rounded-lg" />
            <div className="flex items-center mt-2">
              {video.avatar && <img src={video.avatar} alt="avatar" className="w-6 h-6 rounded-full mr-2" />}
              <p className="font-semibold">{video.username}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
