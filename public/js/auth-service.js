// auth-service.js
import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const uploadForm = document.getElementById("upload-form");

// Prisijungimo funkcija
const handleLogin = () => signInWithPopup(auth, googleProvider);

// Atsijungimo funkcija
const handleLogout = () => signOut(auth);

// Autentifikacijos būsenos stebėjimas
const setupAuthObserver = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline";
      uploadForm.style.display = "block";
      userInfo.textContent = `Prisijungęs kaip: ${user.displayName}`;
    } else {
      loginBtn.style.display = "inline";
      logoutBtn.style.display = "none";
      uploadForm.style.display = "none";
      userInfo.textContent = "";
    }
  });
};

// Eksportuojame funkcijas ir nustatome įvykių klausytojus
export const initAuth = () => {
  loginBtn.onclick = handleLogin;
  logoutBtn.onclick = handleLogout;
  setupAuthObserver();
};

// Taip pat galime eksportuoti 'auth' objektą, jei jį prireiks kitur (pvz. formos apdorojimui)
export { auth };
