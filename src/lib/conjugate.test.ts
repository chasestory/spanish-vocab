import { describe, expect, it } from "vitest";
import { conjugate, type Person } from "./conjugate.ts";

const P: Person[] = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

function row(inf: string, tense: "present" | "preterite" | "imperfect" | "future" | "conditional" | "presentSubjunctive" | "imperfectSubjunctive" | "futureSubjunctive") {
  const paradigm = conjugate(inf);
  if (!paradigm) throw new Error(inf);
  return P.map((person) => paradigm[tense][person]);
}

describe("conjugation engine", () => {
  it("conjugates regular hablar", () => {
    expect(row("hablar", "present")).toEqual(["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]);
    expect(row("hablar", "preterite")).toEqual(["hablé", "hablaste", "habló", "hablamos", "hablasteis", "hablaron"]);
    expect(row("hablar", "imperfect")).toEqual(["hablaba", "hablabas", "hablaba", "hablábamos", "hablabais", "hablaban"]);
    expect(row("hablar", "future")[0]).toBe("hablaré");
    expect(row("hablar", "conditional")[0]).toBe("hablaría");
    expect(row("hablar", "presentSubjunctive")).toEqual(["hable", "hables", "hable", "hablemos", "habléis", "hablen"]);
    const p = conjugate("hablar");
    expect(p?.imperative.tu).toBe("habla");
    expect(p?.imperative.vosotros).toBe("hablad");
    expect(p?.imperativeNegative.tu).toBe("hables");
    expect(p?.gerund).toBe("hablando");
    expect(p?.participle).toBe("hablado");
    expect(p?.kind).toBe("regular");
  });

  it("applies spelling changes", () => {
    const buscar = conjugate("buscar");
    expect(buscar?.preterite.yo).toBe("busqué");
    expect(buscar?.presentSubjunctive.yo).toBe("busque");
    expect(buscar?.presentSubjunctive.nosotros).toBe("busquemos");
    expect(conjugate("llegar")?.preterite.yo).toBe("llegué");
    expect(conjugate("pagar")?.presentSubjunctive.tu).toBe("pagues");
    expect(conjugate("averiguar")?.preterite.yo).toBe("averigüé");
    expect(conjugate("averiguar")?.presentSubjunctive.yo).toBe("averigüe");
    const empezar = conjugate("empezar");
    expect(row("empezar", "present")).toEqual(["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"]);
    expect(empezar?.preterite.yo).toBe("empecé");
    expect(row("empezar", "presentSubjunctive")).toEqual(["empiece", "empieces", "empiece", "empecemos", "empecéis", "empiecen"]);
    expect(conjugate("vencer")?.present.yo).toBe("venzo");
    expect(conjugate("vencer")?.presentSubjunctive.yo).toBe("venza");
    expect(row("cocer", "present")).toEqual(["cuezo", "cueces", "cuece", "cocemos", "cocéis", "cuecen"]);
    expect(conjugate("cocer")?.presentSubjunctive.nosotros).toBe("cozamos");
    expect(conjugate("torcer")?.present.yo).toBe("tuerzo");
    expect(conjugate("torcer")?.presentSubjunctive.nosotros).toBe("torzamos");
  });

  it("conjugates the common irregulars", () => {
    expect(row("ser", "present")).toEqual(["soy", "eres", "es", "somos", "sois", "son"]);
    expect(row("ser", "preterite")).toEqual(["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"]);
    expect(row("ser", "imperfect")).toEqual(["era", "eras", "era", "éramos", "erais", "eran"]);
    expect(row("ser", "future")[0]).toBe("seré");
    expect(row("ser", "conditional")[3]).toBe("seríamos");
    expect(row("ser", "presentSubjunctive")).toEqual(["sea", "seas", "sea", "seamos", "seáis", "sean"]);
    expect(conjugate("ser")?.imperative.tu).toBe("sé");
    expect(conjugate("ser")?.imperative.vosotros).toBe("sed");
    expect(conjugate("ser")?.gerund).toBe("siendo");

    expect(row("estar", "present")).toEqual(["estoy", "estás", "está", "estamos", "estáis", "están"]);
    expect(row("estar", "preterite")).toEqual(["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"]);
    expect(row("estar", "presentSubjunctive")).toEqual(["esté", "estés", "esté", "estemos", "estéis", "estén"]);
    expect(conjugate("estar")?.imperfect.nosotros).toBe("estábamos");

    expect(row("ir", "present")).toEqual(["voy", "vas", "va", "vamos", "vais", "van"]);
    expect(row("ir", "preterite")).toEqual(["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"]);
    expect(row("ir", "imperfect")).toEqual(["iba", "ibas", "iba", "íbamos", "ibais", "iban"]);
    expect(row("ir", "presentSubjunctive")).toEqual(["vaya", "vayas", "vaya", "vayamos", "vayáis", "vayan"]);
    expect(conjugate("ir")?.imperative.tu).toBe("ve");
    expect(conjugate("ir")?.imperative.vosotros).toBe("id");
    expect(conjugate("ir")?.gerund).toBe("yendo");
    expect(conjugate("irse")?.reflexive).toBe(true);
    expect(conjugate("irse")?.present.yo).toBe("voy");

    expect(row("tener", "present")).toEqual(["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"]);
    expect(row("tener", "preterite")).toEqual(["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"]);
    expect(row("tener", "future")).toEqual(["tendré", "tendrás", "tendrá", "tendremos", "tendréis", "tendrán"]);
    expect(row("tener", "conditional")[0]).toBe("tendría");
    expect(row("tener", "presentSubjunctive")).toEqual(["tenga", "tengas", "tenga", "tengamos", "tengáis", "tengan"]);
    expect(conjugate("tener")?.imperative.tu).toBe("ten");
    expect(conjugate("detener")?.present.yo).toBe("detengo");
    expect(conjugate("detener")?.present.tu).toBe("detienes");
    expect(conjugate("detener")?.imperative.tu).toBe("detén");
    expect(conjugate("detener")?.future.yo).toBe("detendré");

    expect(row("hacer", "present")).toEqual(["hago", "haces", "hace", "hacemos", "hacéis", "hacen"]);
    expect(row("hacer", "preterite")).toEqual(["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"]);
    expect(row("hacer", "future")[2]).toBe("hará");
    expect(conjugate("hacer")?.imperative.tu).toBe("haz");
    expect(conjugate("hacer")?.participle).toBe("hecho");
    expect(conjugate("rehacer")?.present.yo).toBe("rehago");
    expect(conjugate("rehacer")?.participle).toBe("rehecho");
    expect(conjugate("rehacer")?.imperative.tu).toBe("rehaz");

    expect(row("decir", "present")).toEqual(["digo", "dices", "dice", "decimos", "decís", "dicen"]);
    expect(row("decir", "preterite")).toEqual(["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"]);
    expect(row("decir", "future")[0]).toBe("diré");
    expect(conjugate("decir")?.imperative.tu).toBe("di");
    expect(conjugate("decir")?.imperative.vosotros).toBe("decid");
    expect(conjugate("decir")?.gerund).toBe("diciendo");
    expect(conjugate("decir")?.participle).toBe("dicho");

    expect(row("poder", "present")).toEqual(["puedo", "puedes", "puede", "podemos", "podéis", "pueden"]);
    expect(row("poder", "preterite")).toEqual(["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"]);
    expect(row("poder", "future")[0]).toBe("podré");
    expect(row("poder", "presentSubjunctive")).toEqual(["pueda", "puedas", "pueda", "podamos", "podáis", "puedan"]);
    expect(conjugate("poder")?.gerund).toBe("pudiendo");

    expect(row("poner", "present")).toEqual(["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"]);
    expect(row("poner", "preterite")[0]).toBe("puse");
    expect(row("poner", "future")[0]).toBe("pondré");
    expect(conjugate("poner")?.imperative.tu).toBe("pon");
    expect(conjugate("poner")?.participle).toBe("puesto");
    expect(conjugate("componer")?.imperative.tu).toBe("compón");
    expect(conjugate("componer")?.preterite.yo).toBe("compuse");

    expect(row("saber", "present")).toEqual(["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"]);
    expect(row("saber", "preterite")[2]).toBe("supo");
    expect(row("saber", "future")[0]).toBe("sabré");
    expect(row("saber", "presentSubjunctive")[0]).toBe("sepa");

    expect(row("querer", "present")).toEqual(["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"]);
    expect(row("querer", "preterite")[0]).toBe("quise");
    expect(row("querer", "future")[0]).toBe("querré");
    expect(row("querer", "presentSubjunctive")[3]).toBe("queramos");

    expect(row("venir", "present")).toEqual(["vengo", "vienes", "viene", "venimos", "venís", "vienen"]);
    expect(row("venir", "preterite")).toEqual(["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"]);
    expect(row("venir", "future")[0]).toBe("vendré");
    expect(conjugate("venir")?.imperative.tu).toBe("ven");
    expect(conjugate("convenir")?.imperative.tu).toBe("convén");
    expect(conjugate("venir")?.gerund).toBe("viniendo");

    expect(row("dar", "present")).toEqual(["doy", "das", "da", "damos", "dais", "dan"]);
    expect(row("dar", "preterite")).toEqual(["di", "diste", "dio", "dimos", "disteis", "dieron"]);
    expect(row("dar", "presentSubjunctive")).toEqual(["dé", "des", "dé", "demos", "deis", "den"]);
    expect(conjugate("dar")?.imperative.vosotros).toBe("dad");

    expect(row("ver", "present")).toEqual(["veo", "ves", "ve", "vemos", "veis", "ven"]);
    expect(row("ver", "preterite")).toEqual(["vi", "viste", "vio", "vimos", "visteis", "vieron"]);
    expect(row("ver", "imperfect")[0]).toBe("veía");
    expect(row("ver", "presentSubjunctive")[0]).toBe("vea");
    expect(conjugate("ver")?.participle).toBe("visto");

    expect(row("salir", "present")).toEqual(["salgo", "sales", "sale", "salimos", "salís", "salen"]);
    expect(row("salir", "future")[0]).toBe("saldré");
    expect(conjugate("salir")?.imperative.tu).toBe("sal");
    expect(conjugate("salir")?.preterite.yo).toBe("salí");

    expect(row("traer", "present")).toEqual(["traigo", "traes", "trae", "traemos", "traéis", "traen"]);
    expect(row("traer", "preterite")).toEqual(["traje", "trajiste", "trajo", "trajimos", "trajisteis", "trajeron"]);
    expect(row("traer", "future")[0]).toBe("traeré");
    expect(conjugate("traer")?.gerund).toBe("trayendo");
    expect(conjugate("atraer")?.present.yo).toBe("atraigo");
    expect(conjugate("atraer")?.preterite.el).toBe("atrajo");

    expect(row("conocer", "present")).toEqual(["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"]);
    expect(row("conocer", "presentSubjunctive")).toEqual(["conozca", "conozcas", "conozca", "conozcamos", "conozcáis", "conozcan"]);
    expect(conjugate("conocer")?.preterite.yo).toBe("conocí");

    expect(row("oír", "present")).toEqual(["oigo", "oyes", "oye", "oímos", "oís", "oyen"]);
    expect(row("oír", "preterite")).toEqual(["oí", "oíste", "oyó", "oímos", "oísteis", "oyeron"]);
    expect(row("oír", "presentSubjunctive")[3]).toBe("oigamos");
    expect(conjugate("oír")?.future.yo).toBe("oiré");
    expect(conjugate("oír")?.gerund).toBe("oyendo");
    expect(conjugate("oír")?.imperative.vosotros).toBe("oíd");

    expect(row("caber", "present")[0]).toBe("quepo");
    expect(row("caber", "preterite")).toEqual(["cupe", "cupiste", "cupo", "cupimos", "cupisteis", "cupieron"]);
    expect(row("caber", "future")[0]).toBe("cabré");
    expect(row("caber", "presentSubjunctive")[0]).toBe("quepa");

    expect(row("haber", "present")).toEqual(["he", "has", "ha", "hemos", "habéis", "han"]);
    expect(row("haber", "preterite")).toEqual(["hube", "hubiste", "hubo", "hubimos", "hubisteis", "hubieron"]);
    expect(row("haber", "future")[0]).toBe("habré");
    expect(row("haber", "presentSubjunctive")).toEqual(["haya", "hayas", "haya", "hayamos", "hayáis", "hayan"]);
    expect(conjugate("haber")?.note).toMatch(/hay/);

    expect(row("andar", "present")[0]).toBe("ando");
    expect(row("andar", "preterite")).toEqual(["anduve", "anduviste", "anduvo", "anduvimos", "anduvisteis", "anduvieron"]);
    expect(row("andar", "presentSubjunctive")[0]).toBe("ande");

    expect(row("conducir", "present")).toEqual(["conduzco", "conduces", "conduce", "conducimos", "conducís", "conducen"]);
    expect(row("conducir", "preterite")).toEqual(["conduje", "condujiste", "condujo", "condujimos", "condujisteis", "condujeron"]);
    expect(row("conducir", "presentSubjunctive")[0]).toBe("conduzca");
    expect(conjugate("conducir")?.future.yo).toBe("conduciré");
    expect(conjugate("traducir")?.preterite.yo).toBe("traduje");

    expect(row("pedir", "present")).toEqual(["pido", "pides", "pide", "pedimos", "pedís", "piden"]);
    expect(row("pedir", "preterite")).toEqual(["pedí", "pediste", "pidió", "pedimos", "pedisteis", "pidieron"]);
    expect(row("pedir", "presentSubjunctive")).toEqual(["pida", "pidas", "pida", "pidamos", "pidáis", "pidan"]);
    expect(conjugate("pedir")?.gerund).toBe("pidiendo");

    expect(row("dormir", "present")).toEqual(["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"]);
    expect(row("dormir", "preterite")[2]).toBe("durmió");
    expect(row("dormir", "preterite")[5]).toBe("durmieron");
    expect(row("dormir", "presentSubjunctive")).toEqual(["duerma", "duermas", "duerma", "durmamos", "durmáis", "duerman"]);
    expect(conjugate("dormir")?.gerund).toBe("durmiendo");
    expect(conjugate("morir")?.participle).toBe("muerto");

    expect(row("sentir", "present")).toEqual(["siento", "sientes", "siente", "sentimos", "sentís", "sienten"]);
    expect(row("sentir", "preterite")[2]).toBe("sintió");
    expect(row("sentir", "presentSubjunctive")[3]).toBe("sintamos");
    expect(row("sentir", "presentSubjunctive")[4]).toBe("sintáis");

    expect(row("jugar", "present")).toEqual(["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"]);
    expect(row("jugar", "preterite")[0]).toBe("jugué");
    expect(row("jugar", "presentSubjunctive")).toEqual(["juegue", "juegues", "juegue", "juguemos", "juguéis", "jueguen"]);

    expect(row("seguir", "present")).toEqual(["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"]);
    expect(row("seguir", "preterite")[2]).toBe("siguió");
    expect(row("seguir", "presentSubjunctive")[3]).toBe("sigamos");
    expect(conjugate("conseguir")?.present.yo).toBe("consigo");

    expect(row("leer", "preterite")).toEqual(["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"]);
    expect(conjugate("leer")?.gerund).toBe("leyendo");
    expect(conjugate("leer")?.present.yo).toBe("leo");

    expect(row("construir", "present")).toEqual(["construyo", "construyes", "construye", "construimos", "construís", "construyen"]);
    expect(row("construir", "preterite")[2]).toBe("construyó");
    expect(row("construir", "preterite")[5]).toBe("construyeron");
    expect(row("construir", "presentSubjunctive")[0]).toBe("construya");
    expect(conjugate("construir")?.gerund).toBe("construyendo");

    expect(row("caer", "present")[0]).toBe("caigo");
    expect(row("caer", "preterite")[2]).toBe("cayó");
    expect(conjugate("caer")?.gerund).toBe("cayendo");
    expect(conjugate("caer")?.presentSubjunctive.nosotros).toBe("caigamos");

    expect(row("enviar", "present")).toEqual(["envío", "envías", "envía", "enviamos", "enviáis", "envían"]);
    expect(row("enviar", "presentSubjunctive")[0]).toBe("envíe");
    expect(row("enviar", "presentSubjunctive")[3]).toBe("enviemos");
    expect(conjugate("continuar")?.present.yo).toBe("continúo");
    expect(row("reunir", "present")).toEqual(["reúno", "reúnes", "reúne", "reunimos", "reunís", "reúnen"]);
    expect(row("reunir", "presentSubjunctive")[3]).toBe("reunamos");

    expect(row("oler", "present")).toEqual(["huelo", "hueles", "huele", "olemos", "oléis", "huelen"]);
    expect(row("oler", "presentSubjunctive")[3]).toBe("olamos");
    expect(conjugate("errar")?.present.yo).toBe("yerro");

    expect(row("reír", "present")).toEqual(["río", "ríes", "ríe", "reímos", "reís", "ríen"]);
    expect(row("reír", "preterite")).toEqual(["reí", "reíste", "rio", "reímos", "reísteis", "rieron"]);
    expect(row("reír", "presentSubjunctive")).toEqual(["ría", "rías", "ría", "riamos", "riais", "rían"]);
    expect(conjugate("reír")?.gerund).toBe("riendo");
    expect(conjugate("reír")?.participle).toBe("reído");
    expect(conjugate("sonreír")?.present.yo).toBe("sonrío");
    expect(conjugate("freír")?.present.yo).toBe("frío");
    expect(conjugate("freír")?.preterite.el).toBe("frio");
    expect(conjugate("freír")?.participle).toBe("frito");

    expect(conjugate("volver")?.participle).toBe("vuelto");
    expect(conjugate("resolver")?.participle).toBe("resuelto");
    expect(conjugate("abrir")?.participle).toBe("abierto");
    expect(conjugate("escribir")?.participle).toBe("escrito");
    expect(conjugate("romper")?.participle).toBe("roto");
    expect(conjugate("bendecir")?.future.yo).toBe("bendeciré");
    expect(conjugate("bendecir")?.present.yo).toBe("bendigo");
    expect(conjugate("bendecir")?.imperative.tu).toBe("bendice");
    expect(conjugate("predecir")?.future.yo).toBe("predeciré");
    expect(conjugate("predecir")?.preterite.yo).toBe("predije");
    expect(conjugate("satisfacer")?.present.yo).toBe("satisfago");
    expect(conjugate("satisfacer")?.preterite.el).toBe("satisfizo");
    expect(conjugate("satisfacer")?.future.yo).toBe("satisfaré");
    expect(conjugate("satisfacer")?.participle).toBe("satisfecho");
    expect(conjugate("elegir")?.present.yo).toBe("elijo");
    expect(conjugate("elegir")?.presentSubjunctive.yo).toBe("elija");
  });

  it("builds imperfect subjunctive, future subjunctive, and perfect tenses", () => {
    const hablar = conjugate("hablar");
    expect(row("hablar", "imperfectSubjunctive")).toEqual(["hablara", "hablaras", "hablara", "habláramos", "hablarais", "hablaran"]);
    expect(row("hablar", "futureSubjunctive")).toEqual(["hablare", "hablares", "hablare", "habláremos", "hablareis", "hablaren"]);
    expect(hablar?.presentPerfect.yo).toBe("he hablado");
    expect(hablar?.pluperfect.nosotros).toBe("habíamos hablado");
    expect(hablar?.futurePerfect.el).toBe("habrá hablado");
    expect(hablar?.conditionalPerfect.tu).toBe("habrías hablado");
    expect(hablar?.presentPerfectSubjunctive.yo).toBe("haya hablado");
    expect(hablar?.pluperfectSubjunctive.ellos).toBe("hubieran hablado");
    expect(hablar?.marks.present.yo).toBe(false);
    expect(hablar?.marks.participle).toBe(false);

    expect(row("comer", "imperfectSubjunctive")[0]).toBe("comiera");
    expect(row("comer", "imperfectSubjunctive")[3]).toBe("comiéramos");
    expect(row("vivir", "futureSubjunctive")[3]).toBe("viviéremos");

    expect(row("ser", "imperfectSubjunctive")).toEqual(["fuera", "fueras", "fuera", "fuéramos", "fuerais", "fueran"]);
    expect(row("ser", "futureSubjunctive")[0]).toBe("fuere");
    expect(row("ser", "futureSubjunctive")[3]).toBe("fuéremos");
    expect(row("ir", "imperfectSubjunctive")[2]).toBe("fuera");
    expect(conjugate("ser")?.marks.present.yo).toBe(true);
    expect(conjugate("ser")?.presentPerfect.yo).toBe("he sido");

    expect(row("estar", "imperfectSubjunctive")[0]).toBe("estuviera");
    expect(row("estar", "imperfectSubjunctive")[3]).toBe("estuviéramos");
    expect(row("tener", "imperfectSubjunctive")).toEqual(["tuviera", "tuvieras", "tuviera", "tuviéramos", "tuvierais", "tuvieran"]);
    expect(row("hacer", "imperfectSubjunctive")[2]).toBe("hiciera");
    expect(conjugate("hacer")?.presentPerfect.yo).toBe("he hecho");
    expect(conjugate("hacer")?.marks.participle).toBe(true);
    expect(conjugate("hacer")?.marks.presentPerfect.yo).toBe(true);
    expect(row("decir", "imperfectSubjunctive")[0]).toBe("dijera");
    expect(conjugate("decir")?.pluperfectSubjunctive.yo).toBe("hubiera dicho");
    expect(row("poder", "imperfectSubjunctive")[0]).toBe("pudiera");
    expect(row("poner", "imperfectSubjunctive")[5]).toBe("pusieran");
    expect(conjugate("poner")?.futurePerfect.yo).toBe("habré puesto");
    expect(row("querer", "imperfectSubjunctive")[0]).toBe("quisiera");
    expect(row("saber", "imperfectSubjunctive")[2]).toBe("supiera");
    expect(row("venir", "imperfectSubjunctive")[0]).toBe("viniera");
    expect(row("dar", "imperfectSubjunctive")).toEqual(["diera", "dieras", "diera", "diéramos", "dierais", "dieran"]);
    expect(row("ver", "imperfectSubjunctive")[0]).toBe("viera");
    expect(conjugate("ver")?.presentPerfect.el).toBe("ha visto");
    expect(row("haber", "imperfectSubjunctive")[0]).toBe("hubiera");
    expect(row("andar", "imperfectSubjunctive")[0]).toBe("anduviera");
    expect(row("conducir", "imperfectSubjunctive")[0]).toBe("condujera");
    expect(row("traer", "imperfectSubjunctive")[2]).toBe("trajera");
    expect(row("caber", "imperfectSubjunctive")[0]).toBe("cupiera");
    expect(row("pedir", "imperfectSubjunctive")[2]).toBe("pidiera");
    expect(row("dormir", "imperfectSubjunctive")[5]).toBe("durmieran");
    expect(row("sentir", "imperfectSubjunctive")[3]).toBe("sintiéramos");
    expect(row("leer", "imperfectSubjunctive")[0]).toBe("leyera");
    expect(row("oír", "imperfectSubjunctive")[2]).toBe("oyera");
    expect(row("construir", "imperfectSubjunctive")[0]).toBe("construyera");
    expect(row("reír", "imperfectSubjunctive")[0]).toBe("riera");
    expect(row("reír", "imperfectSubjunctive")[3]).toBe("riéramos");
    expect(conjugate("jugar")?.preterite.yo).toBe("jugué");
    expect(conjugate("jugar")?.marks.preterite.yo).toBe(true);
    expect(conjugate("jugar")?.marks.present.nosotros).toBe(false);
    expect(conjugate("pensar")?.marks.present.yo).toBe(true);
    expect(conjugate("pensar")?.marks.present.nosotros).toBe(false);
    expect(conjugate("buscar")?.marks.preterite.yo).toBe(true);
    expect(conjugate("buscar")?.marks.present.yo).toBe(false);

    const irse = conjugate("lavarse");
    expect(irse?.reflexive).toBe(true);
    expect(irse?.present.yo).toBe("lavo");
    expect(conjugate("sentarse")?.imperative.tu).toBe("sienta");
  });
});
