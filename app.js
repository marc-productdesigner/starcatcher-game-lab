(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const W = 480, H = 320, DPR = 2;
  const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
    remove(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
    clearAll() {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.indexOf("cgl-") === 0) localStorage.removeItem(k);
        }
      } catch (e) {}
    }
  };

  // ---------- state ----------
  let cur = Math.min(Math.max(parseInt(store.get("cgl-cur", 0), 10) || 0, 0), LESSONS.length - 1);
  const done = new Set(store.get("cgl-done", []));
  const hintShown = {};
  const answerShown = {};
  let worker = null;
  let workerUrl = null;
  let running = false;
  let lastCmds = null;
  let lastOffset = 0;
  let pendingFrame = null;
  let drawQueued = false;
  let saveTimer = null;
  let escapeTab = false;

  // ---------- elements ----------
  const pathEl = $("#path");
  const lessonEl = $("#lesson");
  const editor = $("#code");
  const gutter = $("#gutter");
  const canvas = $("#stage");
  const ctx = canvas.getContext("2d");
  const stageWrap = $("#stageWrap");
  const sayEl = $("#say");
  const oopsEl = $("#oops");
  const statusEl = $("#status");
  const gridBox = $("#showGrid");
  const soundBox = $("#sound");
  const coordsEl = $("#coords");
  const meter = $("#meter");
  const starCount = $("#starCount");
  const trophy = $("#trophy");
  canvas.width = W * DPR;
  canvas.height = H * DPR;

  // ---------- two-step buttons (no popups) ----------
  function arm(btn, confirmText, action) {
    if (btn.dataset.armed) {
      clearTimeout(btn._t);
      btn.textContent = btn.dataset.label;
      delete btn.dataset.armed;
      action();
      return;
    }
    btn.dataset.label = btn.textContent;
    btn.dataset.armed = "1";
    btn.textContent = confirmText;
    btn._t = setTimeout(() => {
      btn.textContent = btn.dataset.label;
      delete btn.dataset.armed;
    }, 3500);
  }

  // ---------- path and meter ----------
  function renderPath() {
    pathEl.innerHTML = LESSONS.map((L, i) => {
      const isDone = done.has(L.id);
      return '<button class="node' + (isDone ? " is-done" : "") + (i === cur ? " is-current" : "") + '" data-i="' + i +
        '" title="' + esc(L.title) + '" aria-label="Level ' + L.id + ": " + esc(L.title) + (isDone ? " (finished)" : "") + '"' +
        (i === cur ? ' aria-current="step"' : "") + ">" + (isDone ? STAR_SVG.replace('viewBox', 'width="26" height="26" viewBox') : L.id) + "</button>";
    }).join("");
  }
  function updateMeter(pulse) {
    starCount.textContent = done.size;
    trophy.hidden = done.size < LESSONS.length;
    if (pulse) {
      meter.classList.remove("pulse");
      void meter.offsetWidth;
      meter.classList.add("pulse");
    }
  }

  // ---------- lesson card ----------
  function renderLesson() {
    const L = LESSONS[cur];
    const checks = store.get("cgl-checks-" + L.id, []);
    const isDone = done.has(L.id);
    const hs = hintShown[L.id] || 0;
    const ans = !!answerShown[L.id];

    let html = '<p class="eyebrow">Level ' + L.id + " of " + LESSONS.length + " · " + L.tag + "</p>";
    html += "<h1>" + L.title + '</h1><div class="story">' + L.story + "</div>";
    html += '<div class="big"><p class="label">Big idea</p><p class="term">' + L.big.term + "</p><p>" + L.big.text + "</p></div>";
    html += "<h2>Your mission</h2><ul class=\"mission\">" + L.mission.map((m, i) =>
      '<li><label><input type="checkbox" data-m="' + i + '"' + (checks.indexOf(i) >= 0 ? " checked" : "") + '><span class="mtext">' + m + "</span></label></li>").join("") + "</ul>";

    html += '<div class="help">';
    for (let i = 0; i < hs; i++) html += '<div class="hint"><strong>Hint ' + (i + 1) + "</strong>" + L.hints[i] + "</div>";
    if (ans) {
      html += '<div class="answer"><p><strong>One way to do it.</strong> Yours can look different and still be right.</p><pre><code>' + esc(L.answer) +
        '</code></pre><button class="btn btn-small" data-act="use-answer">Put it in my editor</button></div>';
    }
    if (hs < L.hints.length) html += '<div class="help-actions"><button class="btn btn-small" data-act="hint">' + (hs ? "Another hint" : "Need a hint?") + "</button></div>";
    else if (!ans) html += '<div class="help-actions"><button class="btn btn-small" data-act="peek">Peek at the answer</button></div>';
    html += "</div>";

    html += '<div class="done-row" id="doneRow">';
    if (isDone) {
      html += '<p class="done-msg">Level complete!</p>';
      if (cur < LESSONS.length - 1) html += '<button class="btn btn-grape" data-act="next">Next level →</button>';
    } else {
      html += '<button class="btn btn-run" data-act="done">I did it!</button>';
    }
    html += "</div>";
    lessonEl.innerHTML = html;
  }

  // ---------- editor ----------
  function updateGutter(badLine) {
    const n = editor.value.split("\n").length;
    let out = "";
    for (let i = 1; i <= n; i++) {
      out += (i === badLine ? '<span class="bad">' + i + "</span>" : i) + (i < n ? "\n" : "");
    }
    gutter.innerHTML = out;
    gutter.scrollTop = editor.scrollTop;
  }
  function insertText(text, back) {
    editor.focus();
    let ok = false;
    try {
      ok = document.execCommand("insertText", false, text);
    } catch (e) {}
    if (!ok) {
      const s = editor.selectionStart, e2 = editor.selectionEnd;
      editor.setRangeText(text, s, e2, "end");
      editor.dispatchEvent(new Event("input"));
    }
    if (back) {
      const p = editor.selectionStart - back;
      editor.setSelectionRange(p, p);
    }
  }
  function replaceAllCode(text) {
    editor.focus();
    editor.select();
    let ok = false;
    try {
      ok = document.execCommand("insertText", false, text);
    } catch (e) {}
    if (!ok) {
      editor.value = text;
      editor.dispatchEvent(new Event("input"));
    }
    editor.setSelectionRange(0, 0);
    editor.scrollTop = 0;
  }
  function setCode(text) {
    editor.value = text;
    editor.scrollTop = 0;
    updateGutter();
  }
  editor.addEventListener("input", () => {
    updateGutter();
    hideOops();
    clearTimeout(saveTimer);
    const id = LESSONS[cur].id;
    const val = editor.value;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      store.set("cgl-code-" + id, val);
    }, 300);
  });
  editor.addEventListener("scroll", () => {
    gutter.scrollTop = editor.scrollTop;
  });
  editor.addEventListener("blur", () => {
    escapeTab = false;
  });
  editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
      return;
    }
    if (e.key === "Escape") {
      escapeTab = true;
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (escapeTab) return;
      e.preventDefault();
      insertText("  ");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
      const v = editor.value, s = editor.selectionStart;
      if (s !== editor.selectionEnd) return;
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const line = v.slice(lineStart, s);
      const indent = line.match(/^[ \t]*/)[0];
      const extra = /[{(\[]\s*$/.test(line) ? "  " : "";
      e.preventDefault();
      insertText("\n" + indent + extra);
    }
  });

  const CHIPS = [
    { l: "( )", t: "()", b: 1 }, { l: "{ }", t: "{}", b: 1, block: true }, { l: '" "', t: '""', b: 1 }, { l: ";", t: ";" },
    { l: "=", t: " = " }, { l: "+", t: " + " }, { l: "-", t: " - " }, { l: "*", t: " * " },
    { l: "<", t: " < " }, { l: ">", t: " > " }, { l: "=>", t: " => " }, { l: "||", t: " || " }
  ];
  $("#chips").innerHTML = CHIPS.map((c, i) => '<button type="button" class="chip" data-c="' + i + '" aria-label="Type ' + esc(c.l) + '">' + esc(c.l) + "</button>").join("");
  $("#chips").addEventListener("mousedown", (e) => e.preventDefault());
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    const c = CHIPS[+b.dataset.c];
    if (c.block) {
      const v = editor.value, s = editor.selectionStart;
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const indent = v.slice(lineStart, s).match(/^[ \t]*/)[0];
      insertText("{\n" + indent + "  \n" + indent + "}", indent.length + 3);
    } else {
      insertText(c.t, c.b || 0);
    }
  });

  // ---------- stage drawing ----------
  function setFill(c) {
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
  }
  function drawIdle(big, small) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#2B1C5E";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 28px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(big, W / 2, H / 2 - 14);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = '17px system-ui, "Segoe UI", sans-serif';
    ctx.fillText(small, W / 2, H / 2 + 22);
  }
  function drawGridOverlay() {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }
    ctx.font = 'bold 11px system-ui, "Segoe UI", sans-serif';
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    const label = (txt, x, y) => {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeText(txt, x, y);
      ctx.fillStyle = "#1E1240";
      ctx.fillText(txt, x, y);
    };
    for (let x = 80; x < W; x += 80) label(String(x), x + 3, 2);
    for (let y = 80; y < H; y += 80) label(String(y), 3, y + 2);
    ctx.restore();
  }
  function drawFrame(cmds) {
    lastCmds = cmds;
    if (!cmds.length) {
      drawIdle("Nothing to draw here", "This one just talks. Read the speech box below.");
    } else {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < cmds.length; i++) {
        const c = cmds[i];
        switch (c[0]) {
          case "bg":
            setFill(c[1]);
            ctx.fillRect(0, 0, W, H);
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(c[1], c[2], c[3], 0, Math.PI * 2);
            setFill(c[4]);
            ctx.fill();
            break;
          case "box":
            setFill(c[5]);
            ctx.fillRect(c[1], c[2], c[3], c[4]);
            break;
          case "emoji":
            ctx.font = c[4] + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";
            ctx.fillText(c[1], c[2], c[3]);
            break;
          case "write":
            ctx.font = "bold " + c[4] + 'px system-ui,"Segoe UI",Roboto,sans-serif';
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            setFill(c[5]);
            ctx.fillText(c[1], c[2], c[3]);
            break;
        }
      }
    }
    if (gridBox.checked) drawGridOverlay();
  }
  function queueFrame(cmds) {
    pendingFrame = cmds;
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      if (pendingFrame) {
        const f = pendingFrame;
        pendingFrame = null;
        drawFrame(f);
      }
    });
  }
  gridBox.addEventListener("change", () => {
    store.set("cgl-grid", gridBox.checked);
    if (lastCmds) drawFrame(lastCmds);
    else drawIdle("Press Run to start", "Your drawings and games show up here.");
  });
  soundBox.addEventListener("change", () => store.set("cgl-sound", soundBox.checked));
  gridBox.checked = !!store.get("cgl-grid", false);
  soundBox.checked = store.get("cgl-sound", true) !== false;

  function pointerCoords(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * W);
    const y = Math.round(((e.clientY - r.top) / r.height) * H);
    coordsEl.textContent = "x " + Math.max(0, Math.min(W, x)) + "   y " + Math.max(0, Math.min(H, y));
  }
  canvas.addEventListener("pointermove", pointerCoords);
  canvas.addEventListener("pointerdown", pointerCoords);
  canvas.addEventListener("pointerleave", () => {
    coordsEl.textContent = "x –   y –";
  });

  // ---------- messages and errors ----------
  function setStatus(s, text) {
    statusEl.dataset.s = s;
    statusEl.textContent = text;
  }
  function clearSay() {
    sayEl.innerHTML = '<h3>The computer says</h3><p class="empty">Nothing yet. Anything you <code>say(...)</code> shows up here.</p>';
  }
  function addSay(text) {
    const empty = $(".empty", sayEl);
    if (empty) empty.remove();
    const p = document.createElement("p");
    p.textContent = text;
    sayEl.appendChild(p);
    while (sayEl.children.length > 61) sayEl.removeChild(sayEl.children[1]);
    sayEl.scrollTop = sayEl.scrollHeight;
  }
  function hideOops() {
    if (!oopsEl.hidden) {
      oopsEl.hidden = true;
      oopsEl.innerHTML = "";
      updateGutter();
    }
  }
  function explain(name, message) {
    const m = String(message || "").replace(/^Uncaught\s*/, "").replace(/^[A-Za-z]*Error:\s*/, "");
    let r;
    if (name === "RunnerError") return "The code runner could not start in this browser. Ask a grown-up to try a different browser or device.";
    if (name === "LoopError") return "A loop never finished, so I stopped it. Check the numbers in your for loop. Does the counter ever reach the end?";
    if (name === "ReferenceError" && (r = m.match(/^(\S+) is not defined/))) {
      return "I do not know the word \"" + r[1] + "\". Check the spelling, because capital letters matter. If it is a box you made, did you create it with let first?";
    }
    if (name === "TypeError" && /is not a function/.test(m)) {
      return "That is not something I can call like a function. Check the spelling of the word right before the ( ).";
    }
    if (name === "TypeError" && /constant/.test(m)) return "That box was made with const, so it cannot change. Use let instead.";
    if (name === "TypeError" && /onFrame needs/.test(m)) return "onFrame needs something to run each frame. Write it like this: onFrame(() => { ... });";
    if (name === "SyntaxError") {
      if (/already been declared/.test(m)) return "You made the same box twice. Use let only the first time, then leave it out.";
      if (/end of input/i.test(m)) return "The code ended too soon. Look for a missing } or ).";
      if (/Unexpected token '?\}'?/.test(m)) return "There is a } in the wrong place. Count your { and } to see if they match.";
      if (/token|string|missing|unterminated|expected/i.test(m)) return "Something is typed wrong here. Look for a quote mark \" that never closed, or a missing ) or }.";
      return "Something is typed wrong on this line. Check your quote marks, brackets ( ) and curly braces { }.";
    }
    return "Something went wrong: " + m;
  }
  function lineFromStack(stack, offset, total) {
    const re = /:(\d+):(\d+)/g;
    let m;
    while ((m = re.exec(stack || ""))) {
      const n = parseInt(m[1], 10) - offset;
      if (n >= 1 && n <= total) return n;
    }
    return 0;
  }
  function showOops(info) {
    stopWorker();
    setStatus("error", "Oops");
    const lines = editor.value.split("\n");
    let line = info.line || 0;
    if (!line && info.stack) line = lineFromStack(info.stack, lastOffset, lines.length);
    if (line < 1 || line > lines.length) line = 0;
    let html = "<h3>Oops, a little bug!</h3><p>" + esc(explain(info.name, info.message)) + "</p>";
    if (line) html += "<p>Look at <strong>line " + line + "</strong>:</p><pre>" + esc(lines[line - 1].trim() || "(empty line)") + "</pre>";
    html += "<small>The computer's exact words: " + esc((info.name ? info.name + ": " : "") + String(info.message || "").replace(/^Uncaught\s*/, "")) + "</small>";
    oopsEl.innerHTML = html;
    oopsEl.hidden = false;
    updateGutter(line);
  }

  // ---------- sound ----------
  let actx = null;
  function initAudio() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) actx = new AC();
      }
      if (actx && actx.state === "suspended") actx.resume();
    } catch (e) {}
  }
  function beep(freq, dur) {
    if (!actx || !soundBox.checked) return;
    try {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = "triangle";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.03);
    } catch (e) {}
  }

  // ---------- running code ----------
  function stopWorker() {
    running = false;
    if (worker) {
      try {
        worker.terminate();
      } catch (e) {}
      worker = null;
    }
    if (workerUrl) {
      try {
        URL.revokeObjectURL(workerUrl);
      } catch (e) {}
      workerUrl = null;
    }
    releasePad();
  }
  function run() {
    stopWorker();
    hideOops();
    clearSay();
    lastCmds = null;
    pendingFrame = null;
    const code = editor.value.replace(/[\u201C\u201D\u201E]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/[\u00A0\u2007\u202F]/g, " ");
    store.set("cgl-code-" + LESSONS[cur].id, editor.value);
    const built = buildWorkerSource(code);
    lastOffset = built.offset;
    initAudio();
    let w;
    try {
      workerUrl = URL.createObjectURL(new Blob([built.src], { type: "text/javascript" }));
      w = new Worker(workerUrl);
    } catch (err) {
      showOops({ name: "Error", message: "This browser would not start the code runner. Try a different browser, or ask a grown-up to check." });
      return;
    }
    worker = w;
    running = true;
    setStatus("running", /keyDown/.test(code) ? "Playing. Use the arrow keys or A and D." : "Running");
    w.onmessage = (e) => {
      if (w !== worker) return;
      const m = e.data || {};
      if (m.type === "frame") queueFrame(m.cmds);
      else if (m.type === "say") addSay(m.text);
      else if (m.type === "beep") beep(m.freq, m.dur);
      else if (m.type === "error") showOops(m);
      else if (m.type === "ended") {
        stopWorker();
        setStatus("done", "Finished. Press Run to go again.");
      }
    };
    w.onerror = (e) => {
      if (w !== worker) return;
      if (e.preventDefault) e.preventDefault();
      const msg = String(e.message || "");
      if (!msg) {
        showOops({ name: "RunnerError", message: "The worker did not start." });
        return;
      }
      const nm = (msg.replace(/^Uncaught\s*/, "").match(/^([A-Za-z]*Error)/) || [])[1] || "SyntaxError";
      const line = e.lineno ? e.lineno - lastOffset : 0;
      showOops({ name: nm, message: msg, line: line });
    };
    stageWrap.focus({ preventScroll: true });
    const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = calm ? "auto" : "smooth";
    if (window.matchMedia && matchMedia("(max-width: 980px)").matches) {
      const card = $("#stageCard");
      if (card) card.scrollIntoView({ block: "start", behavior: behavior });
    } else {
      const r = stageWrap.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) stageWrap.scrollIntoView({ block: "nearest", behavior: behavior });
    }
  }
  function stopRun() {
    if (!worker) return;
    stopWorker();
    setStatus("done", "Stopped");
  }
  $("#run").addEventListener("click", run);
  $("#stop").addEventListener("click", stopRun);
  $("#reset").addEventListener("click", (e) => {
    arm(e.currentTarget, "Sure? Click again", () => {
      replaceAllCode(LESSONS[cur].starter);
      store.set("cgl-code-" + LESSONS[cur].id, LESSONS[cur].starter);
      stopWorker();
      hideOops();
      clearSay();
      lastCmds = null;
      drawIdle("Press Run to start", "Your drawings and games show up here.");
      setStatus("ready", "Ready");
    });
  });

  // ---------- keyboard and touch controls ----------
  const KEYMAP = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", " ": "space", Spacebar: "space" };
  const GAMEKEYS = { left: 1, right: 1, up: 1, down: 1, space: 1 };
  const normKey = (e) => KEYMAP[e.key] || (e.key && e.key.length === 1 ? e.key.toLowerCase() : null);
  const isTyping = (t) => t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable);
  const send = (key, down) => {
    if (worker) worker.postMessage({ type: "key", key: key, down: down });
  };
  document.addEventListener("keydown", (e) => {
    if (!worker || !running || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = normKey(e);
    if (!k) return;
    if (GAMEKEYS[k]) e.preventDefault();
    if (!e.repeat) send(k, true);
  });
  document.addEventListener("keyup", (e) => {
    const k = normKey(e);
    if (k) send(k, false);
  });
  window.addEventListener("blur", () => {
    if (worker) worker.postMessage({ type: "allup" });
    releasePad();
  });
  const padDown = new Set();
  function releasePad() {
    padDown.forEach((b) => b.classList.remove("is-down"));
    padDown.clear();
  }
  const pad = $("#pad");
  pad.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    try {
      b.setPointerCapture(e.pointerId);
    } catch (err) {}
    b.classList.add("is-down");
    padDown.add(b);
    send(b.dataset.key, true);
  });
  const padUp = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    b.classList.remove("is-down");
    padDown.delete(b);
    send(b.dataset.key, false);
  };
  pad.addEventListener("pointerup", padUp);
  pad.addEventListener("pointercancel", padUp);
  pad.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- lesson actions ----------
  function celebrate(host) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = document.createElement("div");
    b.className = "burst";
    b.style.left = "70px";
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const d = 60 + Math.random() * 70;
      const holder = document.createElement("span");
      holder.innerHTML = STAR_SVG;
      const svg = holder.firstChild;
      svg.style.setProperty("--dx", Math.cos(a) * d + "px");
      svg.style.setProperty("--dy", Math.sin(a) * d + "px");
      svg.style.animationDelay = Math.random() * 0.1 + "s";
      b.appendChild(svg);
    }
    host.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  }
  lessonEl.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-m]");
    if (!cb) return;
    const id = LESSONS[cur].id;
    const set = new Set(store.get("cgl-checks-" + id, []));
    if (cb.checked) set.add(+cb.dataset.m);
    else set.delete(+cb.dataset.m);
    store.set("cgl-checks-" + id, Array.from(set));
  });
  lessonEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const L = LESSONS[cur];
    const act = b.dataset.act;
    if (act === "hint") {
      hintShown[L.id] = Math.min((hintShown[L.id] || 0) + 1, L.hints.length);
      renderLesson();
    } else if (act === "peek") {
      answerShown[L.id] = true;
      renderLesson();
    } else if (act === "use-answer") {
      arm(b, "Replace my code? Click again", () => {
        replaceAllCode(L.answer);
        store.set("cgl-code-" + L.id, L.answer);
        hideOops();
      });
    } else if (act === "done") {
      done.add(L.id);
      store.set("cgl-done", Array.from(done));
      renderPath();
      updateMeter(true);
      renderLesson();
      const row = $("#doneRow");
      if (row) celebrate(row);
      renderGrownProgress();
    } else if (act === "next") {
      loadLesson(cur + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  pathEl.addEventListener("click", (e) => {
    const b = e.target.closest(".node");
    if (b) loadLesson(+b.dataset.i);
  });

  function loadLesson(i) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      store.set("cgl-code-" + LESSONS[cur].id, editor.value);
    }
    cur = Math.min(Math.max(i, 0), LESSONS.length - 1);
    store.set("cgl-cur", cur);
    const L = LESSONS[cur];
    stopWorker();
    const saved = store.get("cgl-code-" + L.id, null);
    setCode(typeof saved === "string" ? saved : L.starter);
    hideOops();
    clearSay();
    lastCmds = null;
    pendingFrame = null;
    drawIdle("Press Run to start", "Your drawings and games show up here.");
    setStatus("ready", "Ready");
    renderPath();
    renderLesson();
    const node = $(".node.is-current", pathEl);
    if (node && node.scrollIntoView) node.scrollIntoView({ block: "nearest", inline: "center" });
  }

  // ---------- views ----------
  const views = { lessons: $("#view-lessons"), grownups: $("#view-grownups") };
  const tabs = { lessons: $("#tab-lessons"), grownups: $("#tab-grownups") };
  function showView(name) {
    Object.keys(views).forEach((k) => {
      views[k].hidden = k !== name;
      tabs[k].setAttribute("aria-selected", k === name ? "true" : "false");
    });
    if (name !== "lessons") stopWorker();
    window.scrollTo({ top: 0 });
  }
  tabs.lessons.addEventListener("click", () => showView("lessons"));
  tabs.grownups.addEventListener("click", () => showView("grownups"));

  // ---------- grown-ups page ----------
  const PLAN = [
    { m: 15, q: "What would happen if we forgot the quote marks?" },
    { m: 20, q: "What is inside the box after power = power + 1000?" },
    { m: 25, q: "To move the sun lower, does y get bigger or smaller?" },
    { m: 25, q: "How many stars will it draw? Predict before you press Run." },
    { m: 25, q: "Why do we need background() inside onFrame?" },
    { m: 30, q: "What happens if we remove the minus sign in -speed?" },
    { m: 30, q: "Why does the basket keep moving while the key is held?" },
    { m: 30, q: "Why does the star jump back to -20 instead of 0?" },
    { m: 35, q: "What if the catch distance were 100? Fair or too easy?" },
    { m: 35, q: "How could the game get harder as your score goes up?" },
    { m: 45, q: "What would make this game feel like yours?" }
  ];
  function renderPlan() {
    const total = PLAN.reduce((a, p) => a + p.m, 0);
    $("#planBody").innerHTML = LESSONS.map((L, i) =>
      "<tr><td>" + L.id + "</td><td><strong>" + L.title + "</strong></td><td>" + L.tag + '</td><td class="fit">' + PLAN[i].m + (i === LESSONS.length - 1 ? "+" : "") + " min</td><td>" + esc(PLAN[i].q) + "</td></tr>").join("");
    $("#totalTime").textContent = "about " + Math.round(total / 60) + " hours";
  }
  function renderGrownProgress() {
    $("#progressText").textContent = done.size + " of " + LESSONS.length + " stars collected so far.";
  }
  $("#resetAll").addEventListener("click", (e) => {
    arm(e.currentTarget, "Really erase? Click again", () => {
      store.clearAll();
      done.clear();
      for (const k in hintShown) delete hintShown[k];
      for (const k in answerShown) delete answerShown[k];
      updateMeter(false);
      renderGrownProgress();
      loadLesson(0);
    });
  });

  // ---------- save codes ----------
  const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
  const b64d = (s) => decodeURIComponent(escape(atob(s)));
  function makeSaveCode() {
    const data = { v: 1, done: Array.from(done).sort((x, y) => x - y), cur: cur, code: {}, checks: {} };
    LESSONS.forEach((L) => {
      let c = store.get("cgl-code-" + L.id, null);
      if (L.id === LESSONS[cur].id) c = editor.value;
      if (typeof c === "string" && c !== L.starter) data.code[L.id] = c;
      const ch = store.get("cgl-checks-" + L.id, []);
      if (ch.length) data.checks[L.id] = ch;
    });
    return "SGL1:" + b64e(JSON.stringify(data));
  }
  function applySaveCode(raw) {
    const s = String(raw || "").replace(/\s+/g, "");
    if (s.indexOf("SGL1:") !== 0) return "That does not look like a save code. It should start with SGL1:";
    let data;
    try {
      data = JSON.parse(b64d(s.slice(5)));
    } catch (e) {
      return "That save code looks damaged. Copy all of it again.";
    }
    if (!data || data.v !== 1 || !Array.isArray(data.done)) return "That save code looks damaged. Copy all of it again.";
    const ids = LESSONS.map((L) => L.id);
    done.clear();
    data.done.forEach((id) => {
      if (ids.indexOf(id) >= 0) done.add(id);
    });
    store.set("cgl-done", Array.from(done));
    const code = data.code || {};
    const checks = data.checks || {};
    ids.forEach((id) => {
      if (typeof code[id] === "string" && code[id].length < 30000) store.set("cgl-code-" + id, code[id]);
      else store.remove("cgl-code-" + id);
      if (Array.isArray(checks[id])) store.set("cgl-checks-" + id, checks[id].filter((n) => Number.isInteger(n) && n >= 0 && n < 20));
      else store.remove("cgl-checks-" + id);
    });
    for (const k in hintShown) delete hintShown[k];
    for (const k in answerShown) delete answerShown[k];
    updateMeter(false);
    renderGrownProgress();
    loadLesson(Math.min(Math.max(parseInt(data.cur, 10) || 0, 0), LESSONS.length - 1));
    return "";
  }
  $("#makeSave").addEventListener("click", () => {
    const out = $("#saveOut");
    const msg = $("#saveMsg");
    out.value = makeSaveCode();
    const fallback = () => {
      out.focus();
      out.select();
      msg.textContent = "Select all of the code and copy it.";
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(() => {
          msg.textContent = "Copied! Paste it somewhere safe.";
        }, fallback);
      } else {
        fallback();
      }
    } catch (e) {
      fallback();
    }
  });
  $("#loadSave").addEventListener("click", (e) => {
    const raw = $("#saveIn").value;
    const msg = $("#loadMsg");
    msg.textContent = "";
    if (!raw.trim()) {
      msg.textContent = "Paste a save code first.";
      return;
    }
    arm(e.currentTarget, "Replace progress? Click again", () => {
      const problem = applySaveCode(raw);
      msg.textContent = problem || "Loaded! Her stars and code are back.";
      if (!problem) $("#saveIn").value = "";
    });
  });

  // ---------- go ----------
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) {}
  renderPlan();
  renderGrownProgress();
  updateMeter(false);
  loadLesson(cur);
  if (location.hash === "#grownups") showView("grownups");
})();
