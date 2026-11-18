#!/usr/bin/env python3
"""Build Raíz's static Spanish dataset from open sources.

Inputs (downloaded into data/raw if missing):
  - Hermit Dave FrequencyWords es_full.txt (OpenSubtitles 2018), CC BY-SA 4.0
  - kaikki.org Spanish dictionary extracted from English Wiktionary, CC BY-SA 3.0
  - Tatoeba per-language sentences + links, CC BY 2.0 FR

Outputs:
  - public/data/words.json       lemmas ranked by summed subtitle frequency
  - public/data/phrases.json     everyday Tatoeba phrases
  - public/data/meta.json        counts, filters, attribution

Frequency ranks are computed from the corpus counts. They are not hand-assigned.
"""

from __future__ import annotations

import bz2
import gzip
import json
import re
import sys
import tarfile
import urllib.request
from collections import defaultdict
from pathlib import Path

import simplemma

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "public" / "data"

URLS = {
    "es_full.txt": "https://github.com/hermitdave/FrequencyWords/raw/master/content/2018/es/es_full.txt",
    "kaikki-es.jsonl.gz": "https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl.gz",
    "spa_sentences_detailed.tsv.bz2": "https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences_detailed.tsv.bz2",
    "eng_sentences.tsv.bz2": "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2",
    "links.tar.bz2": "https://downloads.tatoeba.org/exports/links.tar.bz2",
}

WORD_RE = re.compile(r"^[a-záéíóúüñ]+$")
TOKEN_RE = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+")
KEEP = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "lo", "le", "les",
    "me", "te", "se", "nos", "os", "mi", "mis", "tu", "tus", "su", "sus",
    "yo", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas",
    "usted", "ustedes", "este", "esta", "estos", "estas", "eso", "ese", "esa",
    "aquel", "aquella", "qué", "que", "de", "a", "y", "o", "u", "en", "con",
    "por", "para", "sin", "sobre", "entre", "del", "al", "sí", "si", "no",
    "más", "mas", "ya", "muy", "también", "pero", "porque", "cuando", "donde",
    "como", "cómo", "dónde", "cuándo", "cuál", "cuánto", "hay", "muy",
}
# Identical ser/ir preterite and imperfect-subjunctive forms. Split evenly.
AMBIGUOUS = {
    "fui": ("ser", "ir"),
    "fuiste": ("ser", "ir"),
    "fue": ("ser", "ir"),
    "fuimos": ("ser", "ir"),
    "fuisteis": ("ser", "ir"),
    "fueron": ("ser", "ir"),
    "fuera": ("ser", "ir"),
    "fueras": ("ser", "ir"),
    "fuéramos": ("ser", "ir"),
    "fuerais": ("ser", "ir"),
    "fueran": ("ser", "ir"),
    "fuese": ("ser", "ir"),
    "fueses": ("ser", "ir"),
    "fuésemos": ("ser", "ir"),
    "fueseis": ("ser", "ir"),
    "fuesen": ("ser", "ir"),
}
INFLECTION_TAGS = {
    "plural", "singular", "feminine", "masculine", "participle", "gerund",
    "first-person", "second-person", "third-person", "present", "preterite",
    "imperfect", "future", "conditional", "subjunctive", "imperative",
    "indicative", "past",
}
OUT_POS = {
    "noun": "noun",
    "verb": "verb",
    "adj": "adjective",
    "adv": "adverb",
    "pron": "pronoun",
    "prep": "preposition",
    "conj": "conjunction",
    "det": "determiner",
    "article": "determiner",
    "intj": "interjection",
    "num": "number",
    "contraction": "determiner",
    "particle": "adverb",
}
POS_WEIGHT = {
    "prep": 50, "conj": 48, "article": 46, "contraction": 45, "det": 44, "particle": 42,
    "pron": 40, "adv": 36, "num": 34, "verb": 30, "noun": 28, "adj": 26, "intj": 14,
}
SHORT_VERBS = {"ser", "ir", "ver", "dar", "estar"}
BAD_PHRASE = re.compile(
    r"\b(fuck|shit|bitch|cunt|nigger|faggot|joder|coño|mierda|puto|puta|"
    r"pendejo|pendeja|cabrón|cabron|gilipollas|maricón|maricon|chingar|"
    r"chingada|verga|polla|follar)\b",
    re.I,
)

VOWELS = set("aeiouáéíóúü")
ACCENT = set("áéíóú")


def download(name: str) -> None:
    dest = RAW / name
    if dest.exists() and dest.stat().st_size > 0:
        return
    RAW.mkdir(parents=True, exist_ok=True)
    url = URLS[name]
    print(f"downloading {url}", flush=True)
    urllib.request.urlretrieve(url, dest)


def is_word(token: str) -> bool:
    return bool(token) and len(token) <= 28 and WORD_RE.match(token) is not None


def split_vowel_group(group: str) -> list[str]:
    def kind(ch: str) -> str:
        if ch in "íú":
            return "aw"
        if ch in "áéó":
            return "as"
        if ch in "iuü":
            return "w"
        if ch in "aeo":
            return "s"
        return "o"

    def diph(a: str, b: str) -> bool:
        ka, kb = kind(a), kind(b)
        if "aw" in (ka, kb):
            return False
        if ka == "w" and kb == "w":
            return True
        if ka == "w" and kb in {"s", "as"}:
            return True
        if ka in {"s", "as"} and kb == "w":
            return True
        return False

    out: list[str] = []
    i = 0
    while i < len(group):
        if i == len(group) - 1:
            out.append(group[i])
            break
        a, b = group[i], group[i + 1]
        if diph(a, b):
            if (
                i + 2 < len(group)
                and diph(a, b)
                and kind(a) == "w"
                and kind(b) in {"s", "as"}
                and kind(group[i + 2]) == "w"
            ):
                out.append(group[i : i + 3])
                i += 3
            else:
                out.append(group[i : i + 2])
                i += 2
        else:
            out.append(a)
            i += 1
    return out


def nuclei(word: str) -> list[str]:
    groups: list[str] = []
    i = 0
    w = word.lower()
    while i < len(w):
        if w[i] in VOWELS:
            j = i + 1
            while j < len(w) and w[j] in VOWELS:
                j += 1
            groups.append(w[i:j])
            i = j
        else:
            i += 1
    out: list[str] = []
    for group in groups:
        out.extend(split_vowel_group(group))
    return out


def stressed_index(word: str) -> int:
    nucs = nuclei(word)
    if not nucs:
        return -1
    for i, nuc in enumerate(nucs):
        if any(ch in ACCENT for ch in nuc):
            return i
    last = word[-1].lower()
    if last in "nsaeiouáéíóúü":
        return max(0, len(nucs) - 2)
    return len(nucs) - 1


def feminine_takes_el(lemma: str) -> bool:
    w = lemma.lower()
    if w in {"hache", "a", "alfa"}:
        return False
    body = w[1:] if w.startswith("h") else w
    if not body.startswith(("a", "á")):
        return False
    return stressed_index(w) == 0


def self_test_articles() -> None:
    expect = {
        "agua": True,
        "alma": True,
        "hambre": True,
        "águila": True,
        "hada": True,
        "hacha": True,
        "aula": True,
        "ala": True,
        "área": True,
        "arma": True,
        "amiga": False,
        "ayuda": False,
        "amistad": False,
        "acción": False,
        "harina": False,
        "habitación": False,
        "arena": False,
        "hache": False,
    }
    bad = [w for w, flag in expect.items() if feminine_takes_el(w) != flag]
    if bad:
        raise SystemExit(f"article self-test failed: {bad}")


def sense_text(sense: dict) -> str:
    glosses = sense.get("glosses") or []
    if not glosses:
        return ""
    text = glosses[0] if len(glosses) == 1 else " ".join(glosses)
    return re.sub(r"\s+", " ", text).strip()


def sense_score(gloss: str, tags: list | None) -> int | None:
    tagset = set(tags or [])
    if "form-of" in tagset or "misspelling" in tagset:
        return None
    low = gloss.lower()
    if low.startswith(
        (
            "inflection of",
            "form of",
            "alternative form",
            "misspelling",
            "obsolete form",
            "abbreviation of",
            "initialism of",
            "clipping of",
            "prepositional form of",
            "apocopic form of",
        )
    ) and "," not in gloss:
        return None
    if low.startswith(
        (
            "inflection of",
            "form of",
            "alternative form",
            "misspelling",
            "obsolete form",
            "abbreviation of",
            "initialism of",
            "clipping of",
        )
    ):
        return None
    if tagset & {"archaic", "obsolete", "dated", "historical"}:
        return None
    score = 10
    if "rare" in tagset:
        score -= 6
    if tagset & {"slang", "vulgar", "offensive"}:
        score -= 5
    if "colloquial" in tagset:
        score -= 1
    if "letter" in tagset or "name of the letter" in low or "letter of the" in low:
        score -= 12
    if len(gloss) > 110:
        score -= 2
    if len(gloss) < 42:
        score += 1
    return score


def is_weak_gloss(gloss: str, tags: list | None) -> bool:
    tagset = set(tags or [])
    low = gloss.lower()
    if "letter" in tagset or "misspelling" in tagset:
        return True
    return low.startswith("the name of the") or "letter of the" in low or low.startswith("name of the letter")


def clean_example(text: str) -> str:
    text = text.replace("\n", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def pick_example(senses: list[dict]) -> dict | None:
    best = None
    for sense in senses:
        for ex in sense.get("examples") or []:
            if ex.get("type") not in (None, "example"):
                continue
            es = clean_example(ex.get("text") or "")
            en = clean_example(ex.get("english") or ex.get("translation") or "")
            if not es or not en or es.lower() == en.lower():
                continue
            if len(es) > 140 or len(en) > 170:
                continue
            n = len(TOKEN_RE.findall(es))
            if n < 2 or n > 16:
                continue
            score = 120 - n * 4 - abs(len(es) - 48) / 8
            if best is None or score > best[0]:
                best = (score, es, en)
    if not best:
        return None
    return {"es": best[1], "en": best[2], "source": "wiktionary"}


def load_frequency() -> tuple[list[tuple[str, int]], set[str]]:
    rows: list[tuple[str, int]] = []
    surfaces: set[str] = set()
    with (RAW / "es_full.txt").open(encoding="utf-8", errors="replace") as handle:
        for line in handle:
            parts = line.split()
            if len(parts) != 2:
                continue
            word, count_s = parts
            word = word.lower()
            if not is_word(word):
                continue
            if len(word) == 1 and word not in {"a", "y", "o", "u"}:
                continue
            try:
                count = int(count_s)
            except ValueError:
                continue
            if count <= 0:
                continue
            rows.append((word, count))
            surfaces.add(word)
    print(f"frequency surfaces: {len(rows):,}", flush=True)
    return rows, surfaces


def load_lexicon(surfaces: set[str]) -> tuple[dict, dict]:
    lex: dict[str, dict] = {}
    form_map: dict[str, set[str]] = defaultdict(set)
    path = RAW / "kaikki-es.jsonl.gz"
    seen = 0
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        for line in handle:
            seen += 1
            if seen % 200000 == 0:
                print(f"  kaikki rows {seen:,}", flush=True)
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("lang_code") != "es":
                continue
            word = (obj.get("word") or "").strip().lower()
            pos = obj.get("pos") or ""
            if pos not in OUT_POS and pos not in {"name", "character", "prefix", "suffix"}:
                # still allow form-of links below if the word is relevant
                pass
            if not is_word(word):
                continue
            senses = obj.get("senses") or []
            targets: list[str] = []
            real: list[dict] = []
            for sense in senses:
                tags = sense.get("tags") or []
                form_of = sense.get("form_of") or []
                if "form-of" in tags or form_of:
                    for item in form_of:
                        target = (item.get("word") or "").strip().lower()
                        if is_word(target):
                            targets.append(target)
                    continue
                gloss = sense_text(sense)
                if not gloss:
                    continue
                real.append({"gloss": gloss, "tags": tags})
            if word in surfaces and targets:
                for target in targets:
                    form_map[word].add(target)
            if real and pos in OUT_POS:
                bucket = lex.setdefault(word, {"poses": {}, "strong": False, "example": None})
                if bucket["poses"].get(pos):
                    continue
                slot = bucket["poses"].setdefault(pos, [])
                for sense in real:
                    score = sense_score(sense["gloss"], sense["tags"])
                    if score is None or score < 3:
                        continue
                    slang = bool(set(sense.get("tags") or []) & {"slang", "vulgar", "offensive"})
                    slot.append({**sense, "score": score, "slang": slang})
                    if not is_weak_gloss(sense["gloss"], sense["tags"]):
                        bucket["strong"] = True
                if bucket["example"] is None:
                    ex = pick_example(senses)
                    if ex:
                        bucket["example"] = ex
                del slot[8:]
            if real and pos in OUT_POS and word in surfaces:
                for form in obj.get("forms") or []:
                    form_word = (form.get("form") or "").strip().lower()
                    tags = set(form.get("tags") or [])
                    if not is_word(form_word) or form_word == word or form_word not in surfaces:
                        continue
                    if tags & INFLECTION_TAGS:
                        form_map[form_word].add(word)
    # drop empty pose maps
    empty = [w for w, data in lex.items() if not any(data["poses"].values())]
    for w in empty:
        del lex[w]
    print(f"lexicon lemmas: {len(lex):,}  form links: {len(form_map):,}", flush=True)
    return lex, form_map


def tidy_gloss(gloss: str) -> str:
    gloss = gloss.strip().rstrip(".")
    gloss = re.sub(r"\s+", " ", gloss)
    apocope = re.match(r"(?i)^(?:apocopic|prepositional) form of [^,]{1,48}, (.+)$", gloss)
    if apocope:
        gloss = apocope.group(1).strip().rstrip(".")
    literal = re.match(r"(?i)^contraction of [^,]+, literally [\"“'](.+?)[\"”']$", gloss)
    if literal:
        gloss = literal.group(1).strip().rstrip(".")
    return gloss


def short_gloss(gloss: str) -> str:
    gloss = tidy_gloss(gloss)
    head = re.sub(r"\s+", " ", gloss.split("(")[0]).strip(" .;")
    if head:
        return head
    inner = re.search(r"\(([^)]+)\)", gloss)
    if inner and inner.group(1).strip():
        return inner.group(1).strip()
    return re.sub(r"[()]", "", gloss).strip(" .;")


def choose_entry(lemma: str, data: dict) -> dict | None:
    poses = {pos: senses for pos, senses in data["poses"].items() if senses}
    if not poses or not data.get("strong"):
        return None
    best_pos = None
    best_key = None
    for pos, senses in poses.items():
        top = max(s["score"] for s in senses)
        weight = POS_WEIGHT.get(pos, 0) + top
        verbish = pos == "verb" and (
            lemma in SHORT_VERBS or re.search(r"(ar|er|ir|ír|aer|eer|uir)$", lemma)
        )
        if verbish and any(s["gloss"].lower().startswith("to ") for s in senses):
            weight += 28
        if any(tidy_gloss(s["gloss"]).lower().startswith("yes") for s in senses):
            weight += 40
        key = (weight, top)
        if best_key is None or key > best_key:
            best_key = key
            best_pos = pos
    if best_pos is None:
        return None
    raw_senses = poses[best_pos]
    primary = [s for s in raw_senses if not s.get("slang")] or raw_senses
    glosses = []
    for sense in primary:
        g = tidy_gloss(sense["gloss"])
        if g and g not in glosses:
            glosses.append(g)
        if len(glosses) == 3:
            break
    for pos, senses in poses.items():
        if pos == best_pos or len(glosses) >= 4:
            break
        alt_senses = [s for s in senses if not s.get("slang")] or senses
        alt = tidy_gloss(alt_senses[0]["gloss"])
        if not alt or len(alt) > 48 or alt in glosses:
            continue
        label = OUT_POS.get(pos, pos)
        glosses.append(f"{alt} ({label})")
        break
    genders = set()
    plural_only = False
    if best_pos == "noun":
        plural_flags = []
        for sense in primary:
            tags = set(sense["tags"] or [])
            if "feminine" in tags:
                genders.add("f")
            if "masculine" in tags:
                genders.add("m")
            if "plural-only" in tags or ("plural" in tags and "singular" not in tags and "plural" in tags):
                if "plural-only" in tags:
                    plural_flags.append(True)
        plural_only = any(
            "plural-only" in set(s["tags"] or []) for s in primary
        )
    gender = None
    article = None
    if best_pos == "noun":
        if genders == {"f", "m"}:
            gender = "mf"
        elif genders == {"f"}:
            gender = "f"
        elif genders == {"m"}:
            gender = "m"
        if plural_only and gender == "f":
            article = "las"
        elif plural_only and gender == "m":
            article = "los"
        elif gender == "f":
            article = "el" if feminine_takes_el(lemma) else "la"
        elif gender == "m":
            article = "el"
        elif gender == "mf":
            article = "el/la"
    senses_out = []
    for g in glosses:
        short = short_gloss(g)
        if short and short not in senses_out:
            senses_out.append(short)
    if not senses_out and glosses:
        senses_out = [short_gloss(glosses[0]) or glosses[0]]
    entry = {
        "id": lemma,
        "lemma": lemma,
        "pos": OUT_POS[best_pos],
        "gloss": "; ".join(glosses),
        "senses": senses_out[:4],
        "gender": gender,
        "article": article,
    }
    if best_pos == "noun" and gender == "f" and article == "el":
        entry["note"] = "Feminine noun; the singular takes el because it begins with a stressed a."
    if data.get("example"):
        entry["example"] = data["example"]
    return entry


def aggregate(rows: list[tuple[str, int]], lex: dict, form_map: dict) -> list[dict]:
    counts: dict[str, int] = defaultdict(int)
    cache: dict[str, list[str]] = {}

    def targets_for(surface: str) -> list[str]:
        if surface in cache:
            return cache[surface]
        linked = [t for t in form_map.get(surface, ()) if t in lex and t != surface]
        own = lex.get(surface)
        strong = bool(own and own.get("strong"))
        if surface in AMBIGUOUS and not strong:
            vals = [t for t in AMBIGUOUS[surface] if t in lex]
            cache[surface] = vals or ([surface] if strong else [])
            return cache[surface]
        if surface in KEEP and strong:
            cache[surface] = [surface]
            return cache[surface]
        if strong:
            cache[surface] = [surface]
            return cache[surface]
        if surface in AMBIGUOUS:
            vals = [t for t in AMBIGUOUS[surface] if t in lex]
            if vals:
                cache[surface] = vals
                return vals
        if linked:
            lem = simplemma.lemmatize(surface, lang="es")
            if lem in linked:
                cache[surface] = [lem]
                return cache[surface]
            uniq: list[str] = []
            for t in linked:
                if t not in uniq:
                    uniq.append(t)
            verbs = [t for t in uniq if re.search(r"(ar|er|ir|ír)$", t)]
            if len(verbs) == 1:
                cache[surface] = verbs
                return verbs
            cache[surface] = uniq[:2]
            return cache[surface]
        lem = simplemma.lemmatize(surface, lang="es")
        if lem in lex and lex[lem].get("strong"):
            cache[surface] = [lem]
            return cache[surface]
        if strong:
            cache[surface] = [surface]
            return cache[surface]
        cache[surface] = []
        return []

    for surface, freq in rows:
        targets = targets_for(surface)
        if not targets:
            continue
        share, rem = divmod(freq, len(targets))
        for i, target in enumerate(targets):
            counts[target] += share + (1 if i < rem else 0)
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    words = []
    for lemma, freq in ranked:
        data = lex.get(lemma)
        if not data:
            continue
        entry = choose_entry(lemma, data)
        if not entry:
            continue
        entry["freq"] = freq
        words.append(entry)
        if len(words) == 5000:
            break
    for i, entry in enumerate(words, start=1):
        entry["rank"] = i
    print(f"words emitted: {len(words):,}", flush=True)
    return words


def phrase_categories() -> list[tuple[str, re.Pattern]]:
    raw = [
        ("emergencies", r"ayuda|socorro|auxilio|emergencia|polic[ií]a|ambulancia|urgencia|incendio|fuego|ladr[oó]n|me robaron|peligro|hospital"),
        ("idioms", r"m[aá]s vale|echar de menos|echar en falta|tomar el pelo|meter la pata|pan comido|llover a c[aá]ntaros|sin pelos|vale la pena|hacerse el|ojal[aá]|a fin de cuentas|en un abrir|dar la lata|costar un ojo|por los codos"),
        ("greetings", r"\bhola\b|buenos d[ií]as|buenas tardes|buenas noches|qu[eé] tal|c[oó]mo est[aá]s|c[oó]mo est[aá]\b|encantad[oa]|mucho gusto|bienvenid[oa]s?|adi[oó]s|hasta luego|hasta pronto|hasta mañana|nos vemos|chao\b|chau\b"),
        ("politeness", r"por favor|gracias|de nada|perd[oó]n|perdone|lo siento|disculp[ae]|con permiso|no hay de qu[eé]"),
        ("restaurant", r"la cuenta|el men[uú]|la carta|el camarero|la camarera|la propina|de postre|para beber|la mesa|est[aá] rico|reservaci[oó]n"),
        ("food", r"tengo hambre|tengo sed|el desayuno|el almuerzo|la cena|la comida|el caf[eé]|la leche|el pan\b|el arroz|la ensalada|el pollo|el pescado|la fruta|el queso|los huevos|la carne"),
        ("shopping", r"cu[aá]nto cuesta|cu[aá]nto vale|la talla|el precio|demasiado caro|en efectivo|la tarjeta|el descuento|me lo llevo|en oferta|la caja|la tienda|el mercado"),
        ("directions", r"d[oó]nde est[aá]|d[oó]nde queda|a la derecha|a la izquierda|todo recto|todo derecho|la esquina|al lado|enfrente|c[oó]mo llego|c[oó]mo voy|estoy perdid[oa]|el mapa"),
        ("transport", r"el tren|el autob[uú]s|el avi[oó]n|el taxi|el metro|la estaci[oó]n|el aeropuerto|el billete|el boleto|el vuelo|la parada|el and[eé]n"),
        ("travel", r"el pasaporte|la maleta|el equipaje|la aduana|el viaje|de vacaciones|la frontera|el turista|facturar"),
        ("hotel", r"la habitaci[oó]n|la recepci[oó]n|la llave|el hotel|la toalla|la reserva"),
        ("health", r"me duele|el m[eé]dico|la farmacia|enferm[oa]|la fiebre|la medicina|el dolor|la cita|me siento mal"),
        ("work", r"el trabajo|la oficina|el jefe|la reuni[oó]n|el salario|el sueldo|el empleo|la empresa|estoy ocupad[oa]"),
        ("study", r"la escuela|el colegio|la universidad|el examen|la tarea|la clase|el profesor|la profesora|estudiar|el libro"),
        ("time", r"qu[eé] hora|a qu[eé] hora|en punto|por la mañana|por la tarde|por la noche|el lunes|el martes|el mi[eé]rcoles|el jueves|el viernes|el s[aá]bado|el domingo|mediod[ií]a|la semana que viene"),
        ("weather", r"hace fr[ií]o|hace calor|hace sol|est[aá] lloviendo|llueve|el clima|buen tiempo|mal tiempo|nieva|est[aá] nublado"),
        ("feelings", r"estoy feliz|estoy triste|estoy cansad[oa]|tengo miedo|me siento|te quiero|te amo|me encanta|me alegro|qu[eé] pena|tengo ganas|me da igual|estoy preocupad[oa]|tengo sue[nñ]o|tengo prisa"),
        ("opinions", r"creo que|me parece|en mi opini[oó]n|pienso que|estoy de acuerdo|no estoy de acuerdo|tal vez|quiz[aá]s|puede ser|claro que"),
        ("phone", r"el tel[eé]fono|ll[aá]mame|te llamo|el mensaje|el celular|el m[oó]vil|el n[uú]mero"),
        ("money", r"el dinero|el euro|el peso|el d[oó]lar|el banco|el cajero|la cuenta bancaria|el cambio"),
        ("home", r"el apartamento|la cocina|el ba[nñ]o|la puerta|la ventana|el vecino|alquilar|en casa"),
        ("plans", r"vamos a|quisiera|me gustar[ií]a|tengo que|hay que|voy a|esta noche|quedamos en"),
        ("introductions", r"me llamo|mi nombre es|cu[aá]ntos a[nñ]os|de d[oó]nde eres|de d[oó]nde es|soy de"),
        ("smalltalk", r"c[oó]mo te va|qu[eé] haces|qu[eé] pasa|cu[aá]nto tiempo|a qu[eé] te dedicas|el fin de semana"),
        ("questions", r"^[¿]?d[oó]nde |^[¿]?cu[aá]ndo |^[¿]?cu[aá]nto |^[¿]?por qu[eé] |^[¿]?cu[aá]l |^[¿]?c[oó]mo |^[¿]?qu[eé] "),
    ]
    return [(name, re.compile(pat, re.I)) for name, pat in raw]


CATS = None


def categorize(text: str) -> str:
    global CATS
    if CATS is None:
        CATS = phrase_categories()
    low = text.lower()
    for name, pat in CATS:
        if pat.search(low):
            return name
    return "everyday"


def load_phrases(rank_of: dict[str, int]) -> list[dict]:
    print("loading Spanish sentences…", flush=True)
    spa: dict[int, dict] = {}
    with bz2.open(RAW / "spa_sentences_detailed.tsv.bz2", "rt", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 3 or parts[1] != "spa":
                continue
            try:
                sid = int(parts[0])
            except ValueError:
                continue
            text = parts[2].strip()
            user = parts[3] if len(parts) > 3 and parts[3] not in {"\\N", ""} else ""
            if not phrase_ok(text):
                continue
            spa[sid] = {"es": text, "by": user, "norm": normalize_phrase(text)}
    print(f"  short Spanish sentences: {len(spa):,}", flush=True)

    print("scanning Tatoeba links…", flush=True)
    links: dict[int, list[int]] = defaultdict(list)
    with tarfile.open(RAW / "links.tar.bz2", "r:bz2") as archive:
        handle = archive.extractfile("links.csv")
        if handle is None:
            raise SystemExit("links.csv missing from archive")
        for raw in handle:
            line = raw.decode("utf-8", "replace").strip()
            if not line or "\t" not in line:
                continue
            a, b = line.split("\t", 1)
            try:
                ia, ib = int(a), int(b)
            except ValueError:
                continue
            if ia in spa and len(links[ia]) < 6:
                links[ia].append(ib)
            elif ib in spa and len(links[ib]) < 6:
                links[ib].append(ia)
    needed = {eid for ids in links.values() for eid in ids}
    print(f"  linked sentences: {len(links):,}  candidate English ids: {len(needed):,}", flush=True)

    print("loading English translations…", flush=True)
    eng: dict[int, str] = {}
    with bz2.open(RAW / "eng_sentences.tsv.bz2", "rt", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 3:
                continue
            try:
                eid = int(parts[0])
            except ValueError:
                continue
            if eid not in needed:
                continue
            eng[eid] = parts[2].strip()
    print(f"  English matches: {len(eng):,}", flush=True)

    lem_cache: dict[str, str] = {}

    def lemma(token: str) -> str:
        token = token.lower()
        if token not in lem_cache:
            lem_cache[token] = simplemma.lemmatize(token, lang="es")
        return lem_cache[token]

    best_by_norm: dict[str, dict] = {}
    for sid, row in spa.items():
        translations = [eng[i] for i in links.get(sid, []) if i in eng and phrase_ok_en(eng[i])]
        if not translations:
            continue
        en = min(translations, key=lambda s: (abs(len(TOKEN_RE.findall(s)) - len(TOKEN_RE.findall(row["es"]))), len(s)))
        if BAD_PHRASE.search(row["es"]) or BAD_PHRASE.search(en):
            continue
        toks = TOKEN_RE.findall(row["es"].lower())
        ranks = []
        common = False
        for tok in toks:
            r = rank_of.get(lemma(tok)) or rank_of.get(tok)
            if r:
                ranks.append(r)
                if r <= 2000:
                    common = True
            else:
                ranks.append(12000)
        if not common:
            continue
        avg = sum(ranks) / len(ranks)
        score = 14000 - avg - len(toks) * 40
        if "?" in row["es"] or "¿" in row["es"]:
            score += 25
        cand = {
            "id": f"p{sid}",
            "es": row["es"],
            "en": en,
            "category": categorize(row["es"]),
            "tatoeba": sid,
            "score": score,
            "norm": row["norm"],
        }
        if row["by"]:
            cand["by"] = row["by"]
        prev = best_by_norm.get(row["norm"])
        if prev is None or cand["score"] > prev["score"]:
            best_by_norm[row["norm"]] = cand
    pool = list(best_by_norm.values())
    print(f"  unique phrase candidates: {len(pool):,}", flush=True)
    buckets: dict[str, list] = defaultdict(list)
    for cand in pool:
        buckets[cand["category"]].append(cand)
    for items in buckets.values():
        items.sort(key=lambda c: -c["score"])
    order = [
        "greetings", "politeness", "introductions", "smalltalk", "feelings",
        "questions", "time", "weather", "directions", "transport", "travel",
        "hotel", "food", "restaurant", "shopping", "money", "home", "work",
        "study", "health", "emergencies", "phone", "opinions", "plans",
        "idioms", "everyday",
    ]
    picked: list[dict] = []
    seen: set[str] = set()
    idx = {name: 0 for name in order}
    counts = {name: 0 for name in order}
    cap = 160

    def take(name: str, limit: int | None) -> bool:
        items = buckets.get(name) or []
        i = idx[name]
        while i < len(items):
            cand = items[i]
            i += 1
            if cand["norm"] in seen:
                continue
            if limit is not None and counts[name] >= limit:
                idx[name] = i
                return False
            seen.add(cand["norm"])
            counts[name] += 1
            item = {k: v for k, v in cand.items() if k not in {"score", "norm"}}
            picked.append(item)
            idx[name] = i
            return True
        idx[name] = i
        return False

    while len(picked) < 2000:
        progressed = False
        for name in order:
            if take(name, cap):
                progressed = True
            if len(picked) >= 2000:
                break
        if not progressed:
            break
    if len(picked) < 2000:
        rest = sorted(pool, key=lambda c: -c["score"])
        for cand in rest:
            if cand["norm"] in seen:
                continue
            seen.add(cand["norm"])
            picked.append({k: v for k, v in cand.items() if k not in {"score", "norm"}})
            if len(picked) >= 2000:
                break
    print("  phrase categories:", {k: v for k, v in counts.items() if v}, flush=True)
    print(f"phrases emitted: {len(picked):,}", flush=True)
    return picked


def phrase_ok(text: str) -> bool:
    if not text or any(ch in text for ch in "[]{}<>|@#*_=\\/"):
        return False
    words = TOKEN_RE.findall(text)
    if not (2 <= len(words) <= 10):
        return False
    letters = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]", text)
    if len(letters) < 4:
        return False
    raw = text.split()
    caps = 0
    for i, word in enumerate(raw):
        if i == 0:
            continue
        if word[:1].isupper() and word.lower() not in {"i"}:
            caps += 1
    return caps < 2


def phrase_ok_en(text: str) -> bool:
    words = TOKEN_RE.findall(text)
    return 2 <= len(words) <= 14 and "http" not in text.lower() and "[" not in text


def normalize_phrase(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[¿?¡!.,;:\"“”«»()—\-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    self_test_articles()
    for name in URLS:
        download(name)
    rows, surfaces = load_frequency()
    lex, form_map = load_lexicon(surfaces)
    words = aggregate(rows, lex, form_map)
    if len(words) < 5000:
        print(f"WARNING: only {len(words)} glossed lemmas", file=sys.stderr)
    rank_of = {w["lemma"]: w["rank"] for w in words}
    # also let phrase scoring see lemmas that lost the top-5000 cut by using freq order
    # rank_of only has the deck; simplemma hits outside it fall back to 12000. Fine.
    del lex, form_map
    phrases = load_phrases(rank_of)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "words.json").write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "phrases.json").write_text(json.dumps(phrases, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    pos_counts: dict[str, int] = defaultdict(int)
    examples = 0
    gendered = 0
    for word in words:
        pos_counts[word["pos"]] += 1
        if word.get("example"):
            examples += 1
        if word.get("gender"):
            gendered += 1
    cat_counts: dict[str, int] = defaultdict(int)
    for phrase in phrases:
        cat_counts[phrase["category"]] += 1
    meta = {
        "name": "Raíz",
        "wordCount": len(words),
        "phraseCount": len(phrases),
        "withExample": examples,
        "nounsWithGender": gendered,
        "posCounts": dict(pos_counts),
        "phraseCategories": dict(cat_counts),
        "topLemmas": [w["lemma"] for w in words[:40]],
        "filters": [
            "Surface counts come from OpenSubtitles 2018 via FrequencyWords es_full.txt.",
            "Inflected forms were summed onto a Wiktionary lemma using form-of links and listed inflections, with simplemma as a fallback.",
            "Shared ser/ir forms (fui, fue, fueron, and the matching -ra/-se forms) were split evenly. Other ambiguous strings stay with a headword when Wiktionary gives that string its own gloss.",
            "Closed-class words such as el, la, se, and hay stay as their own cards.",
            "Proper names, letter names, misspellings, and tokens with no English gloss were removed before ranking.",
            "Rank 1 is the most frequent remaining lemma. Ranks are this order, not a hand-made list.",
            "Example sentences inside words.json are English Wiktionary usage examples (CC BY-SA). Phrase cards are Tatoeba (CC BY 2.0 FR).",
        ],
        "sources": [
            {
                "name": "FrequencyWords Spanish list (OpenSubtitles 2018)",
                "url": "https://github.com/hermitdave/FrequencyWords",
                "license": "CC BY-SA 4.0",
                "note": "Content license. Counts are subtitle tokens from OPUS OpenSubtitles 2018.",
            },
            {
                "name": "English Wiktionary Spanish entries via kaikki.org",
                "url": "https://kaikki.org/dictionary/Spanish/",
                "license": "CC BY-SA 3.0 (Wiktionary) / GFDL",
                "note": "Glosses, part of speech, gender, and word examples. Lemmatization also uses Wiktionary inflection tables. simplemma (MIT code) is only a fallback lemmatizer.",
            },
            {
                "name": "Tatoeba",
                "url": "https://tatoeba.org",
                "license": "CC BY 2.0 FR",
                "note": "Phrase deck. Each card keeps its Tatoeba sentence id and contributor name when the export included one.",
            },
        ],
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: meta[k] for k in ("wordCount", "phraseCount", "withExample", "posCounts", "topLemmas")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
