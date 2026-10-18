const assert = require("node:assert/strict");
const logic = require("./logic.js");

const a = logic.emptyAnswers();
const b = logic.emptyAnswers();

for (const question of logic.statements) {
  const bucketA = question.localOnly ? a.privateRatings : a.ratings;
  const bucketB = question.localOnly ? b.privateRatings : b.ratings;
  bucketA[question.id] = 4;
  bucketB[question.id] = 4;
  a.importance[question.id] = 2;
  b.importance[question.id] = 2;
}
for (const question of logic.scenarios) {
  a.choices[question.id] = 0;
  b.choices[question.id] = 0;
}
for (const question of logic.openQuestions) {
  a.open[question.id] = "Respuesta uno";
  b.open[question.id] = "Respuesta dos";
}

assert.equal(logic.isComplete(a), true);
assert.equal(logic.answeredCount(a), logic.totalQuestions());

const report = logic.buildReport(a, b, ["Nicolás", "Nicole"]);
assert.equal(report.overall, 100);
assert.equal(report.agreementRate, 100);
assert.equal(report.rows.length, 9);
assert.equal(report.names[1], "Nicole");

b.ratings.s0 = 1;
const changed = logic.buildReport(a, b, ["A", "B"]);
assert.ok(changed.overall < 100);
assert.ok(changed.rows.find(row => row.category === "comunicacion").gap > 0);

console.log("Proyecto Nosotros: lógica verificada correctamente.");
