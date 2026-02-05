# PROVIDENTIA Blog Admin Panel

## Kako koristiti admin panel

### 1. Prvi pristup

1. Otvori **`providentia-poslovanje-eventi.hr/admin`** u web pregledniku
2. Unesite **lozinku** koju te dao/dala
3. Generiraj **GitHub Personal Access Token (PAT)**:
   - Otvori GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Klikni "Generate new token (classic)"
   - **Name:** PROVIDENTIA Blog
   - **Expiration:** No expiration
   - **Select scopes:** Odaberi samo **repo** (sve opcije ispod repo-a)
   - Klikni "Generate token"
   - **Kopiraj cijeli kod** (počinje s `ghp_`)
4. Vrati se na admin panel i uneseći token
5. Klikni "Uđi u Admin Panel"

Token će biti spreman na lokalnom računu - trebat će ti ga unijeti samo prvi put.

---

### 2. Dodaj novi članek

1. Klikni **"Novi članak"** dugme
2. Popuni sljedeća polja:

   **Početni detalji:**
   - **Naslov (Hrvatski):** npr. "Kako virtualni asistenti pomažu poslovanju"
   - **Naslov (Engleski):** npr. "How virtual assistants help business"
   - **Tag (Hrvatski):** npr. "Poslovanje"
   - **Tag (Engleski):** npr. "Business"

   **Metapodaci:**
   - **Datum objave:** Odaberi datum
   - **Vrijeme čitanja:** Koliko minuta je potrebno za čitanje (3-5 minuta je obično OK)

   **Kratko opažanje (koristi se na listing stranici):**
   - **Hrvatski:** Kratko opažanje od 1-2 rečenice (max 200 znakova)
   - **Engleski:** Short description na engleskom

   **Slika članka:**
   - Klikni na polje ili povuci sliku (PNG, JPG, WebP, max 5MB)
   - Slika će biti prikazana kao hero background na stranici s člankom

   **Sadržaj:**
   - **Hrvatski:** Napišite članak u editoru
   - **Engleski:** Isto na engleskom

3. Klikni **"Spremi članak"**

---

### 3. Uredi postojeći članek

1. Pronađi članek u listi
2. Klikni **"Uredi"** dugme
3. Promijeni potrebne podatke
4. Klikni **"Spremi članak"**

---

### 4. Obriši članak

1. Uredi željeni članek
2. Klikni **"Obriši članek"** dugme (crveno)
3. Potvrdi brisanje

> ⚠️ **Napomena:** Brisanje se ne može pozvati!

---

## WYSIWYG Editor

Koristi se editor za pisanje članka s sljedećim mogućnostima:

- **Naslovni nivoi:** H1, H2, H3
- **Oblikovanje:** Bold, Italic, Underline
- **Liste:** Brojane i nenumerisane liste
- **Blok citati:** Za izdvojene teksta
- **Kod:** Za Code snippete
- **Linkovi:** Dodaj eksterne linkove

---

## Važne napomene

### Slike u članku

Ako želiš dodati slike **unutar članka** (ne samo kao hero background):

1. Kopiraj sliku u folder `images/blog/`
2. U editoru koristi URL: `../images/blog/naziv-slike.webp`

### Jezici

Svaki članek je dostupan na **dva jezika - Hrvatski i Engleski**:
- HR verzija se sprema u `blog/naziv.html`
- EN verzija se sprema u `en/blog/naziv.html`
- Obje se automatski dodaju na odgovarajuće listing stranice

### Automatski procesi

Kada spremiš członek, admin panel automatski:
1. ✅ Uploadira sliku u GitHub
2. ✅ Genira HTML fajl s tvojim sadržajem
3. ✅ Commitira na GitHub
4. ✅ Ažurira blog listing stranice
5. ✅ GitHub Pages rebuilda stranicu (obično 30-60 sekundi)

---

## Sigurnost

- **Lozinka** je spreman na tvom računalu (nije dostupna online)
- **GitHub token** je spreman u lokalnom storage tvog browsera
- Token ima pristup samo `repo` - ne može raditi ništa drugo
- **Ne dijeli** GitHub token s nikime!

---

## Troubleshooting

**Problem:** "Pogrešan GitHub token"
- **Rješenje:** Provjeri je li token počeo s `ghp_` ili `github_pat_`

**Problem:** "Greška pri učitavanju članova"
- **Rješenje:** Provjeri je li token validan i ima `repo` pristup

**Problem:** "Čuvanje je presporo"
- **Rješenje:** GitHub API ima rate limit (5000 zahtjeva/sat). Obično je OK.

---

## Dodatna pomoć

Ako nešto ne radi:
1. Otvori DevTools (F12 → Console)
2. Pogledaj je li neka greška ispisana
3. Kontaktiraj mene s greškom

---

**Zadnja ažuriranja:** 2025-02-05
