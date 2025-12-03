import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyC0YvRR3-gYaoAJrIJOkcRH1AEZYnn5Txw",
    authDomain: "wksdf-fd1a1.firebaseapp.com",
    databaseURL: "https://wksdf-fd1a1-default-rtdb.firebaseio.com",
    projectId: "wksdf-fd1a1",
    storageBucket: "wksdf-fd1a1.firebasestorage.app",
    messagingSenderId: "225434989192",
    appId: "1:225434989192:web:6d70f9ca5a96f4e47ba53d",
    measurementId: "G-KC15KLGPQQ"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
