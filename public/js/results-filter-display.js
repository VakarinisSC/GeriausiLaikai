// public/js/results-filter-display.js

// Importuojame mūsų bendrą Firebase inicializaciją
import { db } from './firebase-config.js';
import {
  ref,
  onValue,
  query,
  orderByChild // Reikalingas rūšiavimui
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// === DOM elementai (nuorodos į HTML elementus) ===
const filterSurfaceSelect = document.getElementById("filter_surface");
const filterCountrySelect = document.getElementById("filter_country");
const filterDriverSelect = document.getElementById("filter_driver");
const filterTrackSelect = document.getElementById("filter_track");
const filterClassSelect = document.getElementById("filter_class");
const filterCarSelect = document.getElementById("filter_car");
const applyFiltersBtn = document.getElementById("apply-filters-btn");
const resetFiltersBtn = document.getElementById("reset-filters-btn");
const resultsTableBody = document.querySelector("#results-table tbody");
const resultsTableHead = document.querySelector("#results-table thead"); // Reikalingas antraštės paspaudimams

// === Modulio lygio kintamieji duomenims ir būsenai saugoti ===
let allData = { // Čia laikysime visus pagrindinius duomenis (vairuotojai, trasos ir t.t.)
  drivers: {},
  cars: {},
  tracks: {},
  classes: {},
  countries: {}
};
let allResults = []; // Čia laikysime visus RAW rezultatus iš DB
let sortField = "time_sec"; // Numatytasis rūšiavimo laukas
let sortAsc = true; // Numatytasis rūšiavimo tvarka (didėjanti)

// === Pagalbinės funkcijos duomenims įkelti ir atrinkti ===

// Funkcija, kuri atsiunčia duomenis iš Realtime Database VIENĄ KARTĄ
async function fetchDataOnce(path, storeKey) {
  return new Promise(resolve => {
    onValue(ref(db, path), snap => {
      allData[storeKey] = snap.val() || {};
      resolve();
    }, {
      onlyOnce: true
    });
  });
}

// Funkcija, kuri įkelia VISUS reikalingus metaduomenis (vairuotojus, automobilius ir t.t.)
async function loadAllMetadata() {
  await Promise.all([
    fetchDataOnce("drivers", "drivers"),
    fetchDataOnce("cars", "cars"),
    fetchDataOnce("tracks", "tracks"),
    fetchDataOnce("classes", "classes"),
    fetchDataOnce("countries", "countries")
  ]);
  // Po to, kai visi metaduomenys įkelti, galime užpildyti išplečiamuosius sąrašus
  populateAllDropdowns();
}

// Funkcija, kuri užpildo individualius <select> elementus
function populateSelect(targetSelect, data, initialOptionText = "Visi", useIdAsValue = true) {
  targetSelect.innerHTML = `<option value="">${initialOptionText}</option>`;
  // Naudojame Set, kad išvengtume pasikartojančių pavadinimų, jei skirtingi ID turi tą patį pavadinimą
  const seenNames = new Set();
  // Rūšiuojame pagal pavadinimą, kad sąrašai būtų tvarkingi
  const sortedItems = Object.entries(data).sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || '', 'lt', {
    numeric: true,
    sensitivity: 'base'
  }));

  for (const [id, item] of sortedItems) {
    const name = item.name;
    if (name && !seenNames.has(name)) { // Patikriname ar pavadinimas egzistuoja ir nėra pasikartojantis
      seenNames.add(name);
      const opt = document.createElement("option");
      opt.value = useIdAsValue ? id : name; // Galime naudoti ID arba pavadinimą kaip value
      opt.textContent = name;
      targetSelect.appendChild(opt);
    }
  }
}

// Funkcija, kuri užpildo visus filtrų išplečiamuosius sąrašus
function populateAllDropdowns() {
  populateSelect(filterDriverSelect, allData.drivers, "Visi");
  populateSelect(filterClassSelect, allData.classes, "Visos");
  populateSelect(filterCountrySelect, allData.countries, "Visos");
  // Paviršiaus parinktys yra kietai užkoduotos HTML'e, tad jų pildyti nereikia
  // filterSurfaceSelect jau turi "Visi" ir "dry", "wet" parinktis
  updateTracks(); // Atnaujiname trasas, priklausomai nuo šalies/paviršiaus
  updateCars(); // Atnaujiname automobilius, priklausomai nuo klasės

  // Nustatyti paviršių pagal nutylėjimą, jei norime. Originaliame kode buvo "dry"
  // filterSurfaceSelect.value = "dry";
}

// Atnaujina trasų sąrašą pagal pasirinktą šalį ir paviršių
function updateTracks() {
  const selectedCountryId = filterCountrySelect.value;
  const selectedSurface = filterSurfaceSelect.value;
  filterTrackSelect.innerHTML = `<option value="">Visos</option>`;
  const seenNames = new Set();
  const filteredTracks = Object.values(allData.tracks).filter(track => {
    const matchCountry = !selectedCountryId || track.country_id === selectedCountryId;
    const matchSurface = !selectedSurface || track.surface === selectedSurface;
    return matchCountry && matchSurface;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'lt', {
    numeric: true,
    sensitivity: 'base'
  })); // Rūšiuojame abėcėlės tvarka

  for (const track of filteredTracks) {
    if (track.name && !seenNames.has(track.name)) {
      seenNames.add(track.name);
      const opt = document.createElement("option");
      opt.value = track.id || track.name; // Naudojame ID, jei yra, kitu atveju - pavadinimą
      opt.textContent = track.name;
      filterTrackSelect.appendChild(opt);
    }
  }
}

// Atnaujina automobilių sąrašą pagal pasirinktą klasę
function updateCars() {
  const selectedClassId = filterClassSelect.value;
  filterCarSelect.innerHTML = `<option value="">Visi</option>`;
  const seenNames = new Set();
  const filteredCars = Object.values(allData.cars).filter(car => {
    return !selectedClassId || car.class_id === selectedClassId;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'lt', {
    numeric: true,
    sensitivity: 'base'
  })); // Rūšiuojame abėcėlės tvarka

  for (const car of filteredCars) {
    if (car.name && !seenNames.has(car.name)) {
      seenNames.add(car.name);
      const opt = document.createElement("option");
      opt.value = car.id || car.name; // Naudojame ID, jei yra, kitu atveju - pavadinimą
      opt.textContent = car.name;
      filterCarSelect.appendChild(opt);
    }
  }
}

// Funkcija, kuri įkelia visus rezultatus iš Realtime Database
async function loadAllResults() {
  return new Promise(resolve => {
    const resultsRef = query(ref(db, 'results'), orderByChild('createdAt')); // Rūšiuojame pagal sukūrimo laiką DB pusėje
    onValue(resultsRef, snap => {
      const data = snap.val();
      if (!data) {
        allResults = [];
        resolve();
        return;
      }
      // Konvertuojame ir praturtiname rezultatus
      allResults = Object.entries(data).map(([id, result]) => {
        const track = allData.tracks[result.track_id] || {};
        const car = allData.cars[result.car_id] || {};
        const driver = allData.drivers[result.driver_id] || {};
        const country = allData.countries[track.country_id] || {};
        const carClass = allData.classes[car.class_id] || {};

        const distance = parseFloat(track.distance_km) || 0;
        const timeSec = result.time_sec || 0; // Jei nėra laiko, nustatome į 0, kad išvengtume dalijimo iš nulio
        const avgSpeedVal = (distance > 0 && timeSec > 0) ? (distance / (timeSec / 3600)) : 0; // Apskaičiuojame greitį

        return {
          id: id, // Svarbu išsaugoti ID, jei kada nors prireiks
          date: result.date || '',
          driver: driver.name || result.driver_id,
          track: track.name || result.track_id,
          car: car.name || result.car_id,
          time: result.time_fmt || '',
          rank: result.world_rank === null ? '' : result.world_rank, // Jei null, rodyti tuščią eilutę
          surface: track.surface || '',
          country: country.name || '',
          class: carClass.name || '',
          distance: distance ? distance.toFixed(2) : '', // Rodome tik jei > 0
          speed: avgSpeedVal ? avgSpeedVal.toFixed(2) : '', // Rodome tik jei > 0
          time_sec: timeSec, // Neapvalintas laikas sekundėmis rūšiavimui
          distanceRaw: distance, // Neapvalintas atstumas rūšiavimui
          speedRaw: avgSpeedVal // Neapvalintas greitis rūšiavimui
        };
      });
      resolve();
    }, {
      onlyOnce: true
    });
  });
}
// public/js/results-filter-display.js (Tęsinys)

// === Rezultatų filtravimas ir rūšiavimas ===

function filterResults(data) {
  const selectedSurface = filterSurfaceSelect.value;
  const selectedCountryName = filterCountrySelect.value ? allData.countries[filterCountrySelect.value]?.name : '';
  const selectedDriverName = filterDriverSelect.value ? allData.drivers[filterDriverSelect.value]?.name : '';
  const selectedTrackName = filterTrackSelect.value ? allData.tracks[filterTrackSelect.value]?.name : '';
  const selectedClassName = filterClassSelect.value ? allData.classes[filterClassSelect.value]?.name : '';
  const selectedCarName = filterCarSelect.value ? allData.cars[filterCarSelect.value]?.name : '';


  return data.filter(row => {
    return (!selectedSurface || row.surface === selectedSurface) &&
      (!selectedCountryName || row.country === selectedCountryName) &&
      (!selectedDriverName || row.driver === selectedDriverName) &&
      (!selectedTrackName || row.track === selectedTrackName) &&
      (!selectedClassName || row.class === selectedClassName) &&
      (!selectedCarName || row.car === selectedCarName);
  });
}

function renderResults() {
  let dataToRender = filterResults(allResults);

  // Rūšiavimas
  const sortMap = { // Sudarome žemėlapį, kad rūšiavimas veiktų su RAW duomenimis
    distance: "distanceRaw",
    speed: "speedRaw",
    rank: "rank",
    time: "time_sec",
    date: "date"
  };
  const fieldToCompare = sortMap[sortField] || sortField;

  const isNumeric = ["time_sec", "rank", "distanceRaw", "speedRaw"].includes(fieldToCompare);

  dataToRender.sort((a, b) => {
    let valA = a[fieldToCompare];
    let valB = b[fieldToCompare];

    if (isNumeric) {
      const numA = Number(valA);
      const numB = Number(valB);
      // Tvarkome NaN reikšmes, kad jos būtų gale rūšiuojant didėjančiai ir pradžioje rūšiuojant mažėjančiai
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return sortAsc ? 1 : -1;
      if (isNaN(numB)) return sortAsc ? -1 : 1;
      return sortAsc ? numA - numB : numB - numA;
    } else {
      // Lyginame tekstą, įskaitant lietuviškas raides ir skaitines eilutes
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return sortAsc ?
        strA.localeCompare(strB, 'lt', {
          numeric: true,
          sensitivity: 'base'
        }) :
        strB.localeCompare(strA, 'lt', {
          numeric: true,
          sensitivity: 'base'
        });
    }
  });

  // Atvaizdavimas lentelėje
  resultsTableBody.innerHTML = '';
  if (dataToRender.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="11" style="text-align: center;">Nerasta rezultatų pagal pasirinktus kriterijus.</td>`;
    resultsTableBody.appendChild(tr);
    return;
  }

  dataToRender.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.driver}</td>
      <td>${row.track}</td>
      <td>${row.car}</td>
      <td>${row.time}</td>
      <td>${row.rank}</td>
      <td>${row.surface}</td>
      <td>${row.country}</td>
      <td>${row.class}</td>
      <td>${row.distance}</td>
      <td>${row.speed}</td>
    `;
    resultsTableBody.appendChild(tr);
  });
}
// public/js/results-filter-display.js (Tęsinys)

// === Įvykių klausytojai ===

// Prisegame klausytojus prie filtrų keitimo
filterCountrySelect.addEventListener("change", updateTracks);
filterSurfaceSelect.addEventListener("change", updateTracks);
filterClassSelect.addEventListener("change", updateCars);

// Mygtukų klausytojai
applyFiltersBtn.addEventListener('click', () => renderResults());
resetFiltersBtn.addEventListener('click', () => {
  // Išvalome visus select elementus filtruose
  document.querySelectorAll('#filter-section select').forEach(select => select.value = '');
  // Nustatome numatytąją paviršiaus reikšmę (jei norima, palieku užkomentuotą, kad pasirinktum)
  // filterSurfaceSelect.value = "dry"; // Atkomentuoti, jei norite, kad dry būtų numatytasis

  // Atnaujiname trasas ir automobilius, kad atspindėtų išvalytus filtrus
  updateTracks();
  updateCars();

  // Iš naujo atvaizduojame rezultatus su išvalytais filtrais
  renderResults();
});

// Stulpelių rūšiavimo klausytojai (lentelės antraštės)
resultsTableHead.querySelectorAll("th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const newField = th.getAttribute("data-sort");
    if (sortField === newField) {
      sortAsc = !sortAsc; // Pakeičiame rūšiavimo tvarką
    } else {
      sortField = newField; // Nustatome naują rūšiavimo lauką
      sortAsc = true; // Pradedame rūšiuoti didėjančiai
    }
    renderResults(); // Iš naujo atvaizduojame rezultatus
  });
});

// === Modulio inicializavimo funkcija ===

// Ši funkcija bus iškviesta, kai modulis bus įkeltas ir HTML dokumentas bus paruoštas
export const initResultsFilterDisplay = async () => {
  // Pirmiausia įkeliami visi metaduomenys (drivers, cars, tracks ir t.t.)
  await loadAllMetadata();
  // Tada įkeliami visi rezultatai
  await loadAllResults();

  // Meniu įkėlimas, jei jis yra atskirame failiuke
  fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      const menuDiv = document.getElementById("menu");
      if (menuDiv) {
        menuDiv.innerHTML = html;
      }
    })
    .catch(err => console.error("Klaida įkeliant meniu:", err));

  // Ir galiausiai, iškart atvaizduojame išfiltruotus ir surūšiuotus rezultatus
  renderResults();
};

// Paleidžiame inicializavimo funkciją, kai DOM yra pilnai įkeltas
document.addEventListener("DOMContentLoaded", initResultsFilterDisplay);
