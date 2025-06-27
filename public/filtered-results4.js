// filtered-results.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue, // Paliekame onValue, jei norėtume realaus laiko atnaujinimų results lentelėje
  query,
  orderByChild,
  get // Pridėjome 'get' funkciją vienkartiniams duomenų nuskaitymams
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYGX2gOYYZ3NC2P-rYsfBBDARTyjGpl-s",
  authDomain: "geriausilaikai.firebaseapp.com",
  databaseURL: "https://geriausilaikai-default-rtdb.firebaseio.com",
  projectId: "geriausilaikai",
  storageBucket: "geriausilaikai.appspot.com",
  messagingSenderId: "1090896499765",
  appId: "1:1090896499765:web:9be25fdf8a9b102ed28d7c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Nuorodos į HTML elementus
const filterSurfaceSelect = document.getElementById("filter_surface");
const filterCountrySelect = document.getElementById("filter_country");
const filterDriverSelect = document.getElementById("filter_driver");
const filterTrackSelect = document.getElementById("filter_track");
const filterClassSelect = document.getElementById("filter_class");
const filterCarSelect = document.getElementById("filter_car");
const applyFiltersBtn = document.getElementById("apply-filters-btn");
const resetFiltersBtn = document.getElementById("reset-filters-btn");
const resultsTableBody = document.querySelector("#results-table tbody");

// Visi duomenys, gauti iš DB, saugomi čia
let allData = {
  drivers: {}, cars: {}, tracks: {}, classes: {}, countries: {}
};
let allResults = []; // Visi rezultatai, gauti iš DB
let sortField = "time_sec"; // Numatytoji rūšiavimo laukas: laikas sekundėmis (geriausias laikas pirmas)
let sortAsc = true; // Numatytoji rūšiavimo tvarka: didėjanti (mažiausias laikas pirmas)

// Funkcija, skirta gauti duomenis iš Firebase vieną kartą (naudojant get())
// Tai užtikrina, kad allData būtų užpildyta prieš apdorojant rezultatus
async function fetchAndStoreData(path, storeKey) {
  try {
    const snapshot = await get(ref(db, path));
    allData[storeKey] = snapshot.val() || {};
    console.log(`Fetched and stored data for ${storeKey}:`, allData[storeKey]);
  } catch (error) {
    console.error(`Error fetching data for ${storeKey}:`, error);
  }
}

// Funkcija, skirta užpildyti išskleidžiamuosius sąrašus iš allData
function populateSelect(targetSelect, storeKey, initialOption = "Visi") {
  targetSelect.innerHTML = `<option value="">${initialOption}</option>`;
  for (const id in allData[storeKey]) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = allData[storeKey][id].name;
    targetSelect.appendChild(opt);
  }
}

// Atnaujinti trasų sąrašą pagal pasirinktą šalį ir paviršių
function updateTracks() {
  const selectedCountryId = filterCountrySelect.value;
  const selectedSurface = filterSurfaceSelect.value;
  filterTrackSelect.innerHTML = `<option value="">Visos</option>`;
  for (const id in allData.tracks) {
    const track = allData.tracks[id];
    const matchCountry = !selectedCountryId || track.country_id === selectedCountryId;
    const matchSurface = !selectedSurface || track.surface === selectedSurface;
    if (matchCountry && matchSurface) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = track.name;
      filterTrackSelect.appendChild(opt);
    }
  }
  console.log("Trasos atnaujintos.");
}

// Atnaujinti automobilių sąrašą pagal pasirinktą klasę
function updateCars() {
  const selectedClassId = filterClassSelect.value;
  filterCarSelect.innerHTML = `<option value="">Visi</option>`;
  for (const id in allData.cars) {
    const car = allData.cars[id];
    if (!selectedClassId || car.class_id === selectedClassId) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = car.name;
      filterCarSelect.appendChild(opt);
    }
  }
  console.log("Automobiliai atnaujinti.");
}

// Įkelti visus pagalbinius duomenis (drivers, cars, tracks, classes, countries)
async function loadAllInitialData() {
  // Laukiame, kol visi pomociniai duomenys bus įkelti
  await fetchAndStoreData("drivers", "drivers");
  await fetchAndStoreData("cars", "cars");
  await fetchAndStoreData("tracks", "tracks");
  await fetchAndStoreData("classes", "classes");
  await fetchAndStoreData("countries", "countries");

  // Užpildome select'us po to, kai visi allData objektai užpildyti
  populateSelect(filterDriverSelect, "drivers");
  populateSelect(filterCarSelect, "cars");
  populateSelect(filterClassSelect, "classes");
  populateSelect(filterCountrySelect, "countries");
  
  // Atnaujiname priklausomus select'us, kad pasirinkus šalį/klasę iškart atsinaujintų trasos/automobiliai
  updateTracks();
  updateCars();

  console.log("Visos pagrindinės duomenų struktūros įkeltos:", allData);
}

// Įkelti visus rezultatus, rikiuotus pagal laiką
function loadAllResults() {
  // Naudojame onValue, kad automatiškai atnaujintume, jei rezultatai pasikeis Realtime Database
  const resultsRef = query(ref(db, 'results'), orderByChild('time_sec'));
  onValue(resultsRef, snap => {
    const data = snap.val();
    console.log("Neapdoroti rezultatai iš DB:", data);
    if (!data) {
      allResults = [];
      renderResults(); // Vis tiek iškviesti renderResults, kad parodytų "Nėra duomenų"
      return;
    }
    allResults = Object.entries(data).map(([id, result]) => {
      const track = allData.tracks[result.track_id] || {};
      const car = allData.cars[result.car_id] || {};
      const driver = allData.drivers[result.driver_id] || {};
      const country = allData.countries[track.country_id] || {};
      const carClass = allData.classes[car.class_id] || {};

      // Užtikrinti, kad distance_km būtų skaičius.
      const distance = parseFloat(track.distance_km) || 0;
      const timeSec = result.time_sec || 1; // Apsauga nuo dalijimo iš nulio ar jei nėra laiko

      const avgSpeedVal = distance > 0 && timeSec > 0 ? (distance / (timeSec / 3600)) : 0; // Greitis km/h

      return {
        date: result.date || '',
        driver: driver.name || result.driver_id,
        track: track.name || result.track_id,
        car: car.name || result.car_id,
        time: result.time_fmt || '',
        rank: result.world_rank === 0 ? 0 : (result.world_rank || ''), // Jei reitingas 0, rodyti 0. Kitaip tuščia
        surface: track.surface || '',
        country: country.name || '',
        class: carClass.name || '',
        distance: distance.toFixed(2), // Rodymui, su dviem skaičiais po kablelio
        speed: avgSpeedVal ? avgSpeedVal.toFixed(2) : '', // Rodymui
        time_sec: timeSec, // Neapdorota skaitinė vertė rūšiavimui
        distanceRaw: distance, // Neapdorota skaitinė vertė rūšiavimui
        speedRaw: avgSpeedVal // Neapdorota skaitinė vertė rūšiavimui
      };
    });
    console.log("Paruošti rezultatai po mapinimo:", allResults);
    renderResults(); // Iškviečiame rezultatus po visų duomenų įkėlimo
  });
}

// Atvaizduoti filtravimo ir rūšiavimo rezultatus lentelėje
function renderResults() {
  let data = filterResults(allResults); // Atfiltruojame pagal pasirinktus kriterijus

  // Žemėlapis, rodantis, kuris stulpelis atitinka kurį neapdorotą duomenų lauką rūšiavimui
  const sortMap = {
    distance: "distanceRaw", // Ilgis km
    speed: "speedRaw",       // Greitis km/h
    rank: "rank",            // Reitingas
    time: "time_sec",        // Laikas
    date: "date",            // Data (tekstas)
    driver: "driver",        // Vairuotojas (tekstas)
    track: "track",          // Trasa (tekstas)
    car: "car",              // Automobilis (tekstas)
    surface: "surface",      // Paviršius (tekstas)
    country: "country",      // Šalis (tekstas)
    class: "class"           // Klasė (tekstas)
  };
  const fieldToCompare = sortMap[sortField] || sortField;

  data.sort((a, b) => {
    const valA = a[fieldToCompare];
    const valB = b[fieldToCompare];

    // Sąrašas laukų, kurie yra SKAITINIAI ir turi būti rūšiuojami kaip skaičiai
    const isNumeric = ["time_sec", "rank", "distanceRaw", "speedRaw"].includes(fieldToCompare);

    if (isNumeric) {
      // Skaitinis rūšiavimas
      const numA = Number(valA); // Užtikriname, kad būtų skaičius
      const numB = Number(valB); // Užtikriname, kad būtų skaičius
      // Tvarkome NaN, kad jos eitų sąrašo gale arba priekyje, priklausomai nuo rūšiavimo tvarkos
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return sortAsc ? 1 : -1; // NaN į galą, jei didėjančiai
      if (isNaN(numB)) return sortAsc ? -1 : 1; // NaN į galą, jei didėjančiai
      return sortAsc ? numA - numB : numB - numA;
    } else {
      // Tekstinis rūšiavimas
      const strA = String(valA || '').toLowerCase(); // Apsauga nuo undefined/null ir konvertavimas į mažąsias
      const strB = String(valB || '').toLowerCase(); // Apsauga nuo undefined/null ir konvertavimas į mažąsias
      return sortAsc
        ? strA.localeCompare(strB, 'lt', { numeric: true, sensitivity: 'base' }) // Naudojame lietuvių kalbos tvarką
        : strB.localeCompare(strA, 'lt', { numeric: true, sensitivity: 'base' });
    }
  });

  resultsTableBody.innerHTML = ''; // Išvalome lentelės turinį prieš atvaizduojant naujus rezultatus
  if (data.length === 0) {
    resultsTableBody.innerHTML = '<tr><td colspan="11">Nėra rastų rezultatų pagal nurodytus kriterijus.</td></tr>';
  } else {
    data.forEach(row => {
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
  console.log("Rezultatai atvaizduoti.");
}

// Funkcija, kuri filtruoja rezultatus pagal pasirinktus kriterijus
function filterResults(data) {
  return data.filter(row => {
    // Patikriname kiekvieną filtrą. Jei filtras nepasirinktas (value yra tuščia), jis nedaro įtakos filtravimui.
    const surfaceMatch = !filterSurfaceSelect.value || row.surface === filterSurfaceSelect.value;
    const countryMatch = !filterCountrySelect.value || allData.countries[filterCountrySelect.value]?.name === row.country;
    const driverMatch = !filterDriverSelect.value || allData.drivers[filterDriverSelect.value]?.name === row.driver;
    const trackMatch = !filterTrackSelect.value || allData.tracks[filterTrackSelect.value]?.name === row.track;
    const classMatch = !filterClassSelect.value || allData.classes[filterClassSelect.value]?.name === row.class;
    const carMatch = !filterCarSelect.value || allData.cars[filterCarSelect.value]?.name === row.car;

    return surfaceMatch && countryMatch && driverMatch && trackMatch && classMatch && carMatch;
  });
}

// Įvykių klausytojai filtrams, kad atsinaujintų priklausomi sąrašai
filterCountrySelect.addEventListener("change", updateTracks);
filterSurfaceSelect.addEventListener("change", updateTracks); // Kadangi trasos priklauso ir nuo paviršiaus
filterClassSelect.addEventListener("change", updateCars);


// Įvykių klausytojai mygtukams
applyFiltersBtn.addEventListener('click', () => {
  console.log("Filtravimo mygtukas paspaustas.");
  renderResults();
});

resetFiltersBtn.addEventListener('click', () => {
  console.log("Atstatymo mygtukas paspaustas.");
  // Nustatome visas pasirinktis į "Visi"
  document.querySelectorAll('#filter-section select').forEach(select => select.value = '');
  // Atnaujiname priklausomus išskleidžiamuosius sąrašus
  updateTracks();
  updateCars();
  // Nustatome numatytąjį rūšiavimą
  sortField = "time_sec";
  sortAsc = true;
  // Atvaizduojame visus rezultatus
  renderResults();
});

// Įvykių klausytojai stulpelių antraštėms rūšiavimui
document.querySelectorAll("#results-table th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const newField = th.getAttribute("data-sort");
    if (sortField === newField) {
      sortAsc = !sortAsc;
    } else {
      sortField = newField;
      sortAsc = true;
    }
    renderResults();
  });
});

// Pirmas duomenų įkėlimas paleidus puslapį
// Užtikriname, kad viskas būtų įkelta, prieš bandant atvaizduoti rezultatus
window.addEventListener('DOMContentLoaded', async () => {
  await loadAllInitialData(); // Laukiame, kol visi pagrindiniai duomenys bus įkelti
  loadAllResults(); // Tada pradedame klausytis rezultatų ir juos atvaizduoti
});
