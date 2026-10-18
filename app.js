(function () {
  "use strict";

  const L = window.ProjectNosotrosLogic;
  const C = window.ProjectNosotrosCloud;
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const localKey = "proyecto-nosotros:v3";
  const sessionKey = "proyecto-nosotros:session";
  const queryPair = new URLSearchParams(location.search).get("pair");
  let cloud;
  let state = { mode: null, names: ["", ""], slot: 0, pairId: null, answers: L.emptyAnswers(), cursor: 0, done: false };
  let saveTimer;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function focusMain() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => app.focus({ preventScroll: true }), 80);
  }

  function getLocal() {
    try { return JSON.parse(localStorage.getItem(localKey)); } catch (_) { return null; }
  }

  function saveSession() {
    sessionStorage.setItem(sessionKey, JSON.stringify({ mode: state.mode, names: state.names, slot: state.slot, pairId: state.pairId, cursor: state.cursor }));
  }

  function saveLocalAnswers() {
    const local = getLocal();
    if (!local) return;
    local.answers[state.slot] = state.answers;
    local.cursor[state.slot] = state.cursor;
    localStorage.setItem(localKey, JSON.stringify(local));
  }

  function scheduleSave() {
    saveSession();
    if (state.mode === "local") saveLocalAnswers();
    if (state.mode === "cloud" && state.pairId) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          cloud = cloud || await C.connect();
          await cloud.save(state.pairId, state.slot, state.answers);
        } catch (error) { showToast(`No se pudo sincronizar: ${error.message}`); }
      }, 650);
    }
  }

  function welcome(errorMessage) {
    const existing = getLocal();
    const joining = Boolean(queryPair);
    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Una conversación que vale la pena</p>
        <h1>Dos formas de querer.<br><span class="accent">Un proyecto común.</span></h1>
        <p class="lead">Respondan por separado. Comparen expectativas solo cuando ambos terminen. Transformen las diferencias en conversaciones claras.</p>
      </section>
      <section class="card setup">
        <h3>${joining ? "Te invitaron a un espacio privado" : "Creen su espacio"}</h3>
        <p class="lead" style="margin:8px 0 0;font-size:.95rem">No hay respuestas correctas. Importa responder con honestidad y sin presión.</p>
        ${errorMessage ? `<p class="note error" style="margin-top:18px">${escapeHtml(errorMessage)}</p>` : ""}
        <div class="setup-grid">
          <div class="field"><label for="name-a">Tu nombre</label><input id="name-a" type="text" maxlength="40" autocomplete="name" placeholder="Ej. Nicolás"></div>
          <div class="field"><label for="name-b">Nombre de tu pareja</label><input id="name-b" type="text" maxlength="40" placeholder="Ej. Nicole"></div>
        </div>
        <label class="consent"><input id="consent" type="checkbox"> <span>Quiero responder voluntariamente y entiendo que el resultado sirve para conversar, no para vigilar, diagnosticar ni presionar a nadie.</span></label>
        <div class="actions">
          ${joining ? `<button class="button" id="join">Aceptar invitación</button>` : `<button class="button" id="create">Crear espacio privado</button>`}
          ${!joining ? `<button class="button secondary" id="local">Probar en este dispositivo</button>` : ""}
          ${existing && !joining ? `<button class="button quiet" id="resume">Continuar prueba guardada</button>` : ""}
        </div>
        <p class="note" style="margin-top:22px"><strong>Privacidad:</strong> las preguntas sobre seguridad y capacidad de decir “no” permanecen solo en este navegador y nunca entran al informe compartido. En modo privado, el resto se sincroniza con Firebase cuando esté configurado.</p>
        ${!C.configured ? `<p class="note" style="margin-top:10px"><strong>Estado actual:</strong> Firebase aún no está configurado. El modo de prueba funciona completo en este dispositivo; las invitaciones entre celulares se activan al completar <code>firebase-config.js</code>.</p>` : ""}
      </section>`;

    const values = () => {
      const names = [document.getElementById("name-a").value.trim(), document.getElementById("name-b").value.trim()];
      if (!names[0] || !names[1]) throw new Error("Escribe ambos nombres para continuar.");
      if (!document.getElementById("consent").checked) throw new Error("Confirma que deseas participar voluntariamente.");
      return names;
    };
    document.getElementById("local")?.addEventListener("click", () => {
      try {
        const names = values();
        const local = { names, answers: [L.emptyAnswers(), L.emptyAnswers()], done: [false, false], cursor: [0, 0] };
        localStorage.setItem(localKey, JSON.stringify(local));
        state = { mode: "local", names, slot: 0, pairId: null, answers: local.answers[0], cursor: 0, done: false };
        saveSession(); renderQuestion();
      } catch (error) { showToast(error.message); }
    });
    document.getElementById("resume")?.addEventListener("click", () => resumeLocal(existing));
    document.getElementById("create")?.addEventListener("click", async event => {
      try {
        if (!C.configured) throw new Error("Configura Firebase para crear una invitación entre dispositivos. Puedes usar la prueba local ahora.");
        event.currentTarget.disabled = true;
        const names = values();
        cloud = await C.connect();
        const created = await cloud.createPair(names);
        state = { mode: "cloud", names, slot: 0, pairId: created.pairId, answers: L.emptyAnswers(), cursor: 0, done: false };
        history.replaceState({}, "", `?pair=${created.pairId}`);
        saveSession(); renderQuestion();
      } catch (error) { event.currentTarget.disabled = false; showToast(error.message); }
    });
    document.getElementById("join")?.addEventListener("click", async event => {
      try {
        if (!C.configured) throw new Error("El espacio existe, pero esta copia todavía no tiene Firebase configurado.");
        values();
        event.currentTarget.disabled = true;
        cloud = await C.connect();
        const joined = await cloud.joinPair(queryPair);
        state = { mode: "cloud", names: joined.pair.names, slot: joined.slot, pairId: queryPair, answers: L.emptyAnswers(), cursor: 0, done: Boolean(joined.pair[`done${joined.slot}`]) };
        saveSession();
        if (state.done) renderWaiting(); else renderQuestion();
      } catch (error) { event.currentTarget.disabled = false; showToast(error.message); }
    });
  }

  function resumeLocal(local) {
    const slot = local.done[0] && !local.done[1] ? 1 : 0;
    state = { mode: "local", names: local.names, slot, pairId: null, answers: L.normalizeAnswers(local.answers[slot]), cursor: local.cursor?.[slot] || 0, done: Boolean(local.done[slot]) };
    if (local.done[0] && local.done[1]) renderReport(L.buildReport(local.answers[0], local.answers[1], local.names));
    else if (state.done) renderWaiting();
    else renderQuestion();
  }

  function allItems() {
    return [
      ...L.statements.map(item => ({ type: "statement", item })),
      ...L.scenarios.map(item => ({ type: "scenario", item })),
      ...L.openQuestions.map(item => ({ type: "open", item }))
    ];
  }

  function renderQuestion() {
    const items = allItems();
    state.cursor = Math.max(0, Math.min(state.cursor, items.length - 1));
    const current = items[state.cursor];
    const progress = Math.round(L.answeredCount(state.answers) / L.totalQuestions() * 100);
    const phase = current.type === "statement" ? "Afinidades" : current.type === "scenario" ? "Acuerdos" : "Preguntas abiertas";
    app.innerHTML = `
      <section class="session">
        <header class="session-head">
          <div><p class="eyebrow">${phase}</p><h2>Responde a tu ritmo</h2><p class="session-person">Turno de <strong>${escapeHtml(state.names[state.slot])}</strong>. Tus respuestas siguen ocultas.</p></div>
          <div class="progress-copy"><span>${progress}% completado</span><div class="progress" aria-label="Progreso ${progress}%"><span style="width:${progress}%"></span></div></div>
        </header>
        <article class="card question-card">
          <div class="question-meta"><span>${state.cursor + 1} de ${items.length}</span><span>${current.type === "statement" ? escapeHtml(L.categories[current.item.category].label) : phase}</span></div>
          ${questionBody(current)}
          <div class="question-actions">
            <button class="button quiet" id="previous" ${state.cursor === 0 ? "disabled" : ""}>← Anterior</button>
            <button class="button" id="next">${state.cursor === items.length - 1 ? "Terminar" : "Siguiente →"}</button>
          </div>
        </article>
      </section>`;
    bindQuestion(current, items.length);
    focusMain();
  }

  function questionBody(current) {
    const item = current.item;
    if (current.type === "statement") {
      const bucket = item.localOnly ? state.answers.privateRatings : state.answers.ratings;
      const value = bucket[item.id];
      const importance = state.answers.importance[item.id] || 2;
      return `<p class="question">${escapeHtml(item.label)}</p>
        <div class="scale" role="group" aria-label="Nivel de acuerdo">
          ${[1,2,3,4,5].map(score => `<button class="choice ${value === score ? "selected" : ""}" data-score="${score}" aria-pressed="${value === score}">${score}</button>`).join("")}
        </div>
        <div class="scale-legend"><span>Nada de acuerdo</span><span>Totalmente de acuerdo</span></div>
        ${item.localOnly ? `<p class="note local-only"><strong>Solo para ti:</strong> esta respuesta no se sincroniza ni se incluye en el informe de pareja. Si algo te hace sentir en peligro, prioriza tu seguridad y busca apoyo de confianza.</p>` : `<div class="importance"><p>¿Qué tan importante es este tema para ti?</p><div class="importance-options" role="group" aria-label="Importancia">${[[1,"Poco"],[2,"Importante"],[3,"Esencial"]].map(([score,label]) => `<button class="choice ${importance === score ? "selected" : ""}" data-importance="${score}" aria-pressed="${importance === score}">${label}</button>`).join("")}</div></div>`}`;
    }
    if (current.type === "scenario") {
      const value = state.answers.choices[item.id];
      return `<p class="question">${escapeHtml(item.label)}</p><div class="scenario-options" role="group" aria-label="Opciones">${item.options.map((option, index) => `<button class="choice ${value === index ? "selected" : ""}" data-choice="${index}" aria-pressed="${value === index}">${escapeHtml(option)}</button>`).join("")}</div>`;
    }
    return `<p class="question">${escapeHtml(item.label)}</p><div class="field"><label for="open-answer">Tu respuesta</label><textarea id="open-answer" maxlength="1200" placeholder="Escribe con honestidad. Tu pareja la verá cuando ambos terminen.">${escapeHtml(state.answers.open[item.id] || "")}</textarea></div><p class="note">Puedes ser breve, pero esta parte suele abrir las conversaciones más valiosas.</p>`;
  }

  function bindQuestion(current, length) {
    if (current.type === "statement") {
      document.querySelectorAll("[data-score]").forEach(button => button.addEventListener("click", () => {
        const bucket = current.item.localOnly ? state.answers.privateRatings : state.answers.ratings;
        bucket[current.item.id] = Number(button.dataset.score); scheduleSave(); renderQuestion();
      }));
      document.querySelectorAll("[data-importance]").forEach(button => button.addEventListener("click", () => {
        state.answers.importance[current.item.id] = Number(button.dataset.importance); scheduleSave(); renderQuestion();
      }));
    } else if (current.type === "scenario") {
      document.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => {
        state.answers.choices[current.item.id] = Number(button.dataset.choice); scheduleSave(); renderQuestion();
      }));
    } else {
      document.getElementById("open-answer").addEventListener("input", event => { state.answers.open[current.item.id] = event.target.value; scheduleSave(); });
    }
    document.getElementById("previous").addEventListener("click", () => { state.cursor -= 1; scheduleSave(); renderQuestion(); });
    document.getElementById("next").addEventListener("click", async event => {
      if (!currentAnswered(current)) { showToast("Responde esta pregunta para continuar."); return; }
      if (state.cursor < length - 1) { state.cursor += 1; scheduleSave(); renderQuestion(); return; }
      event.currentTarget.disabled = true;
      await finish();
    });
  }

  function currentAnswered(current) {
    if (current.type === "statement") return (current.item.localOnly ? state.answers.privateRatings[current.item.id] : state.answers.ratings[current.item.id]) != null;
    if (current.type === "scenario") return state.answers.choices[current.item.id] != null;
    return String(state.answers.open[current.item.id] || "").trim().length > 0;
  }

  async function finish() {
    if (!L.isComplete(state.answers)) { showToast("Aún faltan algunas respuestas."); return; }
    if (state.mode === "local") {
      const local = getLocal();
      local.answers[state.slot] = state.answers;
      local.done[state.slot] = true;
      local.cursor[state.slot] = state.cursor;
      localStorage.setItem(localKey, JSON.stringify(local));
      state.done = true;
      renderWaiting();
      return;
    }
    try {
      cloud = cloud || await C.connect();
      await cloud.finish(state.pairId, state.slot, state.answers);
      state.done = true;
      renderWaiting();
    } catch (error) { showToast(`No se pudo terminar: ${error.message}`); renderQuestion(); }
  }

  function inviteUrl() { return `${location.origin}${location.pathname}?pair=${state.pairId}`; }

  async function renderWaiting() {
    if (state.mode === "local") {
      const local = getLocal();
      if (local.done[0] && local.done[1]) { renderReport(L.buildReport(local.answers[0], local.answers[1], local.names)); return; }
      const other = state.slot === 0 ? 1 : 0;
      app.innerHTML = `<section class="status-wrap"><div class="card status-card"><div class="status-icon">✓</div><p class="eyebrow">Primera parte lista</p><h2>Gracias, ${escapeHtml(state.names[state.slot])}</h2><p class="lead">Ahora entrega el dispositivo a ${escapeHtml(state.names[other])}. No podrá ver tus respuestas mientras completa las suyas.</p><div class="actions" style="justify-content:center"><button class="button" id="switch">Comenzar turno de ${escapeHtml(state.names[other])}</button></div></div></section>`;
      document.getElementById("switch").addEventListener("click", () => {
        const refreshed = getLocal();
        state = { mode: "local", names: refreshed.names, slot: other, pairId: null, answers: L.normalizeAnswers(refreshed.answers[other]), cursor: refreshed.cursor?.[other] || 0, done: false };
        saveSession(); renderQuestion();
      });
      focusMain(); return;
    }

    try {
      cloud = cloud || await C.connect();
      const ready = await cloud.readAnswers(state.pairId);
      if (ready) { renderReport(L.buildReport(ready.answers[0], ready.answers[1], ready.pair.names)); return; }
    } catch (_) {}
    app.innerHTML = `<section class="status-wrap"><div class="card status-card"><div class="status-icon">♡</div><p class="eyebrow">Tu parte está guardada</p><h2>Esperando a ${escapeHtml(state.names[state.slot === 0 ? 1 : 0])}</h2><p class="lead">El informe se desbloquea únicamente cuando ambos hayan terminado.</p>${state.slot === 0 ? `<div class="note invite"><strong>Enlace de invitación</strong><br><code>${escapeHtml(inviteUrl())}</code></div><div class="actions" style="justify-content:center"><button class="button" id="copy">Copiar invitación</button><button class="button secondary" id="refresh">Revisar estado</button></div>` : `<div class="actions" style="justify-content:center"><button class="button" id="refresh">Revisar estado</button></div>`}</div></section>`;
    document.getElementById("copy")?.addEventListener("click", async () => { await navigator.clipboard.writeText(inviteUrl()); showToast("Enlace copiado."); });
    document.getElementById("refresh").addEventListener("click", renderWaiting);
    focusMain();
  }

  function renderReport(report) {
    const agreementPreview = report.agreements.filter(item => item.same).slice(0, 4);
    app.innerHTML = `<section class="report">
      <div class="card report-hero"><p class="eyebrow">Informe compartido</p><h2>${escapeHtml(report.names[0])} + ${escapeHtml(report.names[1])}</h2><div class="score-ring" style="--score:${report.overall}"><div><strong>${report.overall}</strong><span>afinidad / 100</span></div></div><p class="lead">Una fotografía de sus coincidencias actuales y de los temas que merecen una conversación sin prisa.</p></div>
      <div class="report-grid">
        <article class="card report-card"><h3>Mapa de afinidad</h3>${report.rows.map(row => `<div class="category-row"><span>${escapeHtml(row.label)}</span><div class="bar"><i style="width:${row.fit}%"></i></div><strong>${row.fit}</strong></div>`).join("")}</article>
        <article class="card report-card"><h3>Fortalezas</h3>${report.strengths.map(row => `<div class="insight good"><strong>${escapeHtml(row.label)} · ${row.fit}/100</strong>${escapeHtml(row.prompt)}</div>`).join("")}</article>
        <article class="card report-card"><h3>Conversaciones prioritarias</h3>${report.conversations.map(row => `<div class="insight"><strong>${escapeHtml(row.label)}</strong>Promedios: ${escapeHtml(report.names[0])} ${row.avg1}/5 · ${escapeHtml(report.names[1])} ${row.avg2}/5. Escuchen primero qué significa este tema para cada uno.</div>`).join("")}</article>
        <article class="card report-card"><h3>Acuerdos coincidentes</h3><p class="lead" style="margin:0 0 12px;font-size:.9rem">Coincidieron en ${report.agreementRate}% de las decisiones planteadas.</p>${agreementPreview.length ? agreementPreview.map(item => `<div class="agreement"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.first)}</span></div>`).join("") : `<p class="note">No hubo respuestas idénticas. Eso no significa incompatibilidad: significa que conviene convertir supuestos en acuerdos explícitos.</p>`}</article>
      </div>
      <div class="card report-card" style="margin-top:18px"><h3>Cómo usar este resultado</h3><div class="insight good"><strong>Empiecen por una fortaleza</strong>Reconozcan qué ya funciona y nombren una conducta concreta que quieran conservar.</div><div class="insight"><strong>Elijan un solo tema difícil</strong>Cada persona habla cinco minutos sin interrupción. Después, la otra resume lo que entendió antes de responder.</div><div class="insight"><strong>Cierren con un acuerdo observable</strong>Definan una acción pequeña, una fecha para revisarla y la libertad de ajustarla si no funciona.</div><p class="disclaimer">La afinidad se calcula por cercanía entre respuestas, ponderada por la importancia declarada. No mide amor, salud mental, seguridad ni pronostica el futuro.</p><div class="actions no-print"><button class="button" onclick="window.print()">Imprimir informe</button><button class="button danger" id="restart">Empezar de nuevo</button></div></div>
    </section>`;
    document.getElementById("restart").addEventListener("click", () => {
      if (state.mode === "local") localStorage.removeItem(localKey);
      sessionStorage.removeItem(sessionKey);
      history.replaceState({}, "", location.pathname);
      state = { mode: null, names: ["", ""], slot: 0, pairId: null, answers: L.emptyAnswers(), cursor: 0, done: false };
      welcome();
    });
    focusMain();
  }

  async function boot() {
    const existing = getLocal();
    if (!queryPair && existing) { welcome(); return; }
    if (queryPair) { welcome(); return; }
    welcome();
  }

  boot();
})();
