// public/js/result-form-handler.js
import { db } from './firebase-config.js'; // Importuojame db iš mūsų Firebase konfigūracijos
import { auth } from './auth-service.js'; // Importuojame auth objektą, kad gautume vartotojo UID
import { selects, inputs } from './dropdown-data-loader.js'; // Importuojame nuorodas į HTML elementus ir duomenis
import { push, ref } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const resultForm = document.getElementById("result-form");
const formMessage = document.getElementById("form-message");

// Funkcija, kuri tvarkys formos pateikimą
const handleSubmit = async (e) => {
  e.preventDefault(); // Sustabdome numatytąjį formos pateikimo elgesį

  const user = auth.currentUser; // Gauname prisijungusį vartotoją
  if (!user) {
    formMessage.textContent = "Turite būti prisijungęs, kad galėtumėte įvesti rezultatą.";
    formMessage.style.color = "red";
    return;
  }
  formMessage.style.color = "initial"; // Atstatome spalvą

  let driverId = selects.driverSelect.value; // Gauname pasirinkto vairuotojo ID
  const newName = inputs.newDriverInput.value.trim(); // Gauname naujo vairuotojo vardą

  // Jei vartotojas įvedė naują vairuotojo vardą, įrašome jį į duomenų bazę
  if (newName) {
    try {
      const newRef = await push(ref(db, 'drivers'), { name: newName });
      driverId = newRef.key; // Nustatome naujai sukurto vairuotojo ID
      // Jei norite, galite čia atnaujinti ir dropdown sąrašą, kad naujas vairuotojas atsirastų iškart
      // bet tai reikėtų padaryti dropdown-data-loader.js faile per onValue listenerį
    } catch (error) {
      formMessage.textContent = `Klaida įrašant naują vairuotoją: ${error.message}`;
      formMessage.style.color = "red";
      return;
    }
  }

  // Patikriname laiko formatą (pvz., "01:23.456")
  const parts = inputs.timeFmtInput.value.split(/[:.]/);
  if (parts.length !== 3 || isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1])) || isNaN(parseInt(parts[2]))) {
    formMessage.textContent = "Blogas laiko formatas. Naudokite mm:ss.mmm (pvz., 01:23.456).";
    formMessage.style.color = "red";
    return;
  }
  formMessage.style.color = "initial"; // Atstatome spalvą

  // Paruošiame duomenis įrašymui
  const resultData = {
    driver_id: driverId,
    car_id: selects.carSelect.value,
    track_id: selects.trackSelect.value,
    date: inputs.dateInput.value,
    time_fmt: inputs.timeFmtInput.value,
    time_sec: parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 1000,
    world_rank: inputs.rankInput.value ? parseInt(inputs.rankInput.value) : null, // Jei laukelis tuščias, įrašome null
    createdAt: Date.now(), // Laikas, kada rezultatas buvo sukurtas
    user_id: user.uid // Vartotojo, kuris įrašė rezultatą, ID
  };

  // Įrašome rezultatą į Realtime Database
  try {
    await push(ref(db, 'results'), resultData);
    formMessage.textContent = "Rezultatas pridėtas sėkmingai!";
    formMessage.style.color = "green";
       // resultForm.reset(); // Išvalome formos laukelius (ši eilutė išjungta arba ištrinta)

    // Išvalome tik laiko, reitingo ir naujo vairuotojo laukelius
    inputs.timeFmtInput.value = ''; // Išvalome laiko laukelį
    inputs.rankInput.value = '';    // Išvalome reitingo laukelį
    inputs.newDriverInput.value = ''; // Išvalome naujo vairuotojo įvesties laukelį

    // Pasiliekame esamą datą, kuri jau yra nustatoma
    // inputs.dateInput.value = new Date().toISOString().split("T")[0]; // Ši eilutė gali likti, jei norima atnaujinti į dabartinę datą po kiekvieno įvedimo, arba ją galima pašalinti, kad data išliktų ta pati, kuri buvo pasirinkta. Aš paliksiu ją, nes tai yra geras numatytasis elgesys po įrašo.

    inputs.dateInput.value = new Date().toISOString().split("T")[0]; // Vėl nustatome dabartinę datą
  } catch (err) {
    formMessage.textContent = "Klaida įrašant rezultatą: " + err.message;
    formMessage.style.color = "red";
  }
};

// Eksportuojame funkciją, kad ją būtų galima iškviesti iš main.js
export const initResultForm = () => {
  resultForm.addEventListener("submit", handleSubmit);
};

