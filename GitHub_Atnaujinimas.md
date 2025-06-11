Kaip atnaujinti kodą GitHub'e (keliant antrą ir vėlesnius kartus)?
Kai jau atlikote pirminį sąranką ir pirmą kartą įkėlėte projektą, vėlesni atnaujinimai yra daug paprastesni. Jūs tiesiog pranešate Git'ui, kokius pakeitimus padarėte, "įrašote" juos kaip naują versiją ir tada nusiunčiate tą naują versiją į GitHub.
Štai žingsniai, kai padarote pakeitimų savo projekto failuose (pvz., pataisote klaidą, pridedate naują funkciją savo "geriausilaikai" svetainėje):
1. Padarykite pakeitimus savo projekto failuose. Tiesiog redaguokite HTML, CSS, JavaScript/TypeScript ar kitus failus savo projekto aplanke kompiuteryje.
2. Atidarykite terminalą/komandinę eilutę ir vėl nueikite į savo projekto aplanką (ten, kur yra paslėptas .git aplankas).
3. "Paruoškite" (stage) pakeitimus:
git add .
Ši komanda pasako Git'ui "Aš noriu, kad visi pakeitimai (nauji, modifikuoti ar ištrinti failai) šiame aplanke būtų įtraukti į kitą mano versijos įrašą (commit)". Jei nenorite įtraukti visų pakeitimų, galite nurodyti konkrečius failus, pvz.: git add index.html css/style.css .
4. "Įrašykite" (commit) pakeitimus:
git commit -m "Aiškus pranešimas apie tai, ką pakeitėte"
Vietoj "Aiškus pranešimas apie tai, ką pakeitėte" parašykite trumpą, bet informatyvų aprašymą, ką padarėte šiame "commit'e". Pavyzdžiui: "Pridėta navigacijos juosta" , "Pataisyta klaida prisijungimo formoje" , "Atnaujintas stilius footer'yje" . Geri "commit" pranešimai labai padeda vėliau suprasti istoriją!
5. Nusiųskite (push) naują versiją į GitHub:
git push origin main
(Arba git push origin master , jei jūsų pagrindinė šaka vadinasi master ). Ši komanda paima jūsų naujus vietinius "commit'us" ir nusiunčia juos į jūsų "origin" nuotolinę saugyklą, kurią anksčiau susiejote su GitHub.
Tai viskas! Pakartokite šiuos žingsnius (nuo 3 iki 5) kiekvieną kartą, kai norite išsaugoti ir nusiųsti naujus pakeitimus į GitHub.