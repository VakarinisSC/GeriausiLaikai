// dropdown-data-loader.js
import { db } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const selects = {
  driverSelect: document.getElementById("driver_id"),
  carSelect: document.getElementById("car_id"),
  trackSelect: document.getElementById("track_id"),
  classSelect: document.getElementById("class"),
  countrySelect: document.getElementById("country"),
  surfaceSelect: document.getElementById("surface")
};

const inputs = {
  dateInput: document.getElementById("date"),
  timeFmtInput: document.getElementById("time_fmt"),
  rankInput: document.getElementById("world_rank"),
  newDriverInput: document.getElementById("new_driver")
};

const allData = {
  drivers: {}, cars: {}, tracks: {}, classes: {}, countries: {}
};

function loadOptions(path, targetSelect, storeKey, filterFn = () => true) {
  onValue(ref(db, path), snap => {
    const data = snap.val() || {};
    allData[storeKey] = data; // Išsaugome visus duomenis, jei prireiktų filtravimui
    targetSelect.innerHTML = "";
    for (const id in data) {
      if (!filterFn(data[id])) continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = data[id].name;
      targetSelect.appendChild(opt);
    }
  }, { onlyOnce: true });
}

function updateTracks() {
  const c = selects.countrySelect.value;
  const s = selects.surfaceSelect.value;
  // Naudojame allData.tracks, kad filtruotume iš jau įkeltų trasų
  const filteredTracks = Object.fromEntries(
    Object.entries(allData.tracks).filter(([, track]) => track.country_id === c && track.surface === s)
  );
  renderOptions(selects.trackSelect, filteredTracks);
}

function updateCars() {
  const cl = selects.classSelect.value;
  // Naudojame allData.cars, kad filtruotume iš jau įkeltų automobilių
  const filteredCars = Object.fromEntries(
    Object.entries(allData.cars).filter(([, car]) => car.class_id === cl)
  );
  renderOptions(selects.carSelect, filteredCars);
}

// Pagalbinė funkcija parinktims atvaizduoti
function renderOptions(targetSelect, data) {
  targetSelect.innerHTML = "";
  for (const id in data) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = data[id].name;
    targetSelect.appendChild(opt);
  }
}

// Inicializavimo funkcija
export const initDropdowns = () => {
  loadOptions("drivers", selects.driverSelect, "drivers");
  loadOptions("classes", selects.classSelect, "classes");
  loadOptions("countries", selects.countrySelect, "countries");
  loadOptions("cars", selects.carSelect, "cars");
  loadOptions("tracks", selects.trackSelect, "tracks");

  selects.countrySelect.addEventListener("change", updateTracks);
  selects.surfaceSelect.addEventListener("change", updateTracks);
  selects.classSelect.addEventListener("change", updateCars);

  // Nustatome dabartinę datą
  inputs.dateInput.value = new Date().toISOString().split("T")[0];

  // Laiko formatavimas
  inputs.timeFmtInput.addEventListener("input", () => {
    let v = inputs.timeFmtInput.value.replace(/[^\d]/g, '');
    if (v.length >= 2) v = v.slice(0, 2) + ':' + v.slice(2);
    if (v.length >= 5) v = v.slice(0, 5) + '.' + v.slice(5);
    inputs.timeFmtInput.value = v;
  });
};

// Eksportuojame 'selects', 'inputs' ir 'allData' (jei prireiks result-form-handler.js)
export { selects, inputs, allData };
