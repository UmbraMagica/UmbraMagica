# 🚀 Nasazení RPG Realm na Railway

## Přesný postup (krok za krokem)

### 1. Stažení kódu z Replit
1. V Replit klikněte na **tlačítko se třemi tečkami** (⋯) nahoře
2. Vyberte **"Export as ZIP"**
3. Stáhněte si ZIP soubor na počítač
4. Rozbalte ZIP soubor do složky

### 2. Vytvoření GitHub repository
1. Jděte na **github.com**
2. Klikněte **"New repository"** (zelené tlačítko)
3. Pojmenujte repository např. **"rpg-realm"**
4. Zvolte **"Public"** (zdarma)
5. Klikněte **"Create repository"**

### 3. Nahrání kódu na GitHub
1. Na stránce nového repository najděte sekci **"uploading an existing file"**
2. Přetáhněte všechny soubory z rozbalené složky
3. V commit zprávě napište: **"Initial commit - RPG Realm app"**
4. Klikněte **"Commit changes"**

### 4. Registrace na Railway
1. Jděte na **railway.app**
2. Klikněte **"Login"**
3. Vyberte **"Login with GitHub"**
4. Povolte Railway přístup k GitHub

### 5. Nasazení aplikace
1. Na Railway dashboard klikněte **"New Project"**
2. Vyberte **"Deploy from GitHub repo"**
3. Najděte vaše **"rpg-realm"** repository
4. Klikněte **"Deploy"**

### 6. Přidání databáze
1. V Railway projektu klikněte **"+ New"**
2. Vyberte **"Database"**
3. Zvolte **"PostgreSQL"**
4. Railway automaticky propojí databázi s aplikací

### 7. Hotovo! 🎉
- Za 5-10 minut bude aplikace dostupná na URL typu: **`vase-app.railway.app`**
- Najdete ji v Railway dashboard pod **"Deployments"**

## Řešení problémů

**Aplikace se nenačte?**
- Počkejte 5-10 minut na dokončení build procesu
- Zkontrolujte v Railway **"Logs"** případné chyby

**Databáze nefunguje?**
- Railway automaticky nastaví DATABASE_URL
- Aplikace vytvoří tabulky automaticky při prvním spuštění

## Výsledek
✅ Funkční RPG aplikace na internetu  
✅ Vlastní doména .railway.app  
✅ Automatické HTTPS  
✅ PostgreSQL databáze  
✅ Zdarma pro začátek  

---
**Potřebujete pomoc?** Pošlete mi zprávu s přesným popisem problému!