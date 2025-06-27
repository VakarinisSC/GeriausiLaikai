// public/js/missing-results-display.js

// Importuojame Firebase konfigūraciją
import { db } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const driverSelect = document.getElementById('driver');
const surfaceSelect = document.getElementById('surface');
const resultsDiv = document.getElementById('results');

let drivers = {}, tracks = {}, countries = {}, classes = {}, cars = {}, results = {};

// Asinchroninė funkcija duomenims gauti
async function fetchAllData() {
    const paths = ['drivers', 'tracks', 'countries', 'classes', 'cars', 'results'];
    const promises = paths.map(path => {
        return new Promise(resolve => {
            onValue(ref(db, path), snap => {
                switch (path) {
                    case 'drivers': drivers = snap.val() || {}; break;
                    case 'tracks': tracks = snap.val() || {}; break;
                    case 'countries': countries = snap.val() || {}; break;
                    case 'classes': classes = snap.val() || {}; break;
                    case 'cars': cars = snap.val() || {}; break;
                    case 'results': results = snap.val() || {}; break;
                }
                resolve();
            }, { onlyOnce: true });
        });
    });
    await Promise.all(promises);
}

function buildUI() {
    driverSelect.innerHTML = '';
    for (const id in drivers) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = drivers[id].name;
        driverSelect.appendChild(opt);
    }
    driverSelect.addEventListener('change', filterMissing);
    surfaceSelect.addEventListener('change', filterMissing);
    filterMissing(); // Paleidžiame filtrą pirminiam atvaizdavimui
}

function filterMissing() {
    const driverId = driverSelect.value;
    const surface = surfaceSelect.value;
    const byCountry = {};

    for (const trackId in tracks) {
        const track = tracks[trackId];
        if (track.surface !== surface) continue;
        const countryData = countries[track.country_id];
        const countryName = countryData ? countryData.name : 'Nežinoma';
        if (!byCountry[countryName]) byCountry[countryName] = [];

        // Apskaičiuojame esamas klases
        const presentClasses = new Set();
        for (const resId in results) {
            const res = results[resId];
            if (res.driver_id === driverId && res.track_id === trackId) {
                const carClass = cars[res.car_id]?.class_id;
                if (carClass) presentClasses.add(carClass);
            }
        }

        const allClassIds = Object.keys(classes);
        const missingClasses = allClassIds.filter(cid => !presentClasses.has(cid)); // Iš tiesų trūkstamos klasės

        byCountry[countryName].push({
            name: track.name,
            id: trackId,
            totalClasses: allClassIds.length, // Visų klasių skaičius trasoje
            presentClassesCount: presentClasses.size, // Kiek klasių jau yra
            missingClassesCount: missingClasses.length, // Kiek klasių trūksta
            presentClasses,
            missingClasses
        });
    }
    renderResults(byCountry);
}

function renderResults(data) {
    resultsDiv.innerHTML = ''; // Išvalome ankstesnius rezultatus

    // Rūšiuojame šalis pagal pavadinimą, kad būtų tvarka
    const sortedCountries = Object.keys(data).sort();

    for (const country of sortedCountries) {
        const tracksInCountry = data[country]; // Visos trasos šioje šalyje (su pasirinktu paviršiumi)

        // Skaičiuojame sumas šaliai
        let totalPossibleClassesForCountry = 0; // Visų galimų klasių skaičius šalyje
        let totalFilledClassesForCountry = 0;   // Užpildytų klasių skaičius šalyje
        let totalMissingClassesForCountry = 0;  // Trūkstamų klasių skaičius šalyje

        tracksInCountry.forEach(track => {
            totalPossibleClassesForCountry += track.totalClasses;
            totalFilledClassesForCountry += track.presentClassesCount;
            totalMissingClassesForCountry += track.missingClassesCount;
        });

        // Sukuriame šalies konteinerį
        const countryBlockDiv = document.createElement('div');
        countryBlockDiv.className = 'country-block';

        // Kuriame antraštę šaliai. Čia ir bus pagrindinis pakeitimas pagal tavo norą.
        const h2 = document.createElement('h2');
        h2.textContent = `${country} (Užpildyta klasių: ${totalFilledClassesForCountry}/${totalPossibleClassesForCountry} | Trūksta: ${totalMissingClassesForCountry})`;
        countryBlockDiv.appendChild(h2);

        // Iteruojame per VISAS trasas šioje šalyje, kad parodytų visas, ne tik tas, kur trūksta
        tracksInCountry.forEach(track => {
            const block = document.createElement('div');
            block.className = 'track-block';

            block.innerHTML = `<strong>${track.name}</strong>`;

            const classListUl = document.createElement('ul');
            classListUl.className = 'class-list';

            // Iteruojame per visas klases (pagal ID)
            Object.keys(classes).forEach(cid => {
                const name = classes[cid].name;
                const listItem = document.createElement('li');
                listItem.className = 'class-item';

                const span = document.createElement('span');
                span.textContent = name;

                if (track.presentClasses.has(cid)) {
                    span.className = 'present';
                } else {
                    span.className = 'missing';
                }

                listItem.appendChild(span);
                classListUl.appendChild(listItem);
            });

            block.appendChild(classListUl);
            countryBlockDiv.appendChild(block);
        });

        resultsDiv.appendChild(countryBlockDiv);
    }

    // Jei nėra duomenų pagal filtrus
    if (sortedCountries.length === 0) {
        resultsDiv.innerHTML = '<p>Nerasta trasų ar rezultatų pagal pasirinktus kriterijus.</p>';
    }
}

// Eksportuojame inicializavimo funkciją, kurią iškviesime iš main.js
export const initMissingResultsDisplay = async () => {
    // Pirmiausia gauname visus reikiamus duomenis
    await fetchAllData();
    // Tada statome vartotojo sąsają ir paleidžiame filtrą
    buildUI();
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
};
// public/js/missing-results-display.js

// ... (visas ankstesnis kodas, kuris buvo pateiktas, įskaitant fetchAllData, buildUI, filterMissing, renderResults ir export initMissingResultsDisplay) ...


// Ši eilutė užtikrina, kad initMissingResultsDisplay() bus iškviesta, kai puslapis bus įkeltas.
document.addEventListener("DOMContentLoaded", initMissingResultsDisplay);