// ---- Code runner -------------------------------------------------------
// Kid code runs inside a Web Worker. The worker never touches the page: it
// sends drawing commands and messages back, and the page draws them. Pressing
// Stop kills the worker, so a loop that never ends cannot freeze anything.

function workerEngine() {
  const W = 480, H = 320;
  const MAX_CMDS = 3000, MAX_SAY = 400;
  let cmds = [];
  let frameFn = null;
  let timer = null;
  let stopped = false;
  let guardCount = 0;
  let sayCount = 0;
  let lastBeep = 0;
  const keys = new Set();
  const post = (m) => self.postMessage(m);

  const num = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return isFinite(n) ? n : 0;
  };
  const col = (c, fallback) => (c === undefined || c === null ? fallback : String(c));
  const show = (v) => {
    if (typeof v === "string") return v;
    try {
      return typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    } catch (e) {
      return String(v);
    }
  };
  const add = (c) => {
    if (cmds.length < MAX_CMDS) cmds.push(c);
  };
  const flush = () => post({ type: "frame", cmds: cmds });

  const stopLoop = () => {
    stopped = true;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
  const fail = (e) => {
    stopLoop();
    const err = e && typeof e === "object" ? e : { name: "Error", message: String(e) };
    post({ type: "error", name: String(err.name || "Error"), message: String(err.message || ""), stack: String(err.stack || "") });
  };
  const step = () => {
    if (stopped || !frameFn) return;
    guardCount = 0;
    cmds = [];
    try {
      frameFn();
    } catch (e) {
      fail(e);
      return;
    }
    flush();
    if (stopped) {
      stopLoop();
      post({ type: "ended" });
    }
  };

  const aliases = { left: ["left", "a"], right: ["right", "d"], up: ["up", "w"], down: ["down", "s"], space: ["space", " "] };

  const api = {
    width: W,
    height: H,
    say: function () {
      if (sayCount >= MAX_SAY) return;
      sayCount++;
      let text = Array.prototype.map.call(arguments, show).join(" ");
      if (text.length > 400) text = text.slice(0, 400) + "...";
      post({ type: "say", text: text });
      if (sayCount === MAX_SAY) post({ type: "say", text: "(That is a lot of talking! I will stop here.)" });
    },
    background: function (color) {
      add(["bg", col(color, "white")]);
    },
    circle: function (x, y, size, color) {
      add(["circle", num(x), num(y), Math.max(0, num(size)), col(color, "black")]);
    },
    box: function (x, y, w, h, color) {
      add(["box", num(x), num(y), num(w), num(h), col(color, "black")]);
    },
    emoji: function (pic, x, y, size) {
      add(["emoji", String(pic), num(x), num(y), size === undefined ? 32 : Math.max(1, num(size))]);
    },
    write: function (words, x, y, size, color) {
      add(["write", show(words), num(x), num(y), size === undefined ? 20 : Math.max(1, num(size)), col(color, "black")]);
    },
    onFrame: function (fn) {
      if (typeof fn !== "function") throw new TypeError("onFrame needs a function");
      frameFn = fn;
    },
    keyDown: function (k) {
      const key = String(k).toLowerCase();
      return (aliases[key] || [key]).some((n) => keys.has(n));
    },
    random: function (a, b) {
      let lo = num(a), hi = num(b);
      if (b === undefined) {
        hi = lo;
        lo = 0;
      }
      if (lo > hi) {
        const t = lo;
        lo = hi;
        hi = t;
      }
      lo = Math.ceil(lo);
      hi = Math.floor(hi);
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    },
    distance: function (x1, y1, x2, y2) {
      return Math.hypot(num(x1) - num(x2), num(y1) - num(y2));
    },
    beep: function (pitch, secs) {
      const now = Date.now();
      if (now - lastBeep < 70) return;
      lastBeep = now;
      post({ type: "beep", freq: Math.min(2000, Math.max(60, num(pitch === undefined ? 440 : pitch))), dur: Math.min(1, Math.max(0.05, num(secs === undefined ? 0.15 : secs))) });
    },
    stopGame: function () {
      stopped = true;
    }
  };

  Object.assign(self, api);
  self.__guard = function () {
    if (++guardCount > 300000) {
      const e = new Error("LOOP_TOO_LONG");
      e.name = "LoopError";
      throw e;
    }
  };
  self.__fail = fail;
  self.__step = step;
  self.__done = function () {
    if (stopped) return;
    if (frameFn) {
      timer = setInterval(step, 1000 / 60);
    } else {
      flush();
      post({ type: "ended" });
    }
  };
  self.onmessage = function (e) {
    const m = e.data || {};
    if (m.type === "key") {
      if (m.down) keys.add(m.key);
      else keys.delete(m.key);
    } else if (m.type === "allup") {
      keys.clear();
    }
  };
}

const ENGINE_SRC = "(" + workerEngine.toString() + ")();";

// Adds a safety check to the start of every for/while loop body.
function guardLoops(code) {
  return code.replace(/\b(for|while)\s*\(([^\n]*?)\)\s*\{/g, function (m) {
    return m + "__guard();";
  });
}

function buildWorkerSource(code) {
  const offset = (ENGINE_SRC.match(/\n/g) || []).length + 1; // lines before the user's line 1
  const body = guardLoops(String(code));
  const src = ENGINE_SRC + "\n" + "try{(function(){" + body + "\n})();}catch(e){__fail(e);}\n__done();";
  return { src: src, offset: offset };
}

if (typeof module !== "undefined") module.exports = { workerEngine, ENGINE_SRC, guardLoops, buildWorkerSource };
