# Starcatcher Game Lab

A kid-friendly coding course that runs entirely in the browser. Eleven short levels teach real JavaScript (functions, variables, loops, `if`, keyboard input, collisions) and end with a finished star-catching game that the learner can remix. A "For grown-ups" tab holds the lesson plan, session tips and troubleshooting.

Nothing is installed, uploaded or tracked. Progress (stars and edited code) is saved in the browser's local storage.

## Use it

Open `index.html` in a browser, or serve this folder (for example with GitHub Pages).

## How it works

- Learner code runs in a Web Worker, so a loop that never ends can always be stopped.
- The worker sends drawing commands to the page, which paints them on a canvas.
- A small set of kid-friendly functions is provided: `say`, `background`, `circle`, `box`, `emoji`, `write`, `onFrame`, `keyDown`, `random`, `distance`, `beep`, `stopGame`.

## Files

| File | Purpose |
| --- | --- |
| `lessons.js` | The 11 levels: text, starter code, hints and answers |
| `engine.js` | The code runner that executes learner code in a worker |
| `app.js` | The page: editor, stage, hints, progress, grown-ups tab |
| `style.css` | Styles |
| `page.html` | Page template |
| `build.js` | Combines the files above into `index.html` (the complete page) and `artifact.html` (a fragment for Claude's artifact viewer, not committed) |
| `test.js` | Runs every level's starter and answer code and checks behaviour |
| `index.html` | The built, self-contained page that GitHub Pages serves |

## Edit and rebuild

```
node build.js   # regenerates index.html
node test.js    # checks every level's code
```

Requires Node.js. The page loads its fonts from Google Fonts and falls back to system fonts offline.
