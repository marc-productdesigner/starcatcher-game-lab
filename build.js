const fs = require("fs");
const r = (f) => fs.readFileSync(f, "utf8");
let html = r("page.html");
const put = (tag, content) => { html = html.split("<!--" + tag + "-->").join(content); };
put("CSS", r("style.css"));
put("LESSONS", r("lessons.js"));
put("ENGINE", r("engine.js"));
put("APP", r("app.js"));

// artifact.html: a fragment for Claude's artifact viewer, which adds its own document wrapper.
fs.writeFileSync("artifact.html", html);

// index.html: a complete page for GitHub Pages and for opening directly in a browser.
const cut = html.indexOf("</style>") + "</style>".length;
const head = html.slice(0, cut);
const body = html.slice(cut);
const full = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n" +
  "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
  head + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n";
fs.writeFileSync("index.html", full);
console.log("index.html", (full.length / 1024).toFixed(1) + " KB;", "artifact.html", (html.length / 1024).toFixed(1) + " KB");
