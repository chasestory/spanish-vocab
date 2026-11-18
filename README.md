# Raíz

Spanish vocabulary for Chase, an English speaker. The deck is the **5,000** most frequent lemmatized Spanish words from movie and TV subtitles, plus **2,000** short everyday phrases. It runs in the browser, installs as an app, and works offline after the first load. There is no account and no server. Progress stays in IndexedDB and localStorage, and you can export or import it as JSON.

## What’s in the deck

| | Count |
|---|---|
| Lemmas | 5,000 |
| With a short Wiktionary example | 1,176 |
| Nouns (2,989 of them have gender and an article) | 3,001 |
| Verbs | 1,051 |
| Adjectives | 522 |
| Phrases | 2,000 |

Verb breakdown, from the conjugation engine:

| Kind | Verbs |
|---|---|
| Regular | 712 |
| Spelling change (`buscar`, `-zco`, `-uir`, `leer` → `leyó`) | 126 |
| Stem-changing (`pensar`, `pedir`, `dormir`, `jugar`) | 109 |
| Irregular stem or suppletive (`ser`, `tener`, `hacer`, …) | 98 |
| Tagged verb but not an infinitive (`había`, `escucho`, …) | 6 |

The irregular-verb filter includes spelling changes, stem changes, and true irregulars (**333** verbs).

Phrases are spread across greetings, politeness, introductions, small talk, feelings, questions, time, weather, directions, transport, travel, hotel, food, restaurant, shopping, money, home, work, study, health, emergencies, phone, opinions, plans, idioms, and everyday lines (about 77 each).

Ranks are **not** hand-assigned. Each rank is the order of summed OpenSubtitles 2018 token counts after the filters below. Rank 1 is the most frequent remaining lemma (`de`).

## Study

- Frequency bands: top 100 / 500 / 1,000 / 2,000 / 3,000 / 5,000, or a custom rank range.
- Filter by part of speech, irregular verbs, or phrase category.
- Spaced repetition (an SM-2 variant) with Again, Hard, Good, and Easy.
- Modes: Spanish → English flip, English → Spanish typing (accent-tolerant, with an on-screen á é í ó ú ñ ü ¿ ¡ bar), multiple choice, and listening via the Web Speech API.
- Conjugation drill for present, preterite, imperfect, future, conditional, present subjunctive, and imperative. Vosotros can be turned off.
- Daily goal, streak, accuracy, words learned by band, searchable browse list, word page with a conjugation table, starring, and a difficult list (two or more lapses).
- Latin American vs Spain (vosotros and `es-MX` / `es-ES` voice), speech rate, dark mode, daily new-card limit.
- Desktop shortcuts: Space reveals, 1–4 rate, Enter checks a typed answer.

## Run it

```bash
npm install
npm test
npm run dev
```

The dev server listens on port **43123**.

Production build:

```bash
npm run build
npm run preview
```

`npm test` covers the scheduler, accent-tolerant answer checking, the irregular conjugations (`ser`, `estar`, `ir`, `tener`, `hacer`, `decir`, `poder`, `poner`, `saber`, `querer`, `venir`, `dar`, `ver`, `salir`, `traer`, `conocer`, `oír`, `caber`, `haber`, `andar`, `conducir`, `pedir`, `dormir`, `sentir`, `jugar`, and the patterns around them), and the shape of the shipped JSON.

## Rebuild the data

Raw downloads land in `data/raw/` (gitignored). The script is repeatable:

```bash
pip install -r scripts/requirements.txt
python3 scripts/build_dataset.py
```

It writes `public/data/words.json`, `public/data/phrases.json`, and `public/data/meta.json`.

What the script does:

1. Reads Hermit Dave’s `es_full.txt` counts (OpenSubtitles 2018 via OPUS).
2. Lemmatizes with English Wiktionary form-of links and inflection tables (kaikki.org). `simplemma` is only a fallback.
3. Splits shared `ser`/`ir` forms (`fui`, `fue`, `fueron`, and the `-ra`/`-se` set) evenly. Other ambiguous strings stay put when Wiktionary gives that string its own gloss.
4. Keeps closed-class words (`el`, `la`, `se`, `hay`, `del`, `al`, …) as their own cards.
5. Drops proper names, letter names, misspellings, and anything with no English gloss, then ranks what remains.
6. Pulls one short bilingual usage example from Wiktionary when one exists. Literary quotations are skipped.
7. Picks 2,000 short Tatoeba sentence pairs that use common words and labels them with keyword categories.

## Sources and licenses

| Data | Source | License |
|---|---|---|
| Frequency counts | [FrequencyWords](https://github.com/hermitdave/FrequencyWords) `content/2018/es/es_full.txt`, from [OPUS OpenSubtitles 2018](https://opus.nlpl.eu/OpenSubtitles2018.php) | CC BY-SA 4.0 for the lists (code in that repo is MIT) |
| Glosses, part of speech, gender, word examples, inflection links | [English Wiktionary](https://en.wiktionary.org) Spanish entries via [kaikki.org](https://kaikki.org/dictionary/Spanish/) | CC BY-SA 3.0 and GFDL. Wiktionary contributors. |
| Fallback lemmatizer | [simplemma](https://github.com/adbar/simplemma) 2.0 | MIT code; its Spanish lexicon is Wiktionary-derived |
| Phrases | [Tatoeba](https://tatoeba.org) exports (`spa` sentences, `eng` sentences, `links.csv`) | CC BY 2.0 FR. Each card keeps the Tatoeba sentence id and the contributor name when the export had one. |

`public/data/words.json` is an adaptation of the CC BY-SA frequency list and Wiktionary, shared under **CC BY-SA 4.0**. `public/data/phrases.json` stays under **Tatoeba’s CC BY 2.0 FR** and is not relicensed as ShareAlike. Application code is MIT; see below.

Changes from the upstream lists: lemmatized and deduplicated, proper names removed, English glosses and gender joined on, example sentences attached where Wiktionary had a short one.

## Deploy

The app is a static site. `npm run build` writes `dist/`.

### GitHub Pages

`.github/workflows/pages.yml` builds with `GITHUB_PAGES=true` (base path `/spanish-vocab/`) and deploys with GitHub Actions. In the repo settings, set Pages → Build and deployment → Source to **GitHub Actions**. Push to `main`.

The live URL is `https://chasestory.github.io/spanish-vocab/` once Pages is enabled on `chasestory/spanish-vocab`.

### Netlify or Vercel

Build command `npm run build`, publish directory `dist`. Leave `GITHUB_PAGES` unset so the base path stays `/`. Rewrite unknown paths to `index.html`. The GitHub Pages build also copies `index.html` to `404.html` for the same reason.

## Install on iPhone or iPad

1. Open the hosted site in Safari (a home-screen app needs the production build, not the dev server).
2. Tap Share → **Add to Home Screen**.
3. Open Raíz from the icon. The first visit caches the deck. After that it works offline, including the word list, phrases, and your progress.

On desktop Chrome or Edge, use the install icon in the address bar.

## Move progress between devices

Settings → **Export JSON**. On the other device, Settings → **Merge a file** (keeps the newer review of each card) or **Replace this device**.

## Gaps

- Frequency is conversational subtitle Spanish, not a balanced written corpus. Names and English fragments were removed; a few odd entries remain (`había`, `escucho`, `probando`, `ponerle`, `hermandad`, `hope`) because Wiktionary gives that exact string its own gloss.
- 1,176 of 5,000 lemmas have a short example. The rest have no suitable Wiktionary usage example. Tatoeba lines stay in the phrase file so the word file can remain CC BY-SA.
- `ser`/`ir` shared forms are split 50/50. A form that is also its own word (`fuera`, “outside”) keeps its own card, so those verb counts are a bit low.
- Vosotros is included. Rioplatense `vos` is not.
- Listening uses whatever Spanish voice the browser has. iOS has one; some desktops do not, and the choice buttons still work.
- Phrase categories are keyword labels, not a hand edit, so a few lines sit in a neighboring category.
- A handful of rare irregulars (for example `placer`’s old preterite) are not special-cased. The verbs called out above are tested.

## License

MIT for the application code.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The dataset files keep the licenses in the table above. ShareAlike on `words.json` does not relicense the Tatoeba phrases.
