(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ProjectNosotrosLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const categories = {
    comunicacion: { label: "Comunicación", prompt: "Cómo se escuchan, expresan y reparan." },
    afecto: { label: "Afecto", prompt: "Cómo dan y reciben cariño." },
    conflicto: { label: "Conflictos", prompt: "Cómo cuidan el vínculo cuando hay tensión." },
    confianza: { label: "Confianza", prompt: "Acuerdos, seguridad y límites." },
    futuro: { label: "Proyecto de vida", prompt: "Las decisiones que construyen en conjunto." },
    dinero: { label: "Dinero", prompt: "Hábitos, transparencia y prioridades." },
    intimidad: { label: "Intimidad", prompt: "Deseo, conversación y consentimiento." },
    autonomia: { label: "Autonomía", prompt: "Espacio individual y vida compartida." },
    valores: { label: "Valores", prompt: "Principios, familia y decisiones importantes." },
    seguridad: { label: "Bienestar personal", prompt: "Preguntas privadas que solo verás tú." }
  };

  const statements = [
    ["comunicacion", "Puedo expresar lo que necesito sin esperar que mi pareja lo adivine."],
    ["comunicacion", "Me siento escuchado/a incluso cuando pensamos distinto."],
    ["comunicacion", "Podemos hablar de temas difíciles sin humillarnos ni atacarnos."],
    ["comunicacion", "Cuando algo me incomoda, lo converso antes de acumular resentimiento."],
    ["afecto", "Recibo afecto de una forma que realmente me hace sentir querido/a."],
    ["afecto", "Expreso admiración y gratitud por mi pareja con frecuencia."],
    ["afecto", "Conozco los gestos pequeños que hacen sentir especial a mi pareja."],
    ["afecto", "Siento que el cariño cotidiano existe también fuera de las fechas especiales."],
    ["conflicto", "Podemos pedir una pausa sin usar el silencio como castigo."],
    ["conflicto", "Después de discutir, sabemos reparar y retomar la cercanía."],
    ["conflicto", "Puedo reconocer mi parte del problema y pedir perdón de forma concreta."],
    ["conflicto", "Nuestros desacuerdos terminan en acuerdos o aprendizajes claros."],
    ["confianza", "Tenemos límites explícitos sobre coqueteo, amistades y exparejas."],
    ["confianza", "La privacidad digital no se usa para controlar ni ocultar acuerdos rotos."],
    ["confianza", "Puedo expresar celos o inseguridad sin convertirlos en prohibiciones."],
    ["confianza", "Confío en que mi pareja dirá la verdad aunque sea una conversación incómoda."],
    ["futuro", "Tenemos una imagen compatible de cómo quisiéramos vivir en cinco años."],
    ["futuro", "Podemos convertir nuestros sueños en metas con fechas y responsabilidades."],
    ["futuro", "Hemos hablado con claridad sobre convivencia, matrimonio o formas de compromiso."],
    ["futuro", "Nuestras decisiones profesionales pueden conversarse como un proyecto de equipo."],
    ["dinero", "Podemos hablar de ingresos, deudas y gastos sin vergüenza ni evasión."],
    ["dinero", "Tenemos criterios compatibles sobre ahorro, disfrute y prioridades."],
    ["dinero", "La distribución de gastos nos parece justa a ambos."],
    ["dinero", "Ninguno usa el dinero para controlar las decisiones del otro."],
    ["intimidad", "Puedo conversar abierta y respetuosamente sobre mis necesidades sexuales."],
    ["intimidad", "Un no sexual se acepta sin insistencia, castigo ni presión."],
    ["intimidad", "Podemos hablar de curiosidades o fantasías sin obligación de realizarlas."],
    ["intimidad", "Cuidamos el coqueteo, la ternura y la seducción fuera del encuentro sexual."],
    ["autonomia", "Puedo tener tiempo individual sin que se interprete como rechazo."],
    ["autonomia", "Cada persona conserva amistades y aficiones propias."],
    ["autonomia", "Equilibramos los planes compartidos con el descanso y el espacio personal."],
    ["autonomia", "Podemos viajar o hacer planes por separado respetando nuestros acuerdos."],
    ["valores", "Podemos conversar sobre creencias y valores aunque no pensemos igual."],
    ["valores", "Tenemos límites claros para que las familias no decidan por nosotros."],
    ["valores", "Las decisiones importantes se toman de forma conjunta."],
    ["valores", "Coincidimos en los valores que quisiéramos transmitir a una familia."],
    ["seguridad", "Puedo decir que no sin miedo a represalias, burlas o presión.", true],
    ["seguridad", "Me siento libre de mantener contacto con personas importantes para mí.", true],
    ["seguridad", "Nunca temo la reacción de mi pareja al expresar un límite o desacuerdo.", true]
  ].map(([category, label, localOnly], index) => ({ id: `s${index}`, category, label, localOnly: Boolean(localOnly) }));

  const scenarios = [
    { id: "relationship", category: "confianza", label: "¿Qué modelo de relación deseas actualmente?", options: ["Monogamia romántica y sexual", "Exclusividad con acuerdos específicos", "Relación abierta consensuada", "Poliamor o vínculos múltiples", "Todavía lo estoy explorando"] },
    { id: "kiss", category: "confianza", label: "¿Un beso con otra persona se consideraría infidelidad?", options: ["Sí, siempre sin acuerdo previo", "Depende de acuerdos explícitos", "No lo considero infidelidad", "Necesito conversarlo"] },
    { id: "flirt", category: "confianza", label: "¿Qué esperas frente al coqueteo con terceros?", options: ["Cruza un límite", "Depende del contexto e intención", "Lo acepto si hay honestidad", "No tengo una posición definida"] },
    { id: "privacy", category: "confianza", label: "¿Qué acuerdo de privacidad digital prefieres?", options: ["Celulares privados", "Acceso voluntario, nunca exigido", "Transparencia sin revisar dispositivos", "Aún necesitamos definirlo"] },
    { id: "desire", category: "intimidad", label: "Si sus niveles de deseo son distintos, ¿qué ayudaría más?", options: ["Conversar sin presión y buscar alternativas", "Planear cercanía sin obligación sexual", "Explorar formas distintas de intimidad", "Buscar apoyo especializado si nos afecta"] },
    { id: "conflict", category: "conflicto", label: "Cuando una discusión se intensifica prefiero…", options: ["Hablarlo en el momento", "Pausar y retomarlo con una hora acordada", "Escribir primero y luego hablar", "Buscar apoyo si se vuelve recurrente"] },
    { id: "expenses", category: "dinero", label: "¿Cómo prefieres repartir los gastos compartidos?", options: ["Mitad y mitad", "Proporcional a ingresos", "Según las circunstancias", "Fondo común con presupuesto"] },
    { id: "housing", category: "futuro", label: "Sobre vivienda en los próximos años prefiero…", options: ["Ahorrar para comprar", "Arrendar y mantener flexibilidad", "Vivir juntos sin fecha rígida", "Todavía no deseo convivir"] },
    { id: "children", category: "futuro", label: "¿Qué lugar tienen los hijos en tu plan de vida?", options: ["Quiero tener hijos", "No quiero tener hijos", "Estoy indeciso/a", "Depende de condiciones que debemos conversar"] },
    { id: "home", category: "futuro", label: "Al vivir juntos, ¿qué quieres cuidar más?", options: ["Orden y organización", "Distribución justa del trabajo", "Flexibilidad y calidez", "Independencia y espacios propios"] },
    { id: "career", category: "futuro", label: "Si aparece una gran oportunidad laboral, preferiría…", options: ["Priorizar lo mejor para ambos", "Dar prioridad a quien recibe la oferta", "Preservar la estabilidad compartida", "Buscar otra alternativa"] },
    { id: "free", category: "autonomia", label: "Para el tiempo libre ideal priorizo…", options: ["Salir y conocer lugares", "Planes tranquilos en casa", "Amigos y vida social", "Equilibrio entre juntos e individuales"] }
  ];

  const openQuestions = [
    { id: "dream", label: "¿Cómo imaginas un día normal de nuestra vida en cinco años?" },
    { id: "need", label: "¿Qué necesitas de mí que no siempre sabes pedir?" },
    { id: "effort", label: "¿Qué acción concreta estás dispuesto/a a sostener por la relación?" },
    { id: "fear", label: "¿Qué te preocupa de convivir o comprometer nuestras finanzas?" },
    { id: "boundaries", label: "¿Qué conductas consideras infidelidad emocional, digital o física?" },
    { id: "intimacy", label: "¿Qué conversación íntima quisieras poder tener sin sentirte juzgado/a?" }
  ];

  function emptyAnswers() {
    return { ratings: {}, importance: {}, choices: {}, open: {}, privateRatings: {} };
  }

  function normalizeAnswers(input) {
    const source = input || {};
    return {
      ratings: { ...(source.ratings || {}) },
      importance: { ...(source.importance || {}) },
      choices: { ...(source.choices || {}) },
      open: { ...(source.open || {}) },
      privateRatings: { ...(source.privateRatings || {}) }
    };
  }

  function answeredCount(answers) {
    const a = normalizeAnswers(answers);
    return statements.filter(q => (q.localOnly ? a.privateRatings[q.id] : a.ratings[q.id]) != null).length
      + scenarios.filter(q => a.choices[q.id] != null).length
      + openQuestions.filter(q => String(a.open[q.id] || "").trim().length > 0).length;
  }

  function totalQuestions() { return statements.length + scenarios.length + openQuestions.length; }
  function isComplete(answers) { return answeredCount(answers) === totalQuestions(); }

  function round(value) { return Math.round(value * 10) / 10; }

  function buildReport(firstInput, secondInput, namesInput) {
    const first = normalizeAnswers(firstInput);
    const second = normalizeAnswers(secondInput);
    const names = namesInput && namesInput.length === 2 ? namesInput : ["Persona 1", "Persona 2"];
    const sharedCategories = Object.keys(categories).filter(key => key !== "seguridad");
    const rows = sharedCategories.map(category => {
      const items = statements.filter(q => q.category === category && !q.localOnly && first.ratings[q.id] && second.ratings[q.id]);
      const scores = items.map(item => {
        const gap = Math.abs(Number(first.ratings[item.id]) - Number(second.ratings[item.id]));
        const importance = ((Number(first.importance[item.id] || 2) + Number(second.importance[item.id] || 2)) / 4);
        return { gap, fit: Math.max(0, 100 - gap * 25), weight: .75 + importance * .5 };
      });
      const weight = scores.reduce((sum, item) => sum + item.weight, 0) || 1;
      const fit = scores.reduce((sum, item) => sum + item.fit * item.weight, 0) / weight;
      const gap = scores.reduce((sum, item) => sum + item.gap, 0) / Math.max(scores.length, 1);
      const avg1 = items.reduce((sum, item) => sum + Number(first.ratings[item.id]), 0) / Math.max(items.length, 1);
      const avg2 = items.reduce((sum, item) => sum + Number(second.ratings[item.id]), 0) / Math.max(items.length, 1);
      return { category, label: categories[category].label, prompt: categories[category].prompt, fit: round(fit), gap: round(gap), avg1: round(avg1), avg2: round(avg2) };
    });
    const overall = round(rows.reduce((sum, row) => sum + row.fit, 0) / Math.max(rows.length, 1));
    const strengths = [...rows].sort((a, b) => b.fit - a.fit).slice(0, 3);
    const conversations = [...rows].sort((a, b) => b.gap - a.gap).slice(0, 3);
    const agreements = scenarios.map(item => ({
      id: item.id,
      label: item.label,
      first: item.options[first.choices[item.id]] || "Sin respuesta",
      second: item.options[second.choices[item.id]] || "Sin respuesta",
      same: first.choices[item.id] === second.choices[item.id]
    }));
    const agreementRate = round(agreements.filter(item => item.same).length / Math.max(agreements.length, 1) * 100);
    return { names, overall, rows, strengths, conversations, agreements, agreementRate, open: [first.open, second.open] };
  }

  return { categories, statements, scenarios, openQuestions, emptyAnswers, normalizeAnswers, answeredCount, totalQuestions, isComplete, buildReport };
});
