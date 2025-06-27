// public/js/results-table-display.js
import { db } from './firebase-config.js';
import { ref, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const resultsRef = query(ref(db, 'results'), orderByChild('createdAt'), limitToLast(10));
const tableBody = document.querySelector("#results tbody");

const metadata = { drivers: {}, tracks: {}, cars: {} };

// Funkcija, kuri įkelia metaduomenis (vairuotojų, trasų, automobilių pavadinimus)
function loadMetaAll() {
  const metaPromises = ["drivers", "tracks", "cars"].map(key => {
    return new Promise(resolve => {
      onValue(ref(db, key), snap => {
        metadata[key] = snap.val() || {};
        resolve();
      }, { onlyOnce: true });
    });
  });
  return Promise.all(metaPromises); // Laukiame, kol visi metaduomenys bus įkelti
}

// Funkcija, kuri atvaizduoja rezultatus lentelėje
function showResults() {
  onValue(resultsRef, snap => {
    const data = snap.val();
    tableBody.innerHTML = ''; // Išvalome lentelę prieš įterpiant naujus duomenis
    if (!data) return;

    // Konvertuojame objektą į masyvą ir rūšiuojame pagal kūrimo datą
    const list = Object.entries(data).sort((a, b) => b[1].createdAt - a[1].createdAt);

    list.forEach(([id, res]) => {
      const tr = document.createElement("tr");
      // Naudojame metaduomenis, kad gautume pavadinimus, jei jų nėra, rodome ID
      const driver = metadata.drivers[res.driver_id]?.name || res.driver_id;
      const track = metadata.tracks[res.track_id]?.name || res.track_id;
      const car = metadata.cars[res.car_id]?.name || res.car_id;

      tr.innerHTML = `
        <td>${res.date || ''}</td>
        <td>${driver}</td>
        <td>${track}</td>
        <td>${car}</td>
        <td>${res.time_fmt || ''}</td>
        <td>${res.world_rank || ''}</td>
      `;
      tableBody.appendChild(tr);
    });
  });
}

// Eksportuojame inicializavimo funkciją
export const initResultsTable = () => {
  loadMetaAll().then(() => { // Pirmiausia įkeliame metaduomenis
    showResults(); // Tada rodome rezultatus
  });
};
