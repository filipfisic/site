# Forme - Formsubmit.co Setup

## Što se promijenilo?

Obje forme na PROVIDENTIA web stranici sada se **direktno šalju na email** `filip.fisic@gmail.com`:

1. **Newsletter forma** — kada se klijent prijavi na newsletter
2. **Kontakt forma** — kada klijent pošalje zahtjev

---

## Kako funkcionira?

Forme koriste **Formsubmit.co** servis:
- Besplatan je
- Nema backend potrebnog
- Sve se procesira preko HTTPS
- Email se šalje na `filip.fisic@gmail.com`

**Proces:**
1. Klijent popuni formu na web stranici
2. Klikne "Pošalji" ili "Prijava"
3. JavaScript šalje podatke na Formsubmit.co API
4. Formsubmit.co prosljeđuje email na `filip.fisic@gmail.com`
5. Klijent vidi "Uspješno!" poruku

---

## Što trebam učiniti?

### 1. Prvo korištenje - Potvrda emaila

Kada se prvi email pošalje sa forme, Formsubmit.co će poslati **confirmation email** na `filip.fisic@gmail.com`.

**Trebaš:**
1. Otvori email koji dobiješ
2. Klikni **"Verify"** link
3. **GOTOVO** — nakon toga sve forme funkcioniraju

---

### 2. Dashboard Formsubmit.co (opcionalno)

Ako želiš vidjeti sve primljene forme na jednom mjestu:
1. Otvori https://formsubmit.co/
2. Klikni "Dashboard"
3. Logiraj se s emailom
4. Vidjet ćeš sve primljene forme, responses, itd.

**ALI** — forme će biti dostane i direktno u `filip.fisic@gmail.com` inbox-u, pa dashboard nije obavezan.

---

## Email koji će dobiti

Kada klijent pošalje formu, email će izgledati ovako:

### Newsletter forma:
```
Subject: Nova prijava na newsletter - PROVIDENTIA
From: contact@formsubmit.co

---
name: Marko Horvat
email: marko@example.com
---
```

### Kontakt forma:
```
Subject: Novi zahtjev za kontakt - PROVIDENTIA
From: contact@formsubmit.co

---
name: Ana Kovačević
company: XYZ d.o.o.
phone: +385 1 234 5678
email: ana@xyz.hr
service: Poslovno savjetovanje
message: Trebam pomoć s optimizacijom procesa...
consent: on
---
```

---

## Što je uključeno?

✅ **Newsletter forma:**
- Ime i prezime
- Email
- Subject: "Nova prijava na newsletter - PROVIDENTIA"

✅ **Kontakt forma:**
- Ime i prezime
- Naziv tvrtke (opcionalno)
- Kontakt telefon
- Email
- Vrsta usluge
- Opis usluge/projekta
- GDPR consent checkbox
- Subject: "Novi zahtjev za kontakt - PROVIDENTIA"

---

## Sigurnost

- ✅ Nema CAPTCHA-e (za bolji UX)
- ✅ HTTPS enkriptacija
- ✅ Spam zaštita na Formsubmit.co
- ✅ Email adresa nije vidljiva na web stranici (sprema se samo u kodu)

---

## Testiranje

Trebam testirati lokalno:

1. Otvori http://localhost:8000/
2. Kreni na dolje do **newsletter** sekcije
3. Unesi testne podatke:
   - Ime: "Test Korisnik"
   - Email: "test@gmail.com"
4. Klikni "Prijava"
5. Trebao bi vidjeti "Hvala! Uspješno ste se prijavili."

**Ili za kontakt formu:**
1. Kreni na dolje do **kontakt** sekcije
2. Unesi testne podatke
3. Klikni "Pošalji"
4. Trebao bi vidjeti "Hvala! Vaša poruka je poslana."

---

## Ako nešto ne radi?

### ❌ Email se ne šalje

1. Provjeri je li prvi confirmation email otvoren (trebam kliknuti verify link)
2. Provjeri je li forma popunjena ispravno
3. Otvori DevTools (F12 → Network) i provjeri je li Formsubmit API bio pozvan

### ❌ Greška pri slanju

Ako klijent vidi "Greška pri slanju":
1. Provjeri internet konekciju
2. Provjeri je li email polje ispravno
3. Provjeri je li Formsubmit.co dostupan (malo je vjerovatno da je down)

---

## Sljedeći koraci (opcionalno)

Ako želiš dodati:

- **CAPTCHA** — sprječavanje spam-a (ali loši UX)
- **Email notifikacije** — automatski odgovori klijentima
- **Redirect nakon submit-a** — umjesto inline poruke
- **File upload** — omogućiti prilog (CV, ponuda, itd.)

Javi ako trebam što od toga!

---

## Links

- **Formsubmit.co:** https://formsubmit.co/
- **Documentation:** https://formsubmit.co/docs
- **Dashboard:** https://formsubmit.co/dashboard/

---

**Verzija:** 1.0
**Zadnja ažuriranja:** 2025-02-05
