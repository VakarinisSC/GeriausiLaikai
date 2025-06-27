// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYGX2gOYYZ3NC2P-rYsfBBDARTyjGpl-s",
  authDomain: "geriausilaikai.firebaseapp.com",
  databaseURL: "https://geriausilaikai-default-rtdb.firebaseio.com",
  projectId: "geriausilaikai",
  storageBucket: "geriausilaikai.appspot.com",
  messagingSenderId: "1090896499765",
  appId: "1:1090896499765:web:9be25fdf8a9b102ed28d7c"
};

// Inicializuojame Firebase programą
const app = initializeApp(firebaseConfig);

// Gauname paslaugų nuorodas
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Eksportuojame, kad būtų galima naudoti kituose failuose
export { db, auth, googleProvider };
