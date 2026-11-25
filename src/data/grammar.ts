export interface GrammarExample {
  es: string;
  en: string;
}

export interface GrammarBlock {
  heading: string;
  text: string;
  examples: GrammarExample[];
}

export interface GrammarQuestion {
  prompt: string;
  answers: string[];
  explain: string;
  choices?: string[];
}

export interface GrammarLesson {
  id: string;
  title: string;
  summary: string;
  blocks: GrammarBlock[];
  questions: GrammarQuestion[];
  lemmas: string[];
}

export const GRAMMAR: GrammarLesson[] = [
  {
    id: "ser-estar",
    title: "Ser and estar",
    summary: "Both mean “to be”. Ser is what something is. Estar is how or where it is right now.",
    lemmas: ["ser", "estar"],
    blocks: [
      {
        heading: "Ser",
        text: "Use ser for identity, origin, time, possession, and what something is made of. Traits that define a person also take ser: es alto, es amable.",
        examples: [
          { es: "Soy de Texas.", en: "I’m from Texas." },
          { es: "La puerta es de madera.", en: "The door is made of wood." },
          { es: "Son las tres.", en: "It’s three o’clock." },
        ],
      },
      {
        heading: "Estar",
        text: "Use estar for location, temporary conditions, emotions, and the result of a change. Estar + gerund is the progressive: está lloviendo.",
        examples: [
          { es: "Estoy en casa.", en: "I’m at home." },
          { es: "Está cansada.", en: "She’s tired." },
          { es: "La tienda está cerrada.", en: "The shop is closed." },
        ],
      },
      {
        heading: "Same adjective, different meaning",
        text: "Some adjectives change meaning. Ser aburrido means boring as a trait. Estar aburrido means bored right now. Ser listo means clever. Estar listo means ready.",
        examples: [
          { es: "El libro es aburrido.", en: "The book is boring." },
          { es: "Estoy aburrido.", en: "I’m bored." },
        ],
      },
    ],
    questions: [
      { prompt: "I’m from Mexico. ___ de México.", answers: ["Soy"], explain: "Origin takes ser.", choices: ["Soy", "Estoy", "Es", "Está"] },
      { prompt: "The keys are on the table. Las llaves ___ en la mesa.", answers: ["están"], explain: "Location of things takes estar.", choices: ["están", "son", "están siendo", "es"] },
      { prompt: "She’s tired today. Ella ___ cansada.", answers: ["está"], explain: "A temporary condition takes estar.", choices: ["está", "es", "está ser", "son"] },
      { prompt: "He’s a doctor. Él ___ médico.", answers: ["es"], explain: "A profession or identity takes ser.", choices: ["es", "está", "es estar", "está siendo"] },
      { prompt: "The soup is cold (right now). La sopa ___ fría.", answers: ["está"], explain: "How the soup is at this moment takes estar. Ser fría would describe what kind of soup it is.", choices: ["está", "es", "está ser", "son"] },
      { prompt: "Type the verb: It is three o’clock. ___ las tres.", answers: ["Son"], explain: "Clock time takes ser." },
    ],
  },
  {
    id: "por-para",
    title: "Por and para",
    summary: "Por is cause, exchange, duration, and movement through. Para is goal, recipient, deadline, and destination.",
    lemmas: ["por", "para"],
    blocks: [
      {
        heading: "Para",
        text: "Para points forward: the purpose, the person something is for, a deadline, or a destination.",
        examples: [
          { es: "Este regalo es para ti.", en: "This gift is for you." },
          { es: "Estudio para aprender.", en: "I study in order to learn." },
          { es: "Lo necesito para el viernes.", en: "I need it by Friday." },
        ],
      },
      {
        heading: "Por",
        text: "Por looks at cause, thanks, exchange, how long, and the path through a place. It also means “per”.",
        examples: [
          { es: "Gracias por la ayuda.", en: "Thanks for the help." },
          { es: "Caminamos por el parque.", en: "We walked through the park." },
          { es: "Te doy diez por ese libro.", en: "I’ll give you ten for that book." },
        ],
      },
    ],
    questions: [
      { prompt: "This coffee is for Ana. Este café es ___ Ana.", answers: ["para"], explain: "The recipient takes para.", choices: ["para", "por", "a", "de"] },
      { prompt: "Thanks for the coffee. Gracias ___ el café.", answers: ["por"], explain: "The cause of the thanks is por.", choices: ["por", "para", "de", "con"] },
      { prompt: "I need it by Monday. Lo necesito ___ el lunes.", answers: ["para"], explain: "A deadline takes para.", choices: ["para", "por", "en", "a"] },
      { prompt: "We drove through the city. Manejamos ___ la ciudad.", answers: ["por"], explain: "Movement through a place takes por.", choices: ["por", "para", "hacia", "en"] },
      { prompt: "I’m learning Spanish in order to travel. Estudio español ___ viajar.", answers: ["para"], explain: "Purpose takes para.", choices: ["para", "por", "de", "a"] },
      { prompt: "They paid twenty dollars for the shirt. Pagaron veinte dólares ___ la camisa.", answers: ["por"], explain: "Exchange takes por." },
    ],
  },
  {
    id: "preterite-imperfect",
    title: "Preterite and imperfect",
    summary: "Preterite is a finished event. Imperfect is the background: what used to happen, or what was going on.",
    lemmas: ["ayer", "siempre"],
    blocks: [
      {
        heading: "Preterite",
        text: "Use the preterite for a completed action, especially with a clear endpoint: ayer, anoche, el lunes, de repente.",
        examples: [
          { es: "Ayer comí tacos.", en: "Yesterday I ate tacos." },
          { es: "Llegó a las ocho.", en: "She arrived at eight." },
        ],
      },
      {
        heading: "Imperfect",
        text: "Use the imperfect for habits, descriptions, time, age, and weather in the past, and for what was already in progress when something else happened.",
        examples: [
          { es: "De niño jugaba en la calle.", en: "As a kid I used to play in the street." },
          { es: "Llovía cuando salí.", en: "It was raining when I left." },
        ],
      },
    ],
    questions: [
      { prompt: "Yesterday I bought bread. Ayer ___ pan.", answers: ["compré"], explain: "A finished action yesterday is preterite.", choices: ["compré", "compraba", "compraré", "compre"] },
      { prompt: "When I was a child I lived here. De niño ___ aquí.", answers: ["vivía"], explain: "An ongoing past situation is imperfect.", choices: ["vivía", "viví", "vivo", "viviera"] },
      { prompt: "It was raining when the bus arrived. ___ cuando llegó el autobús.", answers: ["Llovía"], explain: "The rain was the background. The arrival is the finished event.", choices: ["Llovía", "Llovió", "Llueve", "Ha llovido"] },
      { prompt: "She arrived at eight. ___ a las ocho.", answers: ["Llegó"], explain: "A single completed arrival is preterite.", choices: ["Llegó", "Llegaba", "Llega", "Llegara"] },
      { prompt: "We always used to walk. Siempre ___ a pie.", answers: ["íbamos"], explain: "A repeated past habit is imperfect.", choices: ["íbamos", "fuimos", "vamos", "iremos"] },
      { prompt: "Type the preterite of hablar for yo: yesterday I spoke.", answers: ["hablé"], explain: "Hablé is the completed event. Hablaba would be “I was speaking” or “I used to speak”." },
    ],
  },
  {
    id: "subjunctive",
    title: "When to use the subjunctive",
    summary: "After a wish, a doubt, an emotion, or a judgment about another person’s action, the second verb is often subjunctive.",
    lemmas: ["querer", "esperar", "dudar"],
    blocks: [
      {
        heading: "Two clauses",
        text: "The usual shape is: a conjugated trigger + que + subjunctive. Quiero que vengas. The subject of the second verb is someone else. If it is the same person, Spanish often uses an infinitive instead: Quiero venir.",
        examples: [
          { es: "Quiero que vengas.", en: "I want you to come." },
          { es: "Espero que estés bien.", en: "I hope you’re well." },
          { es: "Dudo que sea verdad.", en: "I doubt it’s true." },
        ],
      },
      {
        heading: "Not after certainty",
        text: "Creo que viene uses the indicative, because you take it as real. No creo que venga switches to the subjunctive. Es verdad que está aquí stays indicative.",
        examples: [
          { es: "Creo que viene.", en: "I think she’s coming." },
          { es: "No creo que venga.", en: "I don’t think she’s coming." },
        ],
      },
    ],
    questions: [
      { prompt: "I want you to come. Quiero que ___.", answers: ["vengas"], explain: "A wish about another person takes the present subjunctive.", choices: ["vengas", "vienes", "venir", "vienes tú"] },
      { prompt: "I hope she is well. Espero que ___ bien.", answers: ["esté"], explain: "Esperar que + subjunctive.", choices: ["esté", "está", "estar", "estará"] },
      { prompt: "I doubt it’s true. Dudo que ___ verdad.", answers: ["sea"], explain: "Doubt triggers the subjunctive: sea, not es.", choices: ["sea", "es", "está", "ser"] },
      { prompt: "I think she is coming (you believe it). Creo que ___.", answers: ["viene"], explain: "Belief stated as fact stays indicative.", choices: ["viene", "venga", "venir", "venga ella"] },
      { prompt: "It’s important that you rest. Es importante que ___.", answers: ["descanses"], explain: "Impersonal judgments about someone else’s action take the subjunctive.", choices: ["descanses", "descansas", "descansar", "descansa"] },
      { prompt: "Same subject, so no subjunctive: I want to leave. Quiero ___.", answers: ["salir"], explain: "When the person who wants and the person who leaves are the same, use the infinitive." },
    ],
  },
  {
    id: "gustar",
    title: "Gustar and verbs like it",
    summary: "Gustar means “to be pleasing to”. The thing liked is the subject. The person is an indirect object: me, te, le, nos, os, les.",
    lemmas: ["gustar", "encantar", "doler", "faltar", "importar"],
    blocks: [
      {
        heading: "The shape",
        text: "Me gusta el café. Café is singular, so gusta. Me gustan los tacos. Tacos is plural, so gustan. To name the person after le or les, add a: A María le gusta el té.",
        examples: [
          { es: "Me gusta el café.", en: "I like coffee." },
          { es: "Me gustan los tacos.", en: "I like tacos." },
          { es: "A ella le duelen los pies.", en: "Her feet hurt." },
        ],
      },
      {
        heading: "The family",
        text: "Encantar, doler, faltar, importar, interesar, molestar, and quedar follow the same pattern. The verb agrees with the thing, not with the person.",
        examples: [
          { es: "Nos encanta esta canción.", en: "We love this song." },
          { es: "Te faltan dos libros.", en: "You’re missing two books." },
        ],
      },
    ],
    questions: [
      { prompt: "I like the book. Me ___ el libro.", answers: ["gusta"], explain: "Libro is singular, so gusta.", choices: ["gusta", "gustan", "gusto", "gustas"] },
      { prompt: "I like the books. Me ___ los libros.", answers: ["gustan"], explain: "Libros is plural, so gustan.", choices: ["gustan", "gusta", "gusto", "gustamos"] },
      { prompt: "María likes tea. A María ___ gusta el té.", answers: ["le"], explain: "María is the indirect object: le.", choices: ["le", "la", "se", "lo"] },
      { prompt: "My feet hurt. Me ___ los pies.", answers: ["duelen"], explain: "Pies is plural, so duelen.", choices: ["duelen", "duele", "duelo", "dueles"] },
      { prompt: "We love this city. Nos ___ esta ciudad.", answers: ["encanta"], explain: "Ciudad is singular: encanta.", choices: ["encanta", "encantan", "encantamos", "encanto"] },
      { prompt: "Type the pronoun: They like the movie. ___ gusta la película. (ellos)", answers: ["Les"], explain: "Ellos takes les. The movie is singular, so gusta stays singular." },
    ],
  },
  {
    id: "reflexive",
    title: "Reflexive verbs",
    summary: "A reflexive verb uses me, te, se, nos, or os when the subject does the action to themself. The pronoun matches the subject.",
    lemmas: ["llamar", "levantar", "ir"],
    blocks: [
      {
        heading: "Daily routine",
        text: "Me levanto, te duchas, se viste. The infinitive ends in -se: levantarse. Drop -se and conjugate the verb, then add the matching pronoun in front.",
        examples: [
          { es: "Me llamo Chase.", en: "My name is Chase." },
          { es: "Nos despertamos a las seis.", en: "We wake up at six." },
        ],
      },
      {
        heading: "Not always “self”",
        text: "Some verbs simply change meaning with se. Ir is to go. Irse is to leave. Dormir is to sleep. Dormirse is to fall asleep. Quedar is to arrange or to be located. Quedarse is to stay.",
        examples: [
          { es: "El tren se fue.", en: "The train left." },
          { es: "Me dormí en el sofá.", en: "I fell asleep on the sofa." },
        ],
      },
    ],
    questions: [
      { prompt: "I get up at seven. ___ levanto a las siete.", answers: ["Me"], explain: "Yo matches me.", choices: ["Me", "Te", "Se", "Nos"] },
      { prompt: "She sits down. Ella ___ sienta.", answers: ["se"], explain: "Ella matches se.", choices: ["se", "la", "le", "me"] },
      { prompt: "We leave now. ___ vamos ahora. (irse)", answers: ["Nos"], explain: "Irse: nosotros nos vamos.", choices: ["Nos", "Se", "Me", "Os"] },
      { prompt: "What is the infinitive of me acuesto?", answers: ["acostarse"], explain: "Acostarse is to go to bed." },
      { prompt: "Affirmative tú command of lavarse.", answers: ["Lávate"], explain: "The pronoun attaches to an affirmative command: lávate." },
      { prompt: "Negative tú command of lavarse.", answers: ["No te laves"], explain: "Negative commands keep the pronoun in front." },
    ],
  },
  {
    id: "comparatives",
    title: "Comparatives",
    summary: "Más … que is more than. Menos … que is less than. Tan … como is as … as. A few adjectives are irregular.",
    lemmas: ["más", "menos", "mejor", "peor"],
    blocks: [
      {
        heading: "The regular pattern",
        text: "Put más or menos before the adjective, adverb, or noun, and que before the other thing. Tan and tanto use como, not que.",
        examples: [
          { es: "Ana es más alta que Luis.", en: "Ana is taller than Luis." },
          { es: "Tengo menos tiempo que tú.", en: "I have less time than you." },
          { es: "Es tan fácil como parece.", en: "It’s as easy as it looks." },
        ],
      },
      {
        heading: "Irregular forms",
        text: "Better is mejor, not más bueno. Worse is peor. Older for people is mayor. Younger is menor. These still use que.",
        examples: [
          { es: "Este café es mejor que el otro.", en: "This coffee is better than the other one." },
          { es: "Hoy me siento peor.", en: "I feel worse today." },
        ],
      },
    ],
    questions: [
      { prompt: "Which sentence says Ana is taller than Luis?", answers: ["Ana es más alta que Luis"], explain: "Más before the adjective, que before the person.", choices: ["Ana es más alta que Luis", "Ana es más alta como Luis", "Ana es tan alta que Luis", "Ana está más alta que Luis"] },
      { prompt: "This one is better. Este es ___.", answers: ["mejor"], explain: "Mejor already means better. Don’t say más mejor.", choices: ["mejor", "más bueno", "más mejor", "tan bueno"] },
      { prompt: "I have as many books as you. Tengo ___ libros ___ tú.", answers: ["tantos como"], explain: "Tanto agrees with the noun, and the second half is como.", choices: ["tantos como", "tan como", "tantos que", "más como"] },
      { prompt: "Today is worse than yesterday. Hoy es ___ que ayer.", answers: ["peor"], explain: "Peor is the irregular comparative of malo.", choices: ["peor", "más malo", "menos peor", "tan mal"] },
      { prompt: "She is less tired than I am. Está ___ cansada que yo.", answers: ["menos"], explain: "Menos … que is less than.", choices: ["menos", "más", "tan", "poco"] },
      { prompt: "Type the comparison: as easy as. tan fácil ___.", answers: ["como"], explain: "Tan and tanto pair with como, not que." },
    ],
  },
  {
    id: "personal-a",
    title: "Personal a",
    summary: "A specific person or pet used as a direct object is introduced by a. The a disappears when you replace the person with lo, la, los, or las.",
    lemmas: ["a"],
    blocks: [
      {
        heading: "When to use it",
        text: "Use it with a known person: veo a María, llamo a mi padre, busco al médico. Skip it for things: veo la casa, busco las llaves. An unspecified person often skips it too: necesito un asistente.",
        examples: [
          { es: "Llamo a mi madre. La llamo.", en: "I call my mother. I call her." },
          { es: "No conozco a tus amigos.", en: "I don’t know your friends." },
        ],
      },
    ],
    questions: [
      { prompt: "I see María. Veo ___ María.", answers: ["a"], explain: "A specific person as direct object takes a.", choices: ["a", "—", "de", "para"] },
      { prompt: "I see the house. Veo ___ casa.", answers: ["la"], explain: "A thing takes its article, not personal a.", choices: ["la", "a la", "a", "el"] },
      { prompt: "Which sentence is right for one specific doctor?", answers: ["Busco al médico"], explain: "Al combines a + el for a specific person.", choices: ["Busco al médico", "Busco el médico", "Busco a el médico", "Busco médico a"] },
      { prompt: "Rewrite with a pronoun: Veo a Carlos.", answers: ["Lo veo"], explain: "The personal a drops out. Carlos is lo." },
      { prompt: "I need a tutor (any tutor). Necesito ___ tutor.", answers: ["un"], explain: "An unspecified role often has no personal a.", choices: ["un", "a un", "al", "a"] },
    ],
  },
  {
    id: "commands",
    title: "Commands",
    summary: "Tú commands use the él form of the present for regular verbs. Negative tú commands use the present subjunctive. Pronouns attach only to affirmative commands.",
    lemmas: ["dar", "decir", "hacer", "poner", "salir", "ser", "tener", "venir", "ir"],
    blocks: [
      {
        heading: "Tú",
        text: "Habla. Come. Escribe. The negative flips to the subjunctive: no hables, no comas, no escribas. Eight very common verbs are short: di, haz, ve, pon, sal, sé, ten, ven.",
        examples: [
          { es: "Habla más despacio.", en: "Speak more slowly." },
          { es: "No hables tan rápido.", en: "Don’t speak so fast." },
          { es: "Dime la verdad.", en: "Tell me the truth." },
        ],
      },
      {
        heading: "Usted and ustedes",
        text: "Both come from the present subjunctive. Hable usted. Hablen ustedes. Negatives just add no: no hable, no hablen.",
        examples: [
          { es: "Hable más alto, por favor.", en: "Please speak louder." },
          { es: "Siéntense.", en: "Sit down (ustedes)." },
        ],
      },
    ],
    questions: [
      { prompt: "Tú command of hablar.", answers: ["Habla"], explain: "Affirmative tú uses the él present: habla.", choices: ["Habla", "Hables", "Hablas", "Hable"] },
      { prompt: "Negative tú command of hablar.", answers: ["No hables"], explain: "Negative tú uses the subjunctive.", choices: ["No hables", "No habla", "No hablas", "No hable"] },
      { prompt: "Tú command of poner.", answers: ["Pon"], explain: "Poner is irregular: pon, not pone." },
      { prompt: "Tú command of decir, with me attached.", answers: ["Dime"], explain: "Di + me. No accent, because dime is stressed on the first syllable naturally." },
      { prompt: "Usted command of sentarse.", answers: ["Siéntese"], explain: "Subjunctive siénte? The usted form is siéntese, from siente with se attached.", choices: ["Siéntese", "Siéntate", "Se siente usted no", "Siente se"] },
      { prompt: "Negative usted command: don’t give it to her. (dar, se lo)", answers: ["No se lo dé"], explain: "Negative usted uses the subjunctive dé, with pronouns in front." },
    ],
  },
];

export function lessonForLemma(lemma: string): GrammarLesson | undefined {
  const key = lemma.toLowerCase();
  return GRAMMAR.find((lesson) => lesson.lemmas.includes(key));
}
