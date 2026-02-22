# Spell Tome — D&D 5e Spell Card Selector

A browser-based spell card selector and PDF printer for D&D 5e (2014 ruleset). Choose your class and character level, browse available spells, select cards, and export a print-ready PDF — 8 cards per A4 landscape page.

No server. No build step. No dependencies.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Spells](https://img.shields.io/badge/spells-336-purple.svg)](_src/data/spells.js)

---

## GitHub Pages Setup

This repo uses **branch-based deployment** — no GitHub Actions required.

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, choose **Deploy from a branch**
4. Set branch to **main**, folder to **/ (root)**
5. Click **Save**

Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/` within ~60 seconds.

> If you see a **GitHub Actions error**, it means Pages is set to "GitHub Actions" instead of "Deploy from a branch". Switch it to **Deploy from a branch** and the error will stop.

---

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/spelltome.git
cd spelltome
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

---

## How to Use

1. Select your **class**
2. Select your **character level** — available spells appear immediately
3. Toggle **Spell Level**, **School**, and **Source** pills to filter
4. Use the **search box** to find spells by name or keyword
5. **Click any card** to select it
6. Click **Print to PDF**, review the preview, then **Open Print Dialog**
7. In Chrome's print dialog: enable **Background graphics** to preserve school colour bands in the PDF

---

## Features

- 336 spells — Player's Handbook (312) and Xanathar's Guide to Everything (24)
- Accurate spell slot filtering — full casters, half casters (Paladin/Ranger from level 2), Warlock pact magic
- Click-to-select cards with running selection count
- Filter pills — spell level, school, source book — all independently togglable
- Free text search across spell name and description
- Print preview before committing to PDF export
- A4 landscape PDF, 8 cards per page, school colours preserved
- Zero dependencies — vanilla HTML/CSS/JS, no npm, no frameworks

---

## Project Structure

```
├── index.html       self-contained app (all CSS and JS inlined — this is the only file GitHub Pages serves)
├── _config.yml      tells Jekyll to ignore source files
├── .nojekyll        disables Jekyll theme application
├── _src/            source files (Jekyll ignores all folders starting with _)
│   ├── data/
│   │   └── spells.js       336 spells — edit this to add or correct spells
│   ├── scripts/
│   │   └── app.js          application logic
│   ├── styles/
│   │   ├── main.css
│   │   ├── card.css
│   │   └── print.css
│   └── build.py            run to rebuild index.html after editing source files
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

`index.html` is fully self-contained — all CSS and JavaScript are inlined. Source files in `_src/` are for editing and contribution; Jekyll ignores them automatically.

---

## Editing & Rebuilding

Edit files in `_src/`, then rebuild `index.html`:

```bash
python3 _src/build.py
```

Commit and push the updated `index.html`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The most useful contribution is adding spells from Tasha's Cauldron (TCE) — edit `_src/data/spells.js` and submit a PR.

---

## Legal

Independent fan tool — not affiliated with or endorsed by Wizards of the Coast. D&D and all related marks are trademarks of Wizards of the Coast LLC. Spell text used under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).

---

[MIT License](LICENSE)
