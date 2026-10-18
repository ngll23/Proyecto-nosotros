(function () {
  "use strict";

  const config = window.FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.projectId && !Object.values(config).some(value => String(value).includes("REEMPLAZAR")));
  const firebaseVersion = "11.2.0";
  let instancePromise;

  function randomId() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  }

  async function connect() {
    if (!configured) throw new Error("Firebase todavía no está configurado.");
    if (instancePromise) return instancePromise;
    instancePromise = (async () => {
      const [{ initializeApp }, authApi, storeApi] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`)
      ]);
      const app = initializeApp(config);
      const auth = authApi.getAuth(app);
      if (!auth.currentUser) await authApi.signInAnonymously(auth);
      const db = storeApi.getFirestore(app);
      const uid = auth.currentUser.uid;

      async function getPair(pairId) {
        const snap = await storeApi.getDoc(storeApi.doc(db, "pairs", pairId));
        if (!snap.exists()) throw new Error("No encontramos este espacio de pareja.");
        return snap.data();
      }

      async function resolveSlot(pairId, join) {
        const ref = storeApi.doc(db, "pairs", pairId);
        const pair = await getPair(pairId);
        if (pair.member0 === uid) return 0;
        if (pair.member1 === uid) return 1;
        if (join && pair.member1 == null) {
          await storeApi.updateDoc(ref, { member1: uid });
          return 1;
        }
        throw new Error("Este espacio ya pertenece a dos personas o no está disponible.");
      }

      return {
        uid,
        async createPair(names) {
          const pairId = randomId();
          await storeApi.setDoc(storeApi.doc(db, "pairs", pairId), {
            member0: uid,
            member1: null,
            names,
            done0: false,
            done1: false,
            createdAt: storeApi.serverTimestamp()
          });
          return { pairId, slot: 0 };
        },
        async joinPair(pairId) {
          const slot = await resolveSlot(pairId, true);
          return { pairId, slot, pair: await getPair(pairId) };
        },
        async save(pairId, slot, answers) {
          const own = await resolveSlot(pairId, false);
          if (own !== slot) throw new Error("La sesión local no coincide con tu identidad.");
          const payload = {
            ratings: answers.ratings || {},
            importance: answers.importance || {},
            choices: answers.choices || {},
            open: answers.open || {}
          };
          await storeApi.setDoc(storeApi.doc(db, "pairs", pairId, "answers", String(slot)), payload, { merge: true });
        },
        async finish(pairId, slot, answers) {
          await this.save(pairId, slot, answers);
          await storeApi.updateDoc(storeApi.doc(db, "pairs", pairId), { [`done${slot}`]: true });
        },
        async status(pairId) { return getPair(pairId); },
        async readAnswers(pairId) {
          const pair = await getPair(pairId);
          if (!pair.done0 || !pair.done1) return null;
          const [a, b] = await Promise.all([
            storeApi.getDoc(storeApi.doc(db, "pairs", pairId, "answers", "0")),
            storeApi.getDoc(storeApi.doc(db, "pairs", pairId, "answers", "1"))
          ]);
          return { pair, answers: [a.data(), b.data()] };
        },
        watch(pairId, callback) {
          return storeApi.onSnapshot(storeApi.doc(db, "pairs", pairId), snap => callback(snap.exists() ? snap.data() : null));
        }
      };
    })();
    return instancePromise;
  }

  window.ProjectNosotrosCloud = { configured, connect };
})();
