// public/js/main.js
import { initAuth } from './auth-service.js'; // Importuojame autentifikacijos inicijavimo funkciją
import { initDropdowns } from './dropdown-data-loader.js'; // Importuojame išplečiamųjų sąrašų inicijavimo funkciją
import { initResultForm } from './result-form-handler.js'; // Importuojame rezultatų formos inicijavimo funkciją
import { initResultsTable } from './results-table-display.js'; // Importuojame rezultatų lentelės inicijavimo funkciją (paskutinis failas)


// Štai ir viskas! Šios funkcijos inicijuoja skirtingas tavo programos dalis.
document.addEventListener("DOMContentLoaded", () => {
  initAuth(); // Inicijuojame autentifikaciją
  initDropdowns(); // Inicijuojame išplečiamuosius sąrašus
  initResultForm(); // Inicijuojame rezultatų įvedimo formą
  initResultsTable(); // Inicijuojame rezultatų lentelę

  // Meniu įkėlimas (jei menu.html yra tiesiogiai public kataloge)
  fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      const menuDiv = document.getElementById("menu");
      if (menuDiv) {
        menuDiv.innerHTML = html;
      }
    })
    .catch(err => console.error("Klaida įkeliant meniu:", err));
});
