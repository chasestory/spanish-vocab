export type PronounKind = "rewrite" | "identify" | "order";

export interface PronounExercise {
  id: string;
  level: 1 | 2 | 3;
  kind: PronounKind;
  prompt: string;
  answers: string[];
  explain: string;
  choices?: string[];
}

interface Seed {
  level: 1 | 2 | 3;
  kind: PronounKind;
  prompt: string;
  answers: string[];
  explain: string;
  choices?: string[];
}

const SEEDS: Seed[] = [
  { level: 1, kind: "rewrite", prompt: "Rewrite, replacing the person: Veo a María.", answers: ["La veo"], explain: "María is a feminine singular direct object, so la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Veo a Juan.", answers: ["Lo veo"], explain: "Juan is a masculine singular direct object, so lo." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Veo a María y a Ana.", answers: ["Las veo"], explain: "Two women, direct object: las." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Veo a Juan y a Pedro.", answers: ["Los veo"], explain: "Two men, direct object: los." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Llamo a mi madre.", answers: ["La llamo"], explain: "A specific person takes personal a, and madre is la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Llamo a mi padre.", answers: ["Lo llamo"], explain: "Padre is a masculine singular direct object: lo." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Busco las llaves.", answers: ["Las busco"], explain: "Llaves is feminine plural and a thing, so las. No personal a." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Busco el libro.", answers: ["Lo busco"], explain: "Libro is masculine singular: lo." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Compro la leche.", answers: ["La compro"], explain: "Leche is feminine singular: la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Compro los boletos.", answers: ["Los compro"], explain: "Boletos is masculine plural: los." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Conozco a Lucía.", answers: ["La conozco"], explain: "Personal a plus a feminine person: la conozco." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Conozco a los vecinos.", answers: ["Los conozco"], explain: "A group of people, masculine plural: los." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Escucho la radio.", answers: ["La escucho"], explain: "Radio, the broadcast, is feminine: la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Leo el periódico.", answers: ["Lo leo"], explain: "Periódico is masculine singular: lo." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Quiero la mochila.", answers: ["La quiero"], explain: "Mochila is feminine singular: la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Invito a Sara.", answers: ["La invito"], explain: "Sara is a person and the direct object: la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Espero a los niños.", answers: ["Los espero"], explain: "The children are the direct object: los. The a is personal a." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Miro las fotos.", answers: ["Las miro"], explain: "Fotos is feminine plural: las." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Cierro la puerta.", answers: ["La cierro"], explain: "Puerta is feminine singular: la." },
  { level: 1, kind: "rewrite", prompt: "Rewrite: Abro las ventanas.", answers: ["Las abro"], explain: "Ventanas is feminine plural: las." },
  { level: 1, kind: "rewrite", prompt: "Replace only the person. Keep the thing: Doy un regalo a María.", answers: ["Le doy un regalo"], explain: "María is the indirect object, one person: le." },
  { level: 1, kind: "rewrite", prompt: "Replace only the person: Escribo un mensaje a Juan.", answers: ["Le escribo un mensaje"], explain: "Juan receives the message: le." },
  { level: 1, kind: "rewrite", prompt: "Replace only the people: Compro flores a mis padres.", answers: ["Les compro flores"], explain: "Two parents receive the flowers: les." },
  { level: 1, kind: "rewrite", prompt: "Replace only the person: Pregunto la hora a la profesora.", answers: ["Le pregunto la hora"], explain: "The teacher is the indirect object: le." },
  { level: 1, kind: "rewrite", prompt: "Replace only the people: Cuento un secreto a Ana y a Luis.", answers: ["Les cuento un secreto"], explain: "More than one receiver: les." },
  { level: 1, kind: "rewrite", prompt: "Replace usted: Traigo café a usted.", answers: ["Le traigo café"], explain: "Usted takes le, the same as él or ella." },
  { level: 1, kind: "rewrite", prompt: "Replace only the person: Presto el coche a mi hermano.", answers: ["Le presto el coche"], explain: "Hermano receives the car: le." },
  { level: 1, kind: "rewrite", prompt: "Replace only the people: Explico la tarea a los estudiantes.", answers: ["Les explico la tarea"], explain: "Several students: les." },
  { level: 1, kind: "rewrite", prompt: "Replace only the person: Mando una carta a mi abuela.", answers: ["Le mando una carta"], explain: "Abuela is one receiver: le." },
  { level: 1, kind: "rewrite", prompt: "Replace ellas: Ofrezco ayuda a ellas.", answers: ["Les ofrezco ayuda"], explain: "Ellas is plural, so les." },
  { level: 1, kind: "identify", prompt: "In “Veo a María”, what is the direct object?", answers: ["María", "a María"], explain: "The thing or person seen is the direct object. The a is personal a.", choices: ["María", "veo", "a", "nothing"] },
  { level: 1, kind: "identify", prompt: "In “Le doy el libro a Juan”, what is the direct object?", answers: ["el libro", "libro"], explain: "The book is what is given. Juan is the indirect object.", choices: ["el libro", "Juan", "le", "doy"] },
  { level: 1, kind: "identify", prompt: "In “Le doy el libro a Juan”, what is the indirect object?", answers: ["Juan", "a Juan"], explain: "Juan receives the book, so he is the indirect object.", choices: ["Juan", "el libro", "doy", "le"] },
  { level: 1, kind: "identify", prompt: "In “Busco las llaves”, what is the direct object?", answers: ["las llaves", "llaves"], explain: "Keys are a thing. There is no personal a.", choices: ["las llaves", "busco", "la", "nothing"] },
  { level: 1, kind: "identify", prompt: "Why is there an a in “Veo a Carlos”?", answers: ["personal a", "Personal a"], explain: "A specific person as a direct object takes personal a.", choices: ["Personal a", "It shows movement", "Carlos is indirect", "It is optional and meaningless"] },
  { level: 1, kind: "identify", prompt: "Which sentence uses personal a for one specific person?", answers: ["Busco al médico", "Busco al medico"], explain: "Al médico points to a specific person. Busco un médico does not.", choices: ["Busco un médico", "Busco al médico", "Busco el mapa", "Busco agua"] },
  { level: 1, kind: "identify", prompt: "Which pronoun replaces María in “Veo a María”?", answers: ["la"], explain: "Feminine singular direct object: la.", choices: ["la", "le", "lo", "se"] },
  { level: 1, kind: "identify", prompt: "Which pronoun replaces el libro in “Leo el libro”?", answers: ["lo"], explain: "Masculine singular thing: lo.", choices: ["lo", "le", "la", "el"] },
  { level: 1, kind: "identify", prompt: "Which pronoun replaces a Juan when he receives something?", answers: ["le"], explain: "One receiver: le. Le doy el libro.", choices: ["le", "lo", "se", "les"] },
  { level: 1, kind: "identify", prompt: "Which pronoun replaces a mis padres as receivers?", answers: ["les"], explain: "More than one receiver: les.", choices: ["les", "los", "le", "se"] },
  { level: 2, kind: "rewrite", prompt: "Replace both objects: Le doy el libro a María.", answers: ["Se lo doy"], explain: "Le becomes se before lo. Never le lo." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le doy la carta a María.", answers: ["Se la doy"], explain: "Carta is la. Le + la becomes se la." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le doy los libros a María.", answers: ["Se los doy"], explain: "Libros is los. The receiver pronoun becomes se." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le doy las llaves a María.", answers: ["Se las doy"], explain: "Llaves is las. Se las doy." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les compro flores a mis padres.", answers: ["Se las compro"], explain: "Flores is feminine plural, las. Les becomes se." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les mando el paquete a ellos.", answers: ["Se lo mando"], explain: "Paquete is lo. Les becomes se." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le escribo la carta a Juan.", answers: ["Se la escribo"], explain: "Carta is la, and le becomes se." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le presto el coche a Ana.", answers: ["Se lo presto"], explain: "Coche is lo. Se lo presto." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les explico la lección a los estudiantes.", answers: ["Se la explico"], explain: "Lección is la. Several receivers still become se, not les." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le traigo los documentos a usted.", answers: ["Se los traigo"], explain: "Documentos is los. Usted’s le becomes se." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le regalo las flores a mi madre.", answers: ["Se las regalo"], explain: "Flores is las. Se las regalo." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les pido el favor a ellos.", answers: ["Se lo pido"], explain: "Favor is masculine singular: se lo pido." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le compro la medicina a mi padre.", answers: ["Se la compro"], explain: "Medicina is la. Se la compro." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les sirvo el café a los invitados.", answers: ["Se lo sirvo"], explain: "Café is lo. Se lo sirvo." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le muestro las fotos a Lucía.", answers: ["Se las muestro"], explain: "Fotos is las. Se las muestro." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le dejo el mensaje a Pedro.", answers: ["Se lo dejo"], explain: "Mensaje is lo. Se lo dejo." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Les doy la noticia a mis hermanos.", answers: ["Se la doy"], explain: "Noticia is la. Se la doy." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le pongo la chaqueta al niño.", answers: ["Se la pongo"], explain: "Chaqueta is la. Se la pongo." },
  { level: 2, kind: "rewrite", prompt: "Replace both: Le saco una foto a Ana.", answers: ["Se la saco"], explain: "Foto is feminine: se la saco." },
  { level: 2, kind: "order", prompt: "Put these in a correct sentence: lo / se / doy", answers: ["Se lo doy"], explain: "Indirect se comes before direct lo. Lo se is impossible.", choices: ["Se lo doy", "Lo se doy", "Doy se lo", "Lo doy se"] },
  { level: 2, kind: "order", prompt: "Put these in a correct sentence: las / se / compro", answers: ["Se las compro"], explain: "Se, then the direct object pronoun, then the verb.", choices: ["Se las compro", "Las se compro", "Compro se las", "Se compro las"] },
  { level: 2, kind: "order", prompt: "Which sentence is correct?", answers: ["Se lo doy"], explain: "Le and les change to se in front of lo, la, los, or las.", choices: ["Le lo doy", "Se lo doy", "Lo le doy", "Les lo doy"] },
  { level: 2, kind: "identify", prompt: "In “Se lo doy”, what did se replace?", answers: ["le", "les", "le or les"], explain: "Se here is not reflexive. It stands in for le or les.", choices: ["le or les", "a reflexive verb", "the direct object", "se from ser"] },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct. Replace both objects: Voy a dar el libro a María.", answers: ["Se lo voy a dar", "Voy a dárselo"], explain: "Before the conjugated verb, or attached to the infinitive. Both mean the same thing." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Voy a escribir la carta a Juan.", answers: ["Se la voy a escribir", "Voy a escribírsela"], explain: "Attached to the infinitive, the accent stays on the original stress: escribírsela." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Estoy comprando las flores a mis padres.", answers: ["Se las estoy comprando", "Estoy comprándoselas"], explain: "With a gerund, pronouns go before estoy or attach to the gerund." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Quiero explicar la idea a los estudiantes.", answers: ["Se la quiero explicar", "Quiero explicársela"], explain: "Quiero is conjugated, so the pronouns can sit in front of it or on explicar." },
  { level: 3, kind: "rewrite", prompt: "Affirmative tú command: Da el libro a María.", answers: ["Dáselo"], explain: "Affirmative commands attach pronouns at the end: dáselo." },
  { level: 3, kind: "rewrite", prompt: "Negative tú command: No des el libro a María.", answers: ["No se lo des"], explain: "Negative commands keep pronouns in front: no se lo des." },
  { level: 3, kind: "rewrite", prompt: "Affirmative tú command: Escribe la carta a Juan.", answers: ["Escríbesela"], explain: "Escribe + se + la keeps the stress: escríbesela." },
  { level: 3, kind: "rewrite", prompt: "Negative tú command: No escribas la carta a Juan.", answers: ["No se la escribas"], explain: "No, then se la, then the verb." },
  { level: 3, kind: "rewrite", prompt: "Affirmative tú command: Di el secreto a Ana.", answers: ["Díselo"], explain: "Di + se + lo is díselo." },
  { level: 3, kind: "rewrite", prompt: "Negative tú command: No digas el secreto a Ana.", answers: ["No se lo digas"], explain: "Negative: pronouns stay separate and in front." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Puedo prestar el coche a Luis.", answers: ["Se lo puedo prestar", "Puedo prestárselo"], explain: "Either before puedo or attached to prestar." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Tienes que mandar el paquete a ellos.", answers: ["Se lo tienes que mandar", "Tienes que mandárselo"], explain: "The conjugated verb is tienes. Mandar can carry the pronouns." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Estoy leyendo el cuento a la niña.", answers: ["Se lo estoy leyendo", "Estoy leyéndoselo"], explain: "Gerund attachment needs the accent: leyéndoselo." },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: Vamos a servir el café a los invitados.", answers: ["Se lo vamos a servir", "Vamos a servírselo"], explain: "Servir keeps its stress when pronouns attach: servírselo." },
  { level: 3, kind: "rewrite", prompt: "Affirmative tú command: Compra las entradas a tu hermano.", answers: ["Cómpraselas"], explain: "Compra + se + las is cómpraselas." },
  { level: 3, kind: "rewrite", prompt: "Negative tú command: No compres las entradas a tu hermano.", answers: ["No se las compres"], explain: "Negative commands never attach the pronouns." },
  { level: 3, kind: "rewrite", prompt: "Affirmative tú command: Pasa la sal a mí.", answers: ["Pásamela"], explain: "Me is the indirect pronoun and la is the salt. Pásamela." },
  { level: 3, kind: "order", prompt: "Put the negative command in order: des / se / no / lo", answers: ["No se lo des"], explain: "No, then se, then lo, then the verb.", choices: ["No se lo des", "No lo se des", "Se no lo des", "No des se lo"] },
  { level: 3, kind: "order", prompt: "Which pair both mean “I’m going to give it to her”?", answers: ["Se lo voy a dar and Voy a dárselo"], explain: "Same pronouns, two legal positions.", choices: ["Se lo voy a dar and Voy a dárselo", "Voy a se lo dar and Dárse lo voy", "Le lo voy a dar and Voy a darlelo", "Lo se voy a dar and Voy a losedar"] },
  { level: 3, kind: "identify", prompt: "Where do object pronouns go with a normal conjugated verb?", answers: ["before the verb", "Before the verb"], explain: "Lo veo, not veo lo.", choices: ["Before the verb", "After the verb, always", "Only attached", "Either, with no change in writing"] },
  { level: 3, kind: "identify", prompt: "Where do pronouns go on an affirmative command?", answers: ["attached to the command", "Attached to the end"], explain: "Cómpralo, dáselo. They attach, and the stress accent stays.", choices: ["Attached to the end", "Before the command", "After no", "They are dropped"] },
  { level: 3, kind: "identify", prompt: "Where do pronouns go on a negative command?", answers: ["before the verb", "Before the verb"], explain: "No lo compres. No se lo des.", choices: ["Before the verb", "Attached to the end", "After no, attached", "Between no and the verb, but after se only"] },
  { level: 3, kind: "rewrite", prompt: "Two answers are correct: ¿Puedes dar el libro a María?", answers: ["¿Se lo puedes dar?", "¿Puedes dárselo?"], explain: "Question marks are optional here. Both positions count." },
  { level: 3, kind: "rewrite", prompt: "Rewrite with pronouns in front: Estoy preparando la cena para ellos.", answers: ["Se la estoy preparando"], explain: "Cena is la. Para ellos becomes se. One position is enough; the other is also fine if you type Estoy preparándosela.", choices: undefined },
];

SEEDS[SEEDS.length - 1] = {
  level: 3,
  kind: "rewrite",
  prompt: "Two answers are correct: Estoy preparando la cena para ellos.",
  answers: ["Se la estoy preparando", "Estoy preparándosela"],
  explain: "Cena is feminine singular. Para ellos becomes se.",
};

export const PRONOUN_EXERCISES: PronounExercise[] = SEEDS.map((seed, index) => ({
  id: `p${String(index + 1).padStart(2, "0")}`,
  ...seed,
}));

export const PRONOUN_GUIDE: { heading: string; text: string; examples: { es: string; en: string }[] }[] = [
  {
    heading: "Direct object",
    text: "The direct object is the person or thing the verb acts on. Replace it with me, te, lo, la, nos, os, los, or las. Lo and la mean him, her, it, or you (usted). A specific person still needed personal a in the original sentence: veo a María, la veo.",
    examples: [
      { es: "Veo a María. La veo.", en: "I see María. I see her." },
      { es: "Busco las llaves. Las busco.", en: "I’m looking for the keys. I’m looking for them." },
    ],
  },
  {
    heading: "Indirect object",
    text: "The indirect object is who receives it or benefits. Use me, te, le, nos, os, or les. Le is for one person, including usted. Les is for more than one.",
    examples: [
      { es: "Doy el libro a María. Le doy el libro.", en: "I give the book to María. I give her the book." },
      { es: "Escribo a mis padres. Les escribo.", en: "I write to my parents. I write to them." },
    ],
  },
  {
    heading: "Le and les become se",
    text: "When le or les would sit right in front of lo, la, los, or las, it changes to se. Le lo is not Spanish. The order is always indirect, then direct: se lo, me la, te los.",
    examples: [
      { es: "Le doy el libro a María. Se lo doy.", en: "I give the book to María. I give it to her." },
      { es: "Les compro flores. Se las compro.", en: "I buy them flowers. I buy them for them." },
    ],
  },
  {
    heading: "Where the pronouns sit",
    text: "Before a conjugated verb: lo veo. Attached to an infinitive, a gerund, or an affirmative command: voy a verlo, or lo voy a ver; estoy viéndolo, or lo estoy viendo; cómpralo. Negative commands keep them in front: no lo compres. Attaching pronouns does not move the stress, so an accent often appears: dárselo, comprándoselas.",
    examples: [
      { es: "Se lo voy a dar. Voy a dárselo.", en: "Both mean I’m going to give it to her." },
      { es: "Dáselo. No se lo des.", en: "Give it to her. Don’t give it to her." },
    ],
  },
  {
    heading: "Personal a",
    text: "When the direct object is a specific person or pet, Spanish puts a in front of it. It is not the same as a place. It disappears when the person becomes a pronoun.",
    examples: [
      { es: "Veo a Carlos. Lo veo.", en: "I see Carlos. I see him." },
      { es: "Busco un médico. Busco al médico.", en: "I’m looking for a doctor (any). I’m looking for the doctor (that one)." },
    ],
  },
];
