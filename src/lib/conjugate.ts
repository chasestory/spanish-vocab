/** Spanish conjugation for Raíz.

Regular -ar/-er/-ir verbs, orthographic changes, stem changes, and the
irregular families are generated from stems and endings. Suppletive verbs
(ser, ir) and a handful of accent patterns are tables because the forms
do not share a stem. Imperfect and future subjunctive are built from the
ellos preterite. Perfect tenses are haber plus the past participle.
*/

export const PERSONS = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"] as const;
export type Person = (typeof PERSONS)[number];
export const IMPERATIVE_PERSONS = ["tu", "el", "nosotros", "vosotros", "ellos"] as const;
export type ImperativePerson = (typeof IMPERATIVE_PERSONS)[number];

export type FiniteTense =
  | "present"
  | "preterite"
  | "imperfect"
  | "future"
  | "conditional"
  | "presentSubjunctive"
  | "imperfectSubjunctive"
  | "futureSubjunctive";

export type PerfectTense =
  | "presentPerfect"
  | "pluperfect"
  | "futurePerfect"
  | "conditionalPerfect"
  | "presentPerfectSubjunctive"
  | "pluperfectSubjunctive";

export type Tense = FiniteTense | "imperative";

export type VerbKind = "regular" | "spelling" | "stem" | "irregular";
export type StemChange = "e-ie" | "o-ue" | "e-i" | "u-ue" | "i-ie";
type Cls = "ar" | "er" | "ir";
type Six = [string, string, string, string, string, string];

export interface CellMarks {
  present: Record<Person, boolean>;
  preterite: Record<Person, boolean>;
  imperfect: Record<Person, boolean>;
  future: Record<Person, boolean>;
  conditional: Record<Person, boolean>;
  presentSubjunctive: Record<Person, boolean>;
  imperfectSubjunctive: Record<Person, boolean>;
  futureSubjunctive: Record<Person, boolean>;
  presentPerfect: Record<Person, boolean>;
  pluperfect: Record<Person, boolean>;
  futurePerfect: Record<Person, boolean>;
  conditionalPerfect: Record<Person, boolean>;
  presentPerfectSubjunctive: Record<Person, boolean>;
  pluperfectSubjunctive: Record<Person, boolean>;
  imperative: Record<ImperativePerson, boolean>;
  imperativeNegative: Record<ImperativePerson, boolean>;
  gerund: boolean;
  participle: boolean;
}

export interface Paradigm {
  infinitive: string;
  reflexive: boolean;
  kind: VerbKind;
  stemChange: StemChange | null;
  gerund: string;
  participle: string;
  present: Record<Person, string>;
  preterite: Record<Person, string>;
  imperfect: Record<Person, string>;
  future: Record<Person, string>;
  conditional: Record<Person, string>;
  presentSubjunctive: Record<Person, string>;
  imperfectSubjunctive: Record<Person, string>;
  futureSubjunctive: Record<Person, string>;
  presentPerfect: Record<Person, string>;
  pluperfect: Record<Person, string>;
  futurePerfect: Record<Person, string>;
  conditionalPerfect: Record<Person, string>;
  presentPerfectSubjunctive: Record<Person, string>;
  pluperfectSubjunctive: Record<Person, string>;
  imperative: Record<ImperativePerson, string>;
  imperativeNegative: Record<ImperativePerson, string>;
  marks: CellMarks;
  note?: string;
}

interface Profile {
  yo?: string;
  present?: Six;
  preterite?: Six;
  preteriteStem?: string;
  preteriteKind?: "i" | "j";
  preteriteEl?: string;
  imperfect?: Six;
  futureStem?: string;
  subjunctive?: Six;
  subjStem?: string;
  imperativeTu?: string;
  participle?: string;
  gerund?: string;
  stemChange?: StemChange;
  note?: string;
}

const PRESENT: Record<Cls, Six> = {
  ar: ["o", "as", "a", "amos", "áis", "an"],
  er: ["o", "es", "e", "emos", "éis", "en"],
  ir: ["o", "es", "e", "imos", "ís", "en"],
};
const PRETERITE: Record<Cls, Six> = {
  ar: ["é", "aste", "ó", "amos", "asteis", "aron"],
  er: ["í", "iste", "ió", "imos", "isteis", "ieron"],
  ir: ["í", "iste", "ió", "imos", "isteis", "ieron"],
};
const IMPERFECT: Record<Cls, Six> = {
  ar: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
  er: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  ir: ["ía", "ías", "ía", "íamos", "íais", "ían"],
};
const FUTURE: Six = ["é", "ás", "á", "emos", "éis", "án"];
const CONDITIONAL: Six = ["ía", "ías", "ía", "íamos", "íais", "ían"];
const SUBJUNCTIVE: Record<Cls, Six> = {
  ar: ["e", "es", "e", "emos", "éis", "en"],
  er: ["a", "as", "a", "amos", "áis", "an"],
  ir: ["a", "as", "a", "amos", "áis", "an"],
};

const BOOT = new Set([0, 1, 2, 5]);

function six(forms: Six): Record<Person, string> {
  return {
    yo: forms[0],
    tu: forms[1],
    el: forms[2],
    nosotros: forms[3],
    vosotros: forms[4],
    ellos: forms[5],
  };
}

function stripAccent(value: string): string {
  return value.normalize("NFD").replace(/\u0301/g, "").normalize("NFC");
}

function verbClass(inf: string): Cls | null {
  if (inf.endsWith("ar")) return "ar";
  if (inf.endsWith("ír") || inf.endsWith("ir") || inf.endsWith("eír")) return "ir";
  if (inf.endsWith("aer") || inf.endsWith("eer") || inf.endsWith("er")) return "er";
  return null;
}

function isInfinitive(inf: string): boolean {
  return verbClass(inf) !== null || inf === "ir";
}

export function stripReflexive(inf: string): { infinitive: string; reflexive: boolean } {
  const lower = inf.trim().toLowerCase();
  if (lower.endsWith("se")) {
    const base = lower.slice(0, -2);
    if (isInfinitive(base)) return { infinitive: base, reflexive: true };
  }
  return { infinitive: lower, reflexive: false };
}

function changeStem(stem: string, kind: StemChange): string {
  if (kind === "e-ie" || kind === "e-i") {
    const i = stem.lastIndexOf("e");
    if (i < 0) return stem;
    return stem.slice(0, i) + (kind === "e-ie" ? "ie" : "i") + stem.slice(i + 1);
  }
  if (kind === "o-ue") {
    const i = stem.lastIndexOf("o");
    if (i < 0) return stem;
    return stem.slice(0, i) + "ue" + stem.slice(i + 1);
  }
  if (kind === "u-ue") {
    const i = stem.lastIndexOf("u");
    if (i < 0) return stem;
    return stem.slice(0, i) + "ue" + stem.slice(i + 1);
  }
  const i = stem.lastIndexOf("i");
  if (i < 0) return stem;
  return stem.slice(0, i) + "ie" + stem.slice(i + 1);
}

function weakStem(stem: string, kind: StemChange): string {
  if (kind === "e-ie" || kind === "e-i") {
    const i = stem.lastIndexOf("e");
    if (i < 0) return stem;
    return stem.slice(0, i) + "i" + stem.slice(i + 1);
  }
  if (kind === "o-ue") {
    const i = stem.lastIndexOf("o");
    if (i < 0) return stem;
    return stem.slice(0, i) + "u" + stem.slice(i + 1);
  }
  return stem;
}

function isUir(inf: string): boolean {
  return inf.endsWith("uir") && !inf.endsWith("guir") && !inf.endsWith("güir");
}

function usesYPreterite(inf: string): boolean {
  if (inf.endsWith("traer")) return false;
  return inf.endsWith("aer") || inf.endsWith("eer") || inf.endsWith("oír") || inf.endsWith("ír");
}

const Z_NOT_ZC = new Set([
  "cocer", "escocer", "recocer", "mecer", "remecer", "hacer", "decir",
  "satisfacer", "yacer", "placer", "rehacer", "deshacer",
]);

function isZc(inf: string): boolean {
  if (!/(?:cer|cir)$/.test(inf)) return false;
  if ([...Z_NOT_ZC].some((base) => inf === base || inf.endsWith(base))) return false;
  const before = inf.slice(-4, -3);
  return "aeiouáéíóúü".includes(before);
}

function joinStem(inf: string, stem: string, ending: string): string {
  const e0 = ending[0] ?? "";
  if ((isUir(inf) || usesYPreterite(inf)) && ending === "ió") return `${stem}yó`;
  if ((isUir(inf) || usesYPreterite(inf)) && ending === "ieron") return `${stem}yeron`;
  if (isUir(inf) && !ending.startsWith("i") && !ending.startsWith("í")) return `${stem}y${ending}`;
  if (inf.endsWith("guar") && (e0 === "e" || e0 === "é") && stem.endsWith("gu")) {
    return `${stem.slice(0, -1)}ü${ending}`;
  }
  if (inf.endsWith("car") && (e0 === "e" || e0 === "é") && stem.endsWith("c")) {
    return `${stem.slice(0, -1)}qu${ending}`;
  }
  if (inf.endsWith("gar") && !inf.endsWith("guar") && (e0 === "e" || e0 === "é") && stem.endsWith("g")) {
    return `${stem}u${ending}`;
  }
  if ((e0 === "e" || e0 === "é") && stem.endsWith("z")) return `${stem.slice(0, -1)}c${ending}`;
  if (
    (e0 === "o" || e0 === "a" || e0 === "á") &&
    (inf.endsWith("ger") || inf.endsWith("gir")) &&
    !inf.endsWith("guir") &&
    stem.endsWith("g")
  ) {
    return `${stem.slice(0, -1)}j${ending}`;
  }
  if (inf.endsWith("guir") && (e0 === "o" || e0 === "a" || e0 === "á") && stem.endsWith("gu")) {
    return `${stem.slice(0, -1)}${ending}`;
  }
  if ((e0 === "o" || e0 === "a" || e0 === "á") && (inf.endsWith("cer") || inf.endsWith("cir")) && stem.endsWith("c")) {
    const before = stem.slice(-2, -1);
    const vowel = "aeiouáéíóúü".includes(before);
    const exception = [...Z_NOT_ZC].some((base) => inf === base || inf.endsWith(base));
    if (!vowel || exception) return `${stem.slice(0, -1)}z${ending}`;
    return `${stem.slice(0, -1)}zc${ending}`;
  }
  return stem + ending;
}

function bootAdjust(inf: string, changed: string): string {
  if (inf === "oler" && changed.startsWith("ue")) return `h${changed}`;
  if (inf === "errar" && changed.startsWith("ie")) return `y${changed.slice(1)}`;
  return changed;
}

function accentStem(stem: string, vowel: "i" | "u"): string {
  const i = stem.lastIndexOf(vowel);
  if (i < 0) return stem;
  const marked = vowel === "i" ? "í" : "ú";
  return stem.slice(0, i) + marked + stem.slice(i + 1);
}

const E_IE = new Set(`pensar acertar alentar apretar atravesar calentar cegar cerrar comenzar concertar confesar despertar empezar encerrar encomendar enterrar fregar gobernar helar manifestar merendar negar nevar plegar quebrar recomendar regar reventar segar sembrar sentar serrar sosegar temblar tentar tropezar desalentar desconcertar empedrar escarmentar remendar restregar cimentar
ascender atender defender descender encender entender extender perder tender verter trascender
advertir convertir discernir divertir herir hervir mentir preferir referir sentir sugerir arrepentir consentir presentir requerir transferir diferir conferir ingerir digerir hendir concernir invertir pervertir revertir cernir errar`.split(/\s+/));

const O_UE = new Set(`acordar acostar almorzar apostar aprobar avergonzar cocer colar colgar comprobar conmover consolar contar costar demostrar devolver disolver doler encontrar envolver forzar moler morder mostrar mover probar recordar remover renovar resolver resonar rodar rogar soler sonar soñar torcer tostar volar volver absolver demoler desenvolver promover llover tronar soldar soltar volcar degollar poblar esforzar reforzar remorder revolver descontar recostar concordar discordar denostar despoblar engrosar hollar poder dormir morir oler`.split(/\s+/));

const E_I = new Set(`pedir servir repetir seguir conseguir perseguir proseguir vestir elegir medir impedir competir corregir derretir despedir gemir rendir teñir ceñir reñir concebir desvestir colegir regir embestir decir bendecir maldecir`.split(/\s+/));

const ACCENT_I = new Set("enviar confiar criar espiar fiar guiar vaciar variar desviar aliar ampliar fotografiar resfriar ataviar extraviar porfiar telegrafiar ansiar esquiar".split(" "));
const ACCENT_U = new Set("actuar continuar graduar habituar situar evaluar exceptuar acentuar efectuar puntuar atenuar insinuar evacuar fluctuar perpetuar reunir".split(" "));

function stemChangeOf(inf: string, profile?: Profile): StemChange | null {
  if (profile?.stemChange) return profile.stemChange;
  if (E_IE.has(inf)) return "e-ie";
  if (O_UE.has(inf)) return "o-ue";
  if (E_I.has(inf)) return "e-i";
  if (inf === "jugar") return "u-ue";
  if (inf === "adquirir") return "i-ie";
  return null;
}

function accentOf(inf: string): "i" | "u" | null {
  if (ACCENT_I.has(inf) || [...ACCENT_I].some((base) => inf.endsWith(base) && inf !== base)) return "i";
  if (ACCENT_U.has(inf) || inf.endsWith("reunir")) return "u";
  return null;
}

function applyPersonStem(inf: string, stem: string, kind: StemChange | null, index: number, accent: "i" | "u" | null, weak: boolean): string {
  let next = stem;
  if (kind && (BOOT.has(index) || weak)) {
    const bootDip = BOOT.has(index) && kind !== "e-i";
    next = bootDip ? changeStem(stem, kind) : weak ? weakStem(stem, kind) : changeStem(stem, kind);
    if (BOOT.has(index)) next = bootAdjust(inf, next);
  }
  if (accent && BOOT.has(index)) next = accentStem(next, accent);
  return next;
}

const PROFILES: Record<string, Profile> = {
  estar: {
    present: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    preteriteStem: "estuv",
    subjunctive: ["esté", "estés", "esté", "estemos", "estéis", "estén"],
  },
  haber: {
    present: ["he", "has", "ha", "hemos", "habéis", "han"],
    preteriteStem: "hub",
    futureStem: "habr",
    subjStem: "hay",
    participle: "habido",
    note: "Impersonal present: hay (there is, there are).",
  },
  tener: {
    stemChange: "e-ie",
    yo: "tengo",
    preteriteStem: "tuv",
    futureStem: "tendr",
    subjStem: "teng",
    imperativeTu: "ten",
  },
  poner: {
    yo: "pongo",
    preteriteStem: "pus",
    futureStem: "pondr",
    subjStem: "pong",
    imperativeTu: "pon",
    participle: "puesto",
  },
  venir: {
    stemChange: "e-ie",
    yo: "vengo",
    preteriteStem: "vin",
    futureStem: "vendr",
    subjStem: "veng",
    imperativeTu: "ven",
  },
  hacer: {
    yo: "hago",
    preteriteStem: "hic",
    preteriteEl: "hizo",
    futureStem: "har",
    subjStem: "hag",
    imperativeTu: "haz",
    participle: "hecho",
  },
  decir: {
    stemChange: "e-i",
    yo: "digo",
    preteriteStem: "dij",
    preteriteKind: "j",
    futureStem: "dir",
    subjStem: "dig",
    imperativeTu: "di",
    participle: "dicho",
  },
  poder: {
    stemChange: "o-ue",
    preteriteStem: "pud",
    futureStem: "podr",
    gerund: "pudiendo",
  },
  querer: {
    stemChange: "e-ie",
    preteriteStem: "quis",
    futureStem: "querr",
  },
  saber: {
    yo: "sé",
    preteriteStem: "sup",
    futureStem: "sabr",
    subjStem: "sep",
  },
  caber: {
    yo: "quepo",
    preteriteStem: "cup",
    futureStem: "cabr",
    subjStem: "quep",
  },
  salir: {
    yo: "salgo",
    futureStem: "saldr",
    subjStem: "salg",
    imperativeTu: "sal",
  },
  valer: {
    yo: "valgo",
    futureStem: "valdr",
    subjStem: "valg",
    imperativeTu: "val",
  },
  traer: {
    yo: "traigo",
    preteriteStem: "traj",
    preteriteKind: "j",
    subjStem: "traig",
    gerund: "trayendo",
  },
  caer: {
    yo: "caigo",
    subjStem: "caig",
  },
  andar: { preteriteStem: "anduv" },
  dar: {
    present: ["doy", "das", "da", "damos", "dais", "dan"],
    preterite: ["di", "diste", "dio", "dimos", "disteis", "dieron"],
    subjunctive: ["dé", "des", "dé", "demos", "deis", "den"],
  },
  ver: {
    present: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    preterite: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    imperfect: ["veía", "veías", "veía", "veíamos", "veíais", "veían"],
    subjStem: "ve",
    participle: "visto",
  },
  oír: {
    present: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
    subjStem: "oig",
  },
  satisfacer: {
    yo: "satisfago",
    preteriteStem: "satisfic",
    preteriteEl: "satisfizo",
    futureStem: "satisfar",
    subjStem: "satisfag",
    imperativeTu: "satisfaz",
    participle: "satisfecho",
  },
};

const COMPOUND_BASES = ["satisfacer", "tener", "poner", "venir", "hacer", "decir", "traer", "caer", "salir", "valer", "andar", "poder", "querer"];
const PREFIXES = new Set("a ab abs ante anti at auto ben co com con contra de des dis e em en entre equi ex extra im in inter intro mal man o ob per pos pre pro re retro sobre sos su sub super sus trans tras".split(" "));

function prefixAllowed(prefix: string): boolean {
  if (PREFIXES.has(prefix)) return true;
  if (prefix.startsWith("des") && PREFIXES.has(prefix.slice(3))) return true;
  if (prefix.startsWith("re") && PREFIXES.has(prefix.slice(2))) return true;
  return false;
}

function splitCompound(inf: string): { prefix: string; base: string } {
  if (PROFILES[inf] && inf !== "decir" && inf !== "hacer") {
    // exact profiles win, except decir/hacer which are also bases
  }
  const bases = [...COMPOUND_BASES].sort((a, b) => b.length - a.length);
  for (const base of bases) {
    if (inf === base) return { prefix: "", base };
    if (inf.endsWith(base) && inf.length > base.length) {
      const prefix = inf.slice(0, inf.length - base.length);
      if (prefixAllowed(prefix)) return { prefix, base };
    }
  }
  return { prefix: "", base: inf };
}

function mapSix(forms: Six, fn: (form: string, index: number) => string): Six {
  return forms.map((form, index) => fn(form, index)) as Six;
}

function buildForms(inf: string, profile: Profile | undefined): {
  present: Six;
  preterite: Six;
  imperfect: Six;
  future: Six;
  conditional: Six;
  subjunctive: Six;
  gerund: string;
  participle: string;
  imperativeTu: string;
  stemChange: StemChange | null;
} {
  const cls = verbClass(inf);
  if (!cls) throw new Error(`not an infinitive: ${inf}`);
  const stem = inf.endsWith("ír") ? inf.slice(0, -2) : inf.slice(0, -2);
  const kind = stemChangeOf(inf, profile);
  const accent = accentOf(inf);
  const weakIr = cls === "ir" && (kind === "e-ie" || kind === "e-i" || kind === "o-ue");

  const present: Six = profile?.present
    ? profile.present
    : (PRESENT[cls].map((ending, index) => {
        if (index === 0 && profile?.yo) return profile.yo;
        const personStem = applyPersonStem(inf, stem, kind, index, accent, false);
        return joinStem(inf, personStem, ending);
      }) as Six);

  let preterite: Six;
  if (profile?.preterite) preterite = profile.preterite;
  else if (profile?.preteriteStem) {
    const j = profile.preteriteKind === "j";
    const ends: Six = j
      ? ["e", "iste", "o", "imos", "isteis", "eron"]
      : ["e", "iste", "o", "imos", "isteis", "ieron"];
    preterite = ends.map((ending) => profile.preteriteStem + ending) as Six;
    if (profile.preteriteEl) preterite[2] = profile.preteriteEl;
  } else if (inf.endsWith("ducir")) {
    const duc = `${inf.slice(0, -5)}duj`;
    preterite = ["e", "iste", "o", "imos", "isteis", "eron"].map((ending) => duc + ending) as Six;
  } else {
    preterite = PRETERITE[cls].map((ending, index) => {
      const third = index === 2 || index === 5;
      const personStem = weakIr && third && kind ? weakStem(stem, kind) : stem;
      let end = ending;
      // leíste, oíste, caímos: a hiatus needs an accent. construiste does not.
      if (/[aeoáéó]$/.test(personStem) && (end === "iste" || end === "imos" || end === "isteis")) {
        end = `í${end.slice(1)}`;
      }
      return joinStem(inf, personStem, end);
    }) as Six;
  }

  const imperfect: Six = profile?.imperfect
    ? profile.imperfect
    : (IMPERFECT[cls].map((ending) => stem + ending) as Six);

  const futureBase = profile?.futureStem ?? stripAccent(inf);
  const future = FUTURE.map((ending) => futureBase + ending) as Six;
  const conditional = CONDITIONAL.map((ending) => futureBase + ending) as Six;

  let subjunctive: Six;
  if (profile?.subjunctive) subjunctive = profile.subjunctive;
  else if (profile?.subjStem) {
    subjunctive = SUBJUNCTIVE[cls].map((ending) => joinStem(inf, profile.subjStem as string, ending)) as Six;
  } else {
    subjunctive = SUBJUNCTIVE[cls].map((ending, index) => {
      const useWeak = weakIr && kind !== null;
      const personStem = applyPersonStem(inf, stem, kind, index, accent, useWeak && !BOOT.has(index));
      const dipped = applyPersonStem(inf, stem, kind, index, accent, false);
      const chosen = useWeak && !BOOT.has(index) ? personStem : dipped;
      return joinStem(inf, chosen, ending);
    }) as Six;
  }

  let gerund = profile?.gerund;
  if (!gerund) {
    if (cls === "ar") gerund = `${stem}ando`;
    else if (inf.endsWith("eír")) gerund = `${inf.slice(0, -3)}iendo`;
    else if (isUir(inf) || usesYPreterite(inf) || inf.endsWith("traer")) gerund = `${stem}yendo`;
    else if (weakIr && kind) gerund = `${weakStem(stem, kind)}iendo`;
    else gerund = `${stem}iendo`;
  }

  let participle = profile?.participle;
  if (!participle) {
    if (inf.endsWith("poner")) participle = `${inf.slice(0, -5)}puesto`;
    else if (inf.endsWith("hacer")) participle = `${inf.slice(0, -5)}hecho`;
    else if (inf.endsWith("decir") && inf !== "bendecir" && inf !== "maldecir") participle = `${inf.slice(0, -5)}dicho`;
    else if (inf.endsWith("volver")) participle = `${inf.slice(0, -6)}vuelto`;
    else if (inf.endsWith("solver")) participle = `${inf.slice(0, -6)}suelto`;
    else if (inf.endsWith("escribir")) participle = `${inf.slice(0, -8)}escrito`;
    else if (inf.endsWith("abrir")) participle = `${inf.slice(0, -5)}abierto`;
    else if (inf.endsWith("cubrir")) participle = `${inf.slice(0, -6)}cubierto`;
    else if (inf === "morir") participle = "muerto";
    else if (inf === "romper") participle = "roto";
    else if (inf.endsWith("freír")) participle = `${inf.slice(0, -5)}frito`;
    else participle = cls === "ar" ? `${stem}ado` : `${stem}ido`;
  }

  return {
    present,
    preterite,
    imperfect,
    future,
    conditional,
    subjunctive,
    gerund,
    participle,
    imperativeTu: profile?.imperativeTu ?? present[2],
    stemChange: kind,
  };
}

function prefixForm(prefix: string, form: string): string {
  return prefix ? prefix + form : form;
}

function fixShortImperative(prefix: string, tu: string): string {
  if (!prefix) return tu;
  const accented: Record<string, string> = { ten: "tén", ven: "vén", pon: "pón" };
  for (const [plain, marked] of Object.entries(accented)) {
    if (tu === `${prefix}${plain}`) return `${prefix}${marked}`;
  }
  return tu;
}

const AUX: Record<PerfectTense, Six> = {
  presentPerfect: ["he", "has", "ha", "hemos", "habéis", "han"],
  pluperfect: ["había", "habías", "había", "habíamos", "habíais", "habían"],
  futurePerfect: ["habré", "habrás", "habrá", "habremos", "habréis", "habrán"],
  conditionalPerfect: ["habría", "habrías", "habría", "habríamos", "habríais", "habrían"],
  presentPerfectSubjunctive: ["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"],
  pluperfectSubjunctive: ["hubiera", "hubieras", "hubiera", "hubiéramos", "hubierais", "hubieran"],
};

function accentLastVowel(stem: string): string {
  const marked: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
  for (let i = stem.length - 1; i >= 0; i -= 1) {
    const ch = stem[i] ?? "";
    const base = ch.normalize("NFD").replace(/\u0301/g, "");
    if (base.length === 1 && "aeiou".includes(base)) {
      if ("áéíóú".includes(ch)) return stem;
      return stem.slice(0, i) + marked[base] + stem.slice(i + 1);
    }
  }
  return stem;
}

function fromEllos(ellos: string, kind: "ra" | "re"): Six {
  const stem = ellos.endsWith("ron") ? ellos.slice(0, -3) : ellos;
  const nosotros = accentLastVowel(stem) + (kind === "ra" ? "ramos" : "remos");
  if (kind === "ra") return [stem + "ra", stem + "ras", stem + "ra", nosotros, stem + "rais", stem + "ran"];
  return [stem + "re", stem + "res", stem + "re", nosotros, stem + "reis", stem + "ren"];
}

function withAux(aux: Six, participle: string): Six {
  return aux.map((form) => `${form} ${participle}`) as Six;
}

function naiveBundle(inf: string): ReturnType<typeof buildForms> & {
  imperfectSubjunctive: Six;
  futureSubjunctive: Six;
} {
  const cls = verbClass(inf) ?? "ar";
  const stem = inf.slice(0, -2);
  const present = PRESENT[cls].map((ending) => stem + ending) as Six;
  const preterite = PRETERITE[cls].map((ending) => stem + ending) as Six;
  const imperfect = IMPERFECT[cls].map((ending) => stem + ending) as Six;
  const bare = stripAccent(inf);
  const future = FUTURE.map((ending) => bare + ending) as Six;
  const conditional = CONDITIONAL.map((ending) => bare + ending) as Six;
  const subjunctive = SUBJUNCTIVE[cls].map((ending) => stem + ending) as Six;
  return {
    present,
    preterite,
    imperfect,
    future,
    conditional,
    subjunctive,
    imperfectSubjunctive: fromEllos(preterite[5], "ra"),
    futureSubjunctive: fromEllos(preterite[5], "re"),
    gerund: cls === "ar" ? `${stem}ando` : `${stem}iendo`,
    participle: cls === "ar" ? `${stem}ado` : `${stem}ido`,
    imperativeTu: present[2],
    stemChange: null,
  };
}

function marksFor(inf: string, forms: ReturnType<typeof buildForms>, subRa: Six, subRe: Six): CellMarks {
  const naive = naiveBundle(inf);
  const flag = (actual: Six, regular: Six): Record<Person, boolean> => ({
    yo: actual[0] !== regular[0],
    tu: actual[1] !== regular[1],
    el: actual[2] !== regular[2],
    nosotros: actual[3] !== regular[3],
    vosotros: actual[4] !== regular[4],
    ellos: actual[5] !== regular[5],
  });
  const participleIrregular = forms.participle !== naive.participle;
  const perfect = {
    yo: participleIrregular,
    tu: participleIrregular,
    el: participleIrregular,
    nosotros: participleIrregular,
    vosotros: participleIrregular,
    ellos: participleIrregular,
  };
  const sub = forms.subjunctive;
  const naiveSub = naive.subjunctive;
  const imperative: Record<ImperativePerson, boolean> = {
    tu: forms.imperativeTu !== naive.imperativeTu,
    el: sub[2] !== naiveSub[2],
    nosotros: sub[3] !== naiveSub[3],
    vosotros: false,
    ellos: sub[5] !== naiveSub[5],
  };
  const imperativeNegative: Record<ImperativePerson, boolean> = {
    tu: sub[1] !== naiveSub[1],
    el: sub[2] !== naiveSub[2],
    nosotros: sub[3] !== naiveSub[3],
    vosotros: sub[4] !== naiveSub[4],
    ellos: sub[5] !== naiveSub[5],
  };
  return {
    present: flag(forms.present, naive.present),
    preterite: flag(forms.preterite, naive.preterite),
    imperfect: flag(forms.imperfect, naive.imperfect),
    future: flag(forms.future, naive.future),
    conditional: flag(forms.conditional, naive.conditional),
    presentSubjunctive: flag(sub, naiveSub),
    imperfectSubjunctive: flag(subRa, naive.imperfectSubjunctive),
    futureSubjunctive: flag(subRe, naive.futureSubjunctive),
    presentPerfect: perfect,
    pluperfect: perfect,
    futurePerfect: perfect,
    conditionalPerfect: perfect,
    presentPerfectSubjunctive: perfect,
    pluperfectSubjunctive: perfect,
    imperative,
    imperativeNegative,
    gerund: forms.gerund !== naive.gerund,
    participle: participleIrregular,
  };
}

function eirParadigm(inf: string, reflexive: boolean): Paradigm {
  const root = inf.slice(0, -3);
  const withE = `${root}e`;
  const present: Six = [`${root}ío`, `${root}íes`, `${root}íe`, `${withE}ímos`, `${withE}ís`, `${root}íen`];
  const preterite: Six = [`${withE}í`, `${withE}íste`, `${root}io`, `${withE}ímos`, `${withE}ísteis`, `${root}ieron`];
  const subjunctive: Six = [`${root}ía`, `${root}ías`, `${root}ía`, `${root}iamos`, `${root}iais`, `${root}ían`];
  const imperfect = IMPERFECT.ir.map((ending) => withE + ending) as Six;
  const futureBase = stripAccent(inf);
  const future = FUTURE.map((ending) => futureBase + ending) as Six;
  const conditional = CONDITIONAL.map((ending) => futureBase + ending) as Six;
  const participle = inf.endsWith("freír") ? `${inf.slice(0, -5)}frito` : `${withE}ído`;
  return finish(inf, reflexive, "irregular", "e-i", {
    present,
    preterite,
    imperfect,
    future,
    conditional,
    subjunctive,
    gerund: `${root}iendo`,
    participle,
    imperativeTu: present[2],
    stemChange: "e-i",
  }, inf);
}

function finish(
  display: string,
  reflexive: boolean,
  kind: VerbKind,
  stemChange: StemChange | null,
  forms: ReturnType<typeof buildForms>,
  infinitiveForVos: string,
  note?: string,
): Paradigm {
  const sub = forms.subjunctive;
  const imperative: Record<ImperativePerson, string> = {
    tu: forms.imperativeTu,
    el: sub[2],
    nosotros: sub[3],
    vosotros: `${infinitiveForVos.slice(0, -1)}d`,
    ellos: sub[5],
  };
  const imperativeNegative: Record<ImperativePerson, string> = {
    tu: sub[1],
    el: sub[2],
    nosotros: sub[3],
    vosotros: sub[4],
    ellos: sub[5],
  };
  const imperfectSubjunctive = fromEllos(forms.preterite[5], "ra");
  const futureSubjunctive = fromEllos(forms.preterite[5], "re");
  const part = forms.participle;
  const paradigm: Paradigm = {
    infinitive: display,
    reflexive,
    kind,
    stemChange,
    gerund: forms.gerund,
    participle: part,
    present: six(forms.present),
    preterite: six(forms.preterite),
    imperfect: six(forms.imperfect),
    future: six(forms.future),
    conditional: six(forms.conditional),
    presentSubjunctive: six(sub),
    imperfectSubjunctive: six(imperfectSubjunctive),
    futureSubjunctive: six(futureSubjunctive),
    presentPerfect: six(withAux(AUX.presentPerfect, part)),
    pluperfect: six(withAux(AUX.pluperfect, part)),
    futurePerfect: six(withAux(AUX.futurePerfect, part)),
    conditionalPerfect: six(withAux(AUX.conditionalPerfect, part)),
    presentPerfectSubjunctive: six(withAux(AUX.presentPerfectSubjunctive, part)),
    pluperfectSubjunctive: six(withAux(AUX.pluperfectSubjunctive, part)),
    imperative,
    imperativeNegative,
    marks: marksFor(infinitiveForVos, forms, imperfectSubjunctive, futureSubjunctive),
  };
  if (note) paradigm.note = note;
  return paradigm;
}

function kindFor(inf: string, profile: Profile | undefined, stemChange: StemChange | null): VerbKind {
  if (
    profile?.yo ||
    profile?.present ||
    profile?.preterite ||
    profile?.preteriteStem ||
    profile?.futureStem ||
    profile?.subjStem ||
    profile?.subjunctive ||
    profile?.imperfect ||
    profile?.participle ||
    profile?.imperativeTu ||
    isZc(inf) ||
    isUir(inf) ||
    inf.endsWith("ducir") ||
    inf.endsWith("eír")
  ) {
    return "irregular";
  }
  if (stemChange) return "stem";
  if (/(?:car|gar|zar|guar|ger|gir|guir|aer|eer)$/.test(inf) || usesYPreterite(inf)) return "spelling";
  return "regular";
}

function buildSer(): ReturnType<typeof buildForms> {
  return {
    present: ["soy", "eres", "es", "somos", "sois", "son"],
    preterite: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["era", "eras", "era", "éramos", "erais", "eran"],
    future: FUTURE.map((e) => `ser${e}`) as Six,
    conditional: CONDITIONAL.map((e) => `ser${e}`) as Six,
    subjunctive: ["sea", "seas", "sea", "seamos", "seáis", "sean"],
    gerund: "siendo",
    participle: "sido",
    imperativeTu: "sé",
    stemChange: null,
  };
}

function buildIr(): ReturnType<typeof buildForms> {
  return {
    present: ["voy", "vas", "va", "vamos", "vais", "van"],
    preterite: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
    future: FUTURE.map((e) => `ir${e}`) as Six,
    conditional: CONDITIONAL.map((e) => `ir${e}`) as Six,
    subjunctive: ["vaya", "vayas", "vaya", "vayamos", "vayáis", "vayan"],
    gerund: "yendo",
    participle: "ido",
    imperativeTu: "ve",
    stemChange: null,
  };
}

function core(base: string): { forms: ReturnType<typeof buildForms>; kind: VerbKind; note?: string } {
  if (base === "ser") return { forms: buildSer(), kind: "irregular" };
  if (base === "ir") return { forms: buildIr(), kind: "irregular" };
  if (base.endsWith("eír")) {
    const fake = eirParadigm(base, false);
    return {
      kind: "irregular",
      forms: {
        present: PERSONS.map((p) => fake.present[p]) as Six,
        preterite: PERSONS.map((p) => fake.preterite[p]) as Six,
        imperfect: PERSONS.map((p) => fake.imperfect[p]) as Six,
        future: PERSONS.map((p) => fake.future[p]) as Six,
        conditional: PERSONS.map((p) => fake.conditional[p]) as Six,
        subjunctive: PERSONS.map((p) => fake.presentSubjunctive[p]) as Six,
        gerund: fake.gerund,
        participle: fake.participle,
        imperativeTu: fake.imperative.tu,
        stemChange: "e-i",
      },
    };
  }
  const profile = PROFILES[base];
  const forms = buildForms(base, profile);
  return { forms, kind: kindFor(base, profile, forms.stemChange), note: profile?.note };
}

export function conjugate(raw: string): Paradigm | null {
  const { infinitive, reflexive } = stripReflexive(raw.trim().toLowerCase());
  if (!isInfinitive(infinitive)) return null;
  if (infinitive.endsWith("eír")) return eirParadigm(infinitive, reflexive);

  const { prefix, base } = splitCompound(infinitive);
  if (!isInfinitive(base)) return null;
  const built = core(base);
  let forms = built.forms;
  if (prefix) {
    const p = (form: string) => prefixForm(prefix, form);
    forms = {
      ...forms,
      present: mapSix(forms.present, p),
      preterite: mapSix(forms.preterite, p),
      imperfect: mapSix(forms.imperfect, p),
      future: mapSix(forms.future, p),
      conditional: mapSix(forms.conditional, p),
      subjunctive: mapSix(forms.subjunctive, p),
      gerund: p(forms.gerund),
      participle: p(forms.participle),
      imperativeTu: fixShortImperative(prefix, p(forms.imperativeTu)),
    };
    if (infinitive === "bendecir" || infinitive === "maldecir") {
      const futureBase = stripAccent(infinitive);
      forms.future = FUTURE.map((e) => futureBase + e) as Six;
      forms.conditional = CONDITIONAL.map((e) => futureBase + e) as Six;
      forms.participle = infinitive === "bendecir" ? "bendecido" : "maldito";
      forms.imperativeTu = forms.present[2];
    }
    if (infinitive === "predecir") {
      const futureBase = stripAccent(infinitive);
      forms.future = FUTURE.map((e) => futureBase + e) as Six;
      forms.conditional = CONDITIONAL.map((e) => futureBase + e) as Six;
      forms.imperativeTu = forms.present[2];
    }
  }
  const kind = prefix ? built.kind : kindFor(infinitive, PROFILES[infinitive], forms.stemChange);
  const display = reflexive ? `${infinitive}se` : infinitive;
  return finish(display, reflexive, kind, forms.stemChange, forms, infinitive, built.note);
}

export function verbKind(infinitive: string): VerbKind | null {
  return conjugate(infinitive)?.kind ?? null;
}

export function isIrregularVerb(infinitive: string): boolean {
  const kind = verbKind(infinitive);
  return kind !== null && kind !== "regular";
}

export const TENSE_LABELS: Record<Tense | PerfectTense | "imperativeNegative", string> = {
  present: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  future: "Future",
  conditional: "Conditional",
  presentSubjunctive: "Present subjunctive",
  imperfectSubjunctive: "Imperfect subjunctive",
  futureSubjunctive: "Future subjunctive",
  imperative: "Imperative",
  imperativeNegative: "Negative imperative",
  presentPerfect: "Present perfect",
  pluperfect: "Pluperfect",
  futurePerfect: "Future perfect",
  conditionalPerfect: "Conditional perfect",
  presentPerfectSubjunctive: "Present perfect subjunctive",
  pluperfectSubjunctive: "Pluperfect subjunctive",
};

export const PERSON_LABELS: Record<Person, string> = {
  yo: "yo",
  tu: "tú",
  el: "él / ella / usted",
  nosotros: "nosotros",
  vosotros: "vosotros",
  ellos: "ellos / ustedes",
};

const CLITIC: Record<Person, string> = {
  yo: "me",
  tu: "te",
  el: "se",
  nosotros: "nos",
  vosotros: "os",
  ellos: "se",
};

function baseVowel(ch: string): string {
  return ch.normalize("NFD").replace(/[\u0301\u0308]/g, "").normalize("NFC");
}

function vowelKind(ch: string): "strong" | "weak" | null {
  const base = baseVowel(ch);
  if (base === "a" || base === "e" || base === "o") return "strong";
  if (base === "i" || base === "u") return "weak";
  return null;
}

interface Syllable {
  start: number;
  end: number;
  stress: number;
}

function syllables(word: string): Syllable[] {
  const chars = [...word];
  const out: Syllable[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!vowelKind(chars[i] ?? "")) {
      i += 1;
      continue;
    }
    const group = [i];
    i += 1;
    while (i < chars.length && vowelKind(chars[i] ?? "")) {
      const prev = chars[i - 1] ?? "";
      const cur = chars[i] ?? "";
      const prevAccent = prev !== baseVowel(prev);
      const curAccent = cur !== baseVowel(cur);
      const hiatus =
        (vowelKind(prev) === "strong" && vowelKind(cur) === "strong") ||
        (vowelKind(prev) === "weak" && prevAccent) ||
        (vowelKind(cur) === "weak" && curAccent);
      if (hiatus) break;
      group.push(i);
      i += 1;
    }
    const accented = group.find((index) => (chars[index] ?? "") !== baseVowel(chars[index] ?? ""));
    const strong = group.find((index) => vowelKind(chars[index] ?? "") === "strong");
    out.push({ start: group[0] ?? i, end: group[group.length - 1] ?? i, stress: accented ?? strong ?? group[0] ?? 0 });
  }
  return out;
}

function stressIndex(word: string): number {
  const chars = [...word];
  const syls = syllables(word);
  if (!syls.length) return 0;
  const accented = chars.findIndex((ch) => /[áéíóú]/.test(ch));
  if (accented >= 0) {
    const syl = syls.find((item) => accented >= item.start && accented <= item.end);
    return syl?.stress ?? accented;
  }
  if (syls.length === 1) return syls[0]?.stress ?? 0;
  const last = baseVowel(chars[chars.length - 1] ?? "");
  const soft = "aeiouns".includes(last);
  const syl = syls[soft ? syls.length - 2 : syls.length - 1];
  return syl?.stress ?? 0;
}

function applyStress(word: string, stress: number): string {
  const chars = [...word].map((ch) => baseVowel(ch));
  const syls = syllables(chars.join(""));
  const sylIndex = Math.max(0, syls.findIndex((item) => stress >= item.start && stress <= item.end));
  const last = baseVowel(chars[chars.length - 1] ?? "");
  const soft = "aeiouns".includes(last);
  const fallback = soft ? Math.max(0, syls.length - 2) : Math.max(0, syls.length - 1);
  const neighbor = vowelKind(chars[stress - 1] ?? "") || vowelKind(chars[stress + 1] ?? "");
  const base = chars[stress] ?? "";
  const hiatus = (base === "i" || base === "u") && neighbor;
  if (sylIndex === fallback && !hiatus) return chars.join("");
  const accent: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
  if (accent[base]) chars[stress] = accent[base];
  return chars.join("");
}

export function attachClitic(form: string, clitic: string): string {
  let stem = form;
  let stress = stressIndex(form);
  if (clitic === "nos" && stem.endsWith("s")) stem = stem.slice(0, -1);
  if (clitic === "os" && stem.endsWith("d")) {
    stem = stem.slice(0, -1);
    if (stress >= stem.length) stress = Math.max(0, stem.length - 1);
  }
  if (stress >= stem.length) stress = Math.max(0, stem.length - 1);
  return applyStress(stem + clitic, stress);
}

export type ShownSlot = FiniteTense | PerfectTense | "imperative" | "imperativeNegative" | "gerund" | "participle";

function rawForm(paradigm: Paradigm, slot: ShownSlot, person: Person): string {
  if (slot === "gerund") return paradigm.gerund;
  if (slot === "participle") return paradigm.participle;
  if (slot === "imperative") return paradigm.imperative[person === "yo" ? "tu" : person];
  if (slot === "imperativeNegative") return paradigm.imperativeNegative[person === "yo" ? "tu" : person];
  return paradigm[slot][person];
}

export function displayForm(paradigm: Paradigm, slot: ShownSlot, person: Person): string {
  const raw = rawForm(paradigm, slot, person);
  if (!paradigm.reflexive || slot === "gerund" || slot === "participle") return raw;
  const base = paradigm.infinitive.endsWith("se") ? paradigm.infinitive.slice(0, -2) : paradigm.infinitive;
  if (slot === "imperative") {
    if (base === "ir" && person === "nosotros") return "vámonos";
    if (base === "ir" && person === "vosotros") return "iros";
    return attachClitic(raw, CLITIC[person]);
  }
  if (slot === "imperativeNegative") return `no ${CLITIC[person]} ${raw}`;
  return `${CLITIC[person]} ${raw}`;
}

export function formIsIrregular(paradigm: Paradigm, slot: ShownSlot, person: Person): boolean {
  if (slot === "gerund") return paradigm.marks.gerund;
  if (slot === "participle") return paradigm.marks.participle;
  if (slot === "imperative") return paradigm.marks.imperative[person === "yo" ? "tu" : person];
  if (slot === "imperativeNegative") return paradigm.marks.imperativeNegative[person === "yo" ? "tu" : person];
  return paradigm.marks[slot][person];
}
