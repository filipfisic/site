# Instalacija Blog Admin Panela

## Što je potrebno?

1. **GitHub račun** - ako ga već nemaš, [kreiraj ovdje](https://github.com/signup)
2. **Lozinka** - dobit ćeš je od mene
3. **5 minuta vremena** - za generiranje GitHub tokena

---

## Korak 1: Generiraj GitHub Personal Access Token (PAT)

### A. Otvori GitHub Settings

1. Logiraj se na GitHub
2. Klikni na **profilnu ikonu** (gore desno) → **Settings**

### B. Pronađi Personal Access Tokens

1. U lijevoj traci, pronađi **Developer settings** (skrolaj dolje)
2. Klikni na **Personal access tokens** → **Tokens (classic)**

### C. Generiraj novi token

1. Klikni **"Generate new token (classic)"** gumb
2. Popuni sljedeće:

   | Polje | Vrijednost |
   |-------|-----------|
   | **Token name** | `PROVIDENTIA Blog` |
   | **Expiration** | `No expiration` (besmisleno) |
   | **Scopes** | Odaberi samo **repo** (svi sub-items) |

3. Skrolaj dolje i klikni **"Generate token"**

### D. Spremi token

> ⚠️ **VAŽNO:** Token je vidljiv samo SADA! Kopiraj ga i spremi negdje sigurno.

**Token izgleda ovako:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Ili s verzijom 2023+:
```
github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Korak 2: Provjeri je li repo u redoslijedu

1. Otvori [https://github.com/filipfisic/site](https://github.com/filipfisic/site)
2. Provjeri da li je `PROVIDENTIA_2/` folder u glavnom direktoriju
3. Trebali bi vidjeti:
   - `PROVIDENTIA_2/admin/` folder
   - `PROVIDENTIA_2/blog/` folder
   - `PROVIDENTIA_2/blog.html` datoteka

---

## Korak 3: Pristup Admin Panelu

1. Otvori **`providentia-poslovanje-eventi.hr/admin`** (ili `localhost:8000/PROVIDENTIA_2/admin/` ako radi lokalno)
2. Prikazan će biti login screen
3. Unesi:
   - **Lozinka:** Koji te dao/dala
   - **GitHub Token:** Koji ste upravo generirao

4. Klikni **"Uđi u Admin Panel"**

---

## Korak 4: Provjeri je li sve radi

1. Trebao bi vidjeti **listu svih članova** (ako postoje)
2. Klikni **"Novi članak"** — trebao bi vidjeti editor
3. Ako se sve učitava, gotovo! ✅

---

## Česte greške

### ❌ "Neispravan GitHub token format"

**Rješenje:** Token mora počinjati s `ghp_` ili `github_pat_`. Ako se drugačije prikazuje:
1. Otvori Settings → Developer settings → Tokens (classic)
2. Generiraj NOVI token (stari može biti istekao ili u krivom formatu)

### ❌ "Pogrešna lozinka"

**Rješenje:** Lozinka razlikuje VELIKA i mala slova. Provjeri je li ispravna.

### ❌ "Greška pri učitavanju članova"

**Rješenje:** GitHub API zahtijeva `repo` pristup. Provjeri:
1. Je li token generian s `repo` scopeom?
2. Je li token jos uvijek validan?

---

## Što token može i ne može?

### ✅ Token MOŽE:
- Čitati javne i privatne repozitorije
- Stvarati i brisati fajlove
- Pushati u repo

### ❌ Token NE MOŽE:
- Pristupati drugim repozitorijima
- Administrirati settings
- Pristupati ostalim projektima

Zato je sigurno!

---

## Odjava iz Admin Panela

Kada završiš s pisanjem članka:
1. Klikni **"Odjava"** dugme (gore desno)
2. Token ostaje spreman u lokalnom storage — sljedeći put jednostavno ponovi login

---

## Ako nešto ne radi

1. **Otvori DevTools:** Pritisni `F12` ili `Cmd+Option+I`
2. **Vidi Console tab** — trebalo bi biti neke greške
3. **Kontaktiraj mene** s greškom koja se pojavljuje

---

## Dodatni resursi

- [GitHub API dokumentacija](https://docs.github.com/en/rest)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Blog README](./README.md) — detalji o korištenju admin panela

---

**Verzija:** 1.0
**Zadnja ažuriranja:** 2025-02-05
