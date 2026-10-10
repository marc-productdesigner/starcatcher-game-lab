const vm = require("vm");
const LESSONS = require("./lessons.js");
const { buildWorkerSource } = require("./engine.js");

let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL: " + msg); };

function runCode(code, opts) {
  opts = opts || {};
  const msgs = [];
  const sandbox = { postMessage: (m) => msgs.push(JSON.parse(JSON.stringify(m))), setInterval: () => 1, clearInterval: () => {}, Date };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext("Math.random = () => " + (opts.rand === undefined ? 0.5 : opts.rand), sandbox);
  const built = buildWorkerSource(code);
  try {
    vm.runInContext(built.src, sandbox, { timeout: 2000 });
  } catch (e) {
    msgs.push({ type: "error", name: e.name, message: e.message, stack: e.stack });
  }
  const press = (key, down) => sandbox.onmessage({ data: { type: "key", key: key, down: down !== false } });
  const steps = (n) => {
    for (let i = 0; i < n; i++) {
      try { vm.runInContext("__step()", sandbox, { timeout: 2000 }); } catch (e) { msgs.push({ type: "error", message: e.message }); break; }
    }
  };
  return { msgs, press, steps, sandbox, built };
}

const errors = (msgs) => msgs.filter((m) => m.type === "error");
const texts = (msgs) => msgs.filter((m) => m.type === "frame").flatMap((f) => f.cmds.filter((c) => c[0] === "write").map((c) => c[1]));
const says = (msgs) => msgs.filter((m) => m.type === "say").map((m) => m.text);

// 1. Every starter and every answer runs without errors for 300 frames
LESSONS.forEach((L) => {
  ["starter", "answer"].forEach((which) => {
    const r = runCode(L[which]);
    r.steps(300);
    const errs = errors(r.msgs);
    const frames = r.msgs.filter((m) => m.type === "frame").length;
    const ok = errs.length === 0 && frames > 0;
    console.log((ok ? "ok   " : "FAIL ") + "L" + L.id + " " + which + " (" + frames + " frames)" + (errs.length ? " -> " + JSON.stringify(errs[0]) : ""));
    if (!ok) failures++;
  });
});

// 2. Specific behaviours
console.log("--- behaviour checks");
{
  const r = runCode(LESSONS[0].answer);
  const s = says(r.msgs);
  if (s.length !== 4 || s[1] !== "My name is Nova!") fail("L1 answer says wrong things: " + JSON.stringify(s));
}
{
  const r = runCode(LESSONS[1].answer);
  const s = says(r.msgs);
  if (s[3] !== "After a snack, power level: 10000") fail("L2 power math: " + JSON.stringify(s));
}
{
  const r = runCode(LESSONS[3].answer);
  const emojis = r.msgs.find((m) => m.type === "frame").cmds.filter((c) => c[0] === "emoji");
  const rowXs = emojis.filter((c) => c[1] === "⭐" && c[3] === 70).map((c) => c[2]);
  if (rowXs.length !== 8 || Math.max(...rowXs) > 460) fail("L4 answer row: " + JSON.stringify(rowXs));
  if (emojis.some((c) => c[2] < 0 || c[2] > 480 || c[3] < 0 || c[3] > 320)) fail("L4 emoji off-stage");
}
{
  // L5 starter: rocket moves right
  const r = runCode(LESSONS[4].starter);
  r.steps(10);
  const frames = r.msgs.filter((m) => m.type === "frame");
  const xOf = (f) => f.cmds.find((c) => c[0] === "emoji")[2];
  if (!(xOf(frames[9]) > xOf(frames[0]))) fail("L5 rocket does not move");
}
{
  // L6 answer: ball stays on stage and beeps
  const r = runCode(LESSONS[5].answer);
  r.steps(600);
  const frames = r.msgs.filter((m) => m.type === "frame");
  const pts = frames.map((f) => f.cmds.find((c) => c[0] === "emoji"));
  if (pts.some((c) => c[2] < 20 || c[2] > 460 || c[3] < 20 || c[3] > 300)) fail("L6 ball left stage");
  if (!r.msgs.some((m) => m.type === "beep")) fail("L6 no beep on bounce");
}
{
  // L7 answer: walls hold
  const r = runCode(LESSONS[6].answer);
  r.press("left");
  r.steps(300);
  let f = r.msgs.filter((m) => m.type === "frame").pop();
  if (f.cmds.find((c) => c[0] === "emoji")[2] !== 28) fail("L7 left wall: " + f.cmds.find((c) => c[0] === "emoji")[2]);
  r.press("left", false);
  r.press("right");
  r.press("space");
  r.steps(300);
  f = r.msgs.filter((m) => m.type === "frame").pop();
  if (f.cmds.find((c) => c[0] === "emoji")[2] !== 452) fail("L7 right wall");
  // aliases: 'a' key moves left
  const r2 = runCode(LESSONS[6].starter);
  r2.press("a");
  r2.steps(5);
  f = r2.msgs.filter((m) => m.type === "frame").pop();
  if (!(f.cmds.find((c) => c[0] === "emoji")[2] < 240)) fail("L7 'a' key alias");
}
{
  // L9: starter must NOT score, answer must score when basket sits under star
  const s = runCode(LESSONS[8].starter);
  s.steps(300);
  if (texts(s.msgs).pop() !== "Score: 0") fail("L9 starter should not score: " + texts(s.msgs).pop());
  const a = runCode(LESSONS[8].answer);
  a.steps(300);
  const last = texts(a.msgs).pop();
  if (!/Score: [1-9]/.test(last)) fail("L9 answer never scored: " + last);
  if (!a.msgs.some((m) => m.type === "beep" && m.freq === 880)) fail("L9 no catch beep");
}
{
  // L10: with random = 0.9 the star is far right, basket never moves -> lose 3 lives, game over
  const r = runCode(LESSONS[9].answer, { rand: 0.9 });
  r.steps(1500);
  const t = texts(r.msgs);
  if (!t.includes("GAME OVER")) fail("L10 never reached GAME OVER");
  if (!r.msgs.some((m) => m.type === "ended")) fail("L10 no ended message");
  const hearts = r.msgs.filter((m) => m.type === "frame")[0].cmds.filter((c) => c[0] === "emoji" && c[1] === "❤️").length;
  if (hearts !== 3) fail("L10 hearts at start: " + hearts);
  const before = r.msgs.length;
  r.steps(20);
  if (r.msgs.length !== before) fail("L10 kept running after stopGame");
  // starter has no lives
  const s = runCode(LESSONS[9].starter);
  s.steps(50);
  if (texts(s.msgs).includes("GAME OVER")) fail("L10 starter should not end");
}
{
  // L11: bomb costs a life when caught (rand 0.5 -> bomb x=240 falls into basket at 240)
  const r = runCode(LESSONS[10].answer, { rand: 0.5 });
  r.steps(120);
  const f = r.msgs.filter((m) => m.type === "frame").pop();
  const hearts = f.cmds.filter((c) => c[0] === "emoji" && c[1] === "❤️").length;
  if (hearts >= 3) fail("L11 bomb did not cost a life (hearts=" + hearts + ")");
}

// 3. Safety: infinite loops are stopped, errors report sensible lines
console.log("--- safety checks");
{
  const r = runCode('say("start");\nwhile (true) {\n  let a = 1;\n}\n');
  const e = errors(r.msgs)[0];
  if (!e || e.name !== "LoopError") fail("while(true) not guarded: " + JSON.stringify(e));
  else {
    const m = e.stack.match(/<anonymous>:(\d+):\d+/g) || [];
    const lines = m.map((s) => parseInt(s.split(":")[1], 10) - r.built.offset).filter((n) => n >= 1 && n <= 5);
    if (!lines.includes(2) && !lines.includes(3)) fail("loop error line not recoverable: " + JSON.stringify(m) + " offset " + r.built.offset);
  }
}
{
  const r = runCode('say("a");\nsay(oops);\n');
  const e = errors(r.msgs)[0];
  if (!e || e.name !== "ReferenceError") fail("ReferenceError expected");
  else {
    const m = (e.stack.match(/<anonymous>:(\d+):\d+/g) || []).map((s) => parseInt(s.split(":")[1], 10) - r.built.offset);
    if (!m.includes(2)) fail("reference error line wrong: " + JSON.stringify(m));
  }
  if (!says(r.msgs).includes("a")) fail("say before error lost");
}
{
  // syntax errors surface as a compile error before running anything
  const r = runCode('say("hello);\n');
  const e = errors(r.msgs)[0];
  if (!e || e.name !== "SyntaxError") fail("SyntaxError expected: " + JSON.stringify(e));
}
{
  // onFrame error mid-game stops the loop and reports it
  const r = runCode("let n = 0;\nonFrame(() => {\n  n = n + 1;\n  if (n > 3) { boom(); }\n});\n");
  r.steps(10);
  const e = errors(r.msgs)[0];
  if (!e || e.name !== "ReferenceError") fail("frame error not reported");
  const frames = r.msgs.filter((m) => m.type === "frame").length;
  if (frames !== 3) fail("frames before error: " + frames);
}
{
  const r = runCode('onFrame("not a function");');
  const e = errors(r.msgs)[0];
  if (!e || e.name !== "TypeError") fail("onFrame type check");
}
{
  const r = runCode('for (let i = 0; i < 100000; i++) { say("x"); }');
  const n = says(r.msgs).length;
  if (n > 405) fail("say flood not capped: " + n);
}

console.log(failures === 0 ? "\nALL PASSED" : "\n" + failures + " FAILURE(S)");
process.exit(failures === 0 ? 0 : 1);
