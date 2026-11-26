import {
  conjugate,
  displayForm,
  formIsIrregular,
  PERSON_LABELS,
  PERSONS,
  TENSE_LABELS,
  type FiniteTense,
  type Paradigm,
  type PerfectTense,
  type Person,
  type ShownSlot,
} from "../lib/conjugate.ts";
import { adjectiveForms, indefiniteArticle, nounForms } from "../lib/morphology.ts";
import type { Word } from "../lib/types.ts";

const INDICATIVE: FiniteTense[] = ["present", "preterite", "imperfect", "future", "conditional"];
const SUBJUNCTIVE: FiniteTense[] = ["presentSubjunctive", "imperfectSubjunctive", "futureSubjunctive"];
const PERFECT: PerfectTense[] = [
  "presentPerfect",
  "pluperfect",
  "futurePerfect",
  "conditionalPerfect",
  "presentPerfectSubjunctive",
  "pluperfectSubjunctive",
];

function people(region: "latam" | "spain"): Person[] {
  return region === "spain" ? [...PERSONS] : PERSONS.filter((person) => person !== "vosotros");
}

function Table({
  paradigm,
  slots,
  region,
}: {
  paradigm: Paradigm;
  slots: ShownSlot[];
  region: "latam" | "spain";
}) {
  const rows = people(region).filter((person) => person !== "yo" || !slots.every((slot) => slot === "imperative" || slot === "imperativeNegative"));
  return (
    <div className="tense-grid">
      {slots.map((slot) => (
        <div className="tense" key={slot}>
          <strong>{slot === "gerund" ? "Gerund" : slot === "participle" ? "Participle" : TENSE_LABELS[slot]}</strong>
          <div className="person-grid">
            {rows.map((person) => {
              const form = displayForm(paradigm, slot, person);
              const hot = formIsIrregular(paradigm, slot, person);
              const label = person === "el" ? "él / Ud." : person === "nosotros" ? "nosotros" : person === "vosotros" ? "vosotros" : PERSON_LABELS[person];
              return (
                <div className="person-cell" key={person}>
                  <span>{label}</span>
                  <b className={hot ? "hot" : undefined}>{form}</b>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConjugationTables({ lemma, region }: { lemma: string; region: "latam" | "spain" }) {
  const paradigm = conjugate(lemma);
  if (!paradigm) return <p className="muted">This one isn’t an infinitive, so there is no conjugation table.</p>;
  return (
    <div className="stack">
      <p className="muted">
        Gerund <b>{paradigm.gerund}</b> · participle <b className={paradigm.marks.participle ? "hot" : undefined}>{paradigm.participle}</b>
        {paradigm.reflexive ? " · reflexive" : ""}
        {paradigm.kind !== "regular" ? ` · ${paradigm.kind}` : ""}
      </p>
      {paradigm.note && <p className="muted">{paradigm.note}</p>}
      <p className="muted">Highlighted forms are irregular for this verb.</p>
      {paradigm.reflexive && (
        <p className="muted">Pronouns go before a conjugated verb and attach to an affirmative command. Negative commands keep them in front.</p>
      )}
      <details className="mood" open>
        <summary>Indicative</summary>
        <Table paradigm={paradigm} slots={INDICATIVE} region={region} />
      </details>
      <details className="mood">
        <summary>Subjunctive</summary>
        <p className="muted">The imperfect is the -ra form. The future subjunctive is rare and mostly literary.</p>
        <Table paradigm={paradigm} slots={SUBJUNCTIVE} region={region} />
      </details>
      <details className="mood">
        <summary>Imperative</summary>
        <Table paradigm={paradigm} slots={["imperative", "imperativeNegative"]} region={region} />
      </details>
      <details className="mood">
        <summary>Perfect tenses</summary>
        <Table paradigm={paradigm} slots={PERFECT} region={region} />
      </details>
    </div>
  );
}

export function WordForms({ word }: { word: Word }) {
  if (word.pos === "noun") {
    const forms = nounForms(word);
    return (
      <div className="stack">
        <p>
          {[forms.article, word.lemma].filter(Boolean).join(" ")}
          {forms.indefinite ? ` · ${forms.indefinite} ${word.lemma}` : ""}
        </p>
        {forms.pluralArticle && <p>Plural: {forms.pluralArticle} {forms.plural}</p>}
        {!forms.pluralArticle && <p>Plural: {forms.plural}</p>}
        {forms.note && <p className="muted">{forms.note}</p>}
      </div>
    );
  }
  if (word.pos === "adjective") {
    const forms = adjectiveForms(word.lemma);
    return (
      <div className="stack">
        <p>{forms.masculine} · {forms.feminine}</p>
        <p>{forms.masculinePlural} · {forms.femininePlural}</p>
        {forms.note && <p className="muted">{forms.note}</p>}
      </div>
    );
  }
  if (word.article) {
    return <p className="muted">{indefiniteArticle(word.article) ? `${word.article} / ${indefiniteArticle(word.article)}` : word.article}</p>;
  }
  return null;
}
