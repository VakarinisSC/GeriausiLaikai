# Mano Projekto Komandos

Štai svarbiausios komandos, kurias naudoju savo "GeriausiLaikai" projektui.

## Git Komandos

- `git status`
    ```bash
    git status
    ```
    *Aprašymas:* Parodo, kurie failai buvo pakeisti.

- `git add .`
    ```bash
    git add .
    ```
    *Aprašymas:* Prideda visus pakeistus failus paruošimui commit'ui.

- `git commit -m "Aprasymas"`
    ```bash
    git commit -m "Prideta nauja Hosting dalis"
    ```
    *Aprašymas:* Sukuria nauja irasa (commit) su pakeitimais.

- `git push origin main`
    ```bash
    git push origin main
    ```
    *Aprašymas:* Issiuncia pakeitimus i GitHub.

## NPM Komandos

- Įdiegti priklausomybes:
    ```bash
    npm install
    ```
    *Aprašymas:* Įdiegia visus paketus is package.json.

- Paleisti build procesa:
    ```bash
    npm run build
    ```
    *Aprašymas:* Sukuria failus talpinimui (pvz. i 'dist' ar 'public' aplanka).

## Firebase Hosting Komandos

- Prisijungti prie Firebase (jei dar neprisijungete siame PC):
    ```bash
    firebase login
    ```
    *Aprašymas:* Prisijungia prie Firebase per narsykle.

- Deploy'inti Hosting'a:
    ```bash
    firebase deploy --only hosting
    ```
    *Aprašymas:* Ikrauna build'intus failus i Firebase Hosting.

---

*Pastaba:* Siuo metu esu Spark (no-cost) plane.
