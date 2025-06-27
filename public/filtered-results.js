// filtered-results.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  query,
  orderByChild
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

const filterSurfaceSelect = document.getElementById("filter_surface");
const filterCountrySelect = document.getElementById("filter_country");
const filterDriverSelect = document.getElementById("filter_driver");
const filterTrackSelect = document.getElementById("filter_track");
const filterClassSelect = document.getElementById("filter_class");
const filterCarSelect = document.getElementById("filter_car");
const applyFiltersBtn = document.getElementById("apply-filters-btn");
const resetFiltersBtn = document.getElementById("reset-filters-btn");
const resultsTableBody = document.querySelector("#results-table tbody");

let allData = {
  drivers: {}, cars: {}, tracks: {}, classes: {}, countries: {}
};
let allResults = [];
let sortField = "time_sec";
let sortAsc = true;

function loadOptions(path, targetSelect, storeKey, initialOption = "Visi") {
  onValue(ref(db, path), snap => {
    const data = snap.val() || {};
    allData[storeKey] = data;
    targetSelect.innerHTML = `<option value="">${initialOption}</option>`;
    const seenNames = new Set();
    for (const id in data) {
      const name = data[id].name;
      if (!seenNames.has(name)) {
        seenNames.add(name);
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name;
        targetSelect.appendChild(opt);
      }
    }
    if (storeKey === 'countries') updateTracks();
    if (storeKey === 'classes') updateCars();
  }, { onlyOnce: true });
}

function updateTracks() {
  const selectedCountryId = filterCountrySelect.value;
  const selectedSurface = filterSurfaceSelect.value;
  filterTrackSelect.innerHTML = `<option value="">Visos</option>`;
  const seenNames = new Set();
  for (const id in allData.tracks) {
    const track = allData.tracks[id];
    const matchCountry = !selectedCountryId || track.country_id === selectedCountryId;
    const matchSurface = !selectedSurface || track.surface === selectedSurface;
    if (matchCountry && matchSurface && !seenNames.has(track.name)) {
      seenNames.add(track.name);
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = track.name;
      filterTrackSelect.appendChild(opt);
    }
  }
}

function updateCars() {
  const selectedClassId = filterClassSelect.value;
  filterCarSelect.innerHTML = `<option value="">Visi</option>`;
  const seenNames = new Set();
  for (const id in allData.cars) {
    const car = allData.cars[id];
    if ((!selectedClassId || car.class_id === selectedClassId) && !seenNames.has(car.name)) {
      seenNames.add(car.name);
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = car.name;
      filterCarSelect.appendChild(opt);
    }
  }
}

function loadAllInitialData() {
  loadOptions("drivers", filterDriverSelect, "drivers");
  loadOptions("cars", filterCarSelect, "cars");
  loadOptions("tracks", filterTrackSelect, "tracks");
  loadOptions("classes", filterClassSelect, "classes");
  loadOptions("countries", filterCountrySelect, "countries");

  filterCountrySelect.addEventListener("change", updateTracks);
  filterSurfaceSelect.addEventListener("change", updateTracks);
  filterClassSelect.addEventListener("change", updateCars);

  // Nustatyti paviršių pagal nutylėjimą
  filterSurfaceSelect.value = "dry";
}

function loadAllResults() {
  const resultsRef = query(ref(db, 'results'), orderByChild('time_sec'));
  onValue(resultsRef, snap => {
    const data = snap.val();
    if (!data) return;
    allResults = Object.entries(data).map(([id, result]) => {
      const track = allData.tracks[result.track_id] || {};
      const car = allData.cars[result.car_id] || {};
      const driver = allData.drivers[result.driver_id] || {};
      const country = allData.countries[track.country_id] || {};
      const carClass = allData.classes[car.class_id] || {};
      const distance = parseFloat(track.distance_km) || 0;
      const timeSec = result.time_sec || 1;
      const avgSpeedVal = distance > 0 ? (distance / (timeSec / 3600)) : 0;
      return {
        date: result.date || '',
        driver: driver.name || result.driver_id,
        track: track.name || result.track_id,
        car: car.name || result.car_id,
        time: result.time_fmt || '',
        rank: result.world_rank || '',
        surface: track.surface || '',
        country: country.name || '',
        class: carClass.name || '',
        distance: distance.toFixed(2),
        speed: avgSpeedVal ? avgSpeedVal.toFixed(2) : '',
        time_sec: timeSec,
        distanceRaw: distance,
        speedRaw: avgSpeedVal
      };
    });
    renderResults();
  });
}

function renderResults() {
  let data = filterResults(allResults);

  const sortMap = {
    distance: "distanceRaw",
    speed: "speedRaw",
    rank: "rank",
    time: "time_sec",
    time_sec: "time_sec"
  };
  const fieldToCompare = sortMap[sortField] || sortField;

  const isNumeric = ["time_sec", "rank", "distanceRaw", "speedRaw"].includes(fieldToCompare);

  data.sort((a, b) => {
    const valA = a[fieldToCompare];
    const valB = b[fieldToCompare];

    if (isNumeric) {
      const numA = Number(valA);
      const numB = Number(valB);
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return sortAsc ? 1 : -1;
      if (isNaN(numB)) return sortAsc ? -1 : 1;
      return sortAsc ? numA - numB : numB - numA;
    } else {
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return sortAsc
        ? strA.localeCompare(strB, 'lt', { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, 'lt', { numeric: true, sensitivity: 'base' });
    }
  });

  resultsTableBody.innerHTML = '';
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

function filterResults(data) {
  return data.filter(row => {
    return (!filterSurfaceSelect.value || row.surface === filterSurfaceSelect.value)
      && (!filterCountrySelect.value || row.country === allData.countries[filterCountrySelect.value]?.name)
      && (!filterDriverSelect.value || row.driver === allData.drivers[filterDriverSelect.value]?.name)
      && (!filterTrackSelect.value || row.track === allData.tracks[filterTrackSelect.value]?.name)
      && (!filterClassSelect.value || row.class === allData.classes[filterClassSelect.value]?.name)
      && (!filterCarSelect.value || row.car === allData.cars[filterCarSelect.value]?.name);
  });
}

applyFiltersBtn.addEventListener('click', () => renderResults());
resetFiltersBtn.addEventListener('click', () => {
  document.querySelectorAll('#filter-section select').forEach(select => select.value = '');
  filterSurfaceSelect.value = "dry";
  updateTracks();
  updateCars();
  renderResults();
});

document.querySelectorAll("th[data-sort]").forEach(th => {
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

loadAllInitialData();
loadAllResults();
