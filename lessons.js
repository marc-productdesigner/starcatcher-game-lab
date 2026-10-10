const LESSONS = [
  {
    id: 1,
    title: "Hello, Computer!",
    tag: "Functions",
    story: "<p>A computer is super fast, but it is not very smart. It does exactly what you tell it, one line at a time. That makes <em>you</em> the boss.</p><p>Let's give it your very first order.</p>",
    big: { term: "Function", text: "A function is a word that makes the computer <em>do</em> something. <code>say(...)</code> is a function. Whatever you put inside the brackets is what it says. Words go inside \"quote marks\", and every line ends with a <code>;</code> like a full stop." },
    mission: [
      "Press <strong>Run</strong> and see what the computer says.",
      "Add two more <code>say</code> lines: one with your name, one with your favorite food.",
      "Make the computer say something silly."
    ],
    starter: `// Two slashes // start a note for humans.
// The computer skips notes and reads the rest.

say("Hello, world!");
`,
    hints: [
      "Copy the whole <code>say</code> line, paste it underneath, then change the words between the quote marks.",
      "Every line needs a <code>;</code> at the end, and every opening <code>\"</code> needs a closing <code>\"</code>."
    ],
    answer: `say("Hello, world!");
say("My name is Nova!");
say("My favorite food is pizza!");
say("Beep boop. I am a robot.");
`
  },
  {
    id: 2,
    title: "Boxes With Names",
    tag: "Variables",
    story: "<p>Games have to remember things: your score, your name, how many lives you have left. The computer remembers things in <strong>boxes with names</strong>.</p>",
    big: { term: "Variable", text: "<code>let hero = \"Captain Sparkle\";</code> makes a box called <code>hero</code> and puts the words inside. You can swap what is in the box any time. Words need \"quotes\". Numbers do not. A <code>+</code> glues things together." },
    mission: [
      "Change <code>hero</code> and <code>power</code> to your own hero and your own power number.",
      "Make a new box called <code>friend</code> and have the computer say it.",
      "Level up: write <code>power = power + 1000;</code> and then say the power again."
    ],
    starter: `let hero = "Captain Sparkle";
let power = 9000;

say("My hero is " + hero);
say("Power level: " + power);
`,
    hints: [
      "To make a new box, copy a <code>let</code> line and give it a new name.",
      "To change a box that already exists, leave out <code>let</code>: <code>power = power + 1000;</code>. Use <code>let</code> only when you first make a box."
    ],
    answer: `let hero = "Captain Sparkle";
let power = 9000;
let friend = "Sir Barksalot";

say("My hero is " + hero);
say("Power level: " + power);
say("Best friend: " + friend);

power = power + 1000;
say("After a snack, power level: " + power);
`
  },
  {
    id: 3,
    title: "Paint the Stage",
    tag: "Coordinates",
    story: "<p>Time to draw! The stage is a big grid. Every spot on it has two numbers: <strong>x</strong> (how far across) and <strong>y</strong> (how far down).</p><p>Tip: tick <strong>Show grid</strong> under the stage, and move your mouse over it to see the numbers.</p>",
    big: { term: "Coordinates", text: "<code>(0, 0)</code> is the top-left corner. <strong>x</strong> goes right. <strong>y</strong> goes <em>down</em>. Yes, down! The stage is 480 wide and 320 tall. Things you draw later land on top of things you drew earlier, like stickers." },
    mission: [
      "Run the starter and find the circle on the grid.",
      "Paint a scene: a sun in the top-right corner, a house, a tree, and a pet.",
      "Check the cheat sheet below for all the drawing words."
    ],
    starter: `background("skyblue");
circle(240, 160, 40, "gold");
box(0, 250, 480, 70, "limegreen");
emoji("🌳", 80, 215, 80);
`,
    hints: [
      "<code>box(x, y, width, height, \"color\")</code> puts its top-left corner at x and y. A door is just a small brown box.",
      "Draw the big background shapes first and the small stuff last, so nothing gets covered up."
    ],
    answer: `background("skyblue");

box(0, 250, 480, 70, "limegreen");     // grass
circle(420, 50, 36, "gold");            // sun

box(170, 160, 130, 100, "tomato");      // house
box(155, 138, 160, 28, "firebrick");    // roof
box(220, 205, 30, 55, "saddlebrown");   // door

emoji("🌳", 80, 215, 80);
emoji("🐶", 380, 245, 44);
emoji("☁️", 90, 60, 60);
`
  },
  {
    id: 4,
    title: "Do It Again!",
    tag: "Loops",
    story: "<p>Want ten stars? You could write ten lines. Boring! A <strong>loop</strong> does the same thing again and again so you only write it once.</p>",
    big: { term: "Loop", text: "<code>for (let i = 0; i &lt; 5; i++)</code> means: start <code>i</code> at 0, keep going while <code>i</code> is less than 5, and add 1 each time. Everything inside the <code>{ }</code> repeats. The counter <code>i</code> goes 0, 1, 2, 3, 4. Use it to space things out: <code>60 + i * 90</code> gives 60, 150, 240..." },
    mission: [
      "Predict first: how many stars will you see? Then press Run.",
      "Change the loop to draw 8 stars in a row, and fix the spacing so all of them fit on the stage.",
      "Add a second row of <code>✨</code> lower down.",
      "Bonus: sprinkle 30 small stars at random spots using <code>random(20, 460)</code>."
    ],
    starter: `background("midnightblue");

for (let i = 0; i < 5; i++) {
  emoji("⭐", 60 + i * 90, 80, 40);
}
`,
    hints: [
      "The stage is 480 wide. Try <code>50 + i * 54</code> for 8 stars. Do the math: the last star lands at 50 + 7 * 54 = 428.",
      "For random stars, make a second loop that runs 30 times. Inside it use <code>random(20, 460)</code> for x and <code>random(180, 310)</code> for y."
    ],
    answer: `background("midnightblue");

// two neat rows
for (let i = 0; i < 8; i++) {
  emoji("⭐", 50 + i * 54, 70, 36);
  emoji("✨", 50 + i * 54, 140, 30);
}

// a sprinkle of random stars
for (let n = 0; n < 30; n++) {
  emoji("⭐", random(20, 460), random(180, 310), 18);
}
`
  },
  {
    id: 5,
    title: "Make It Move!",
    tag: "Animation",
    story: "<p>A cartoon is lots of pictures shown really fast. Games work the same way. Your code inside <code>onFrame</code> runs about 60 times every second. Each time we wipe the stage, nudge things a tiny bit, and draw them again.</p><p>Notice the rocket flies away and never comes back? We will fix that next level.</p>",
    big: { term: "Animation loop", text: "Code inside <code>onFrame(() =&gt; { ... })</code> runs every frame. Change a variable a little bit each frame and things move! Start every frame with <code>background()</code> to wipe the old picture away." },
    mission: [
      "Change <code>speed</code> to 6. Then try 0.5. What happens?",
      "Add a second flyer, like <code>🛸</code>, in a different row with its own speed. It needs its own variables!",
      "Bonus: make something fall from the top instead of flying across."
    ],
    starter: `let x = 0;
let speed = 2;

onFrame(() => {
  background("skyblue");

  x = x + speed;
  emoji("🚀", x, 160, 56);
});
`,
    hints: [
      "Make two new boxes above <code>onFrame</code>: <code>let ufoX = 0;</code> and <code>let ufoSpeed = 5;</code>",
      "Inside <code>onFrame</code>, add <code>ufoX = ufoX + ufoSpeed;</code> and an <code>emoji</code> line that uses <code>ufoX</code>, with a different y so it flies in its own row."
    ],
    answer: `let x = 0;
let speed = 2;
let ufoX = 0;
let ufoSpeed = 5;

onFrame(() => {
  background("skyblue");

  x = x + speed;
  ufoX = ufoX + ufoSpeed;

  emoji("🚀", x, 100, 56);
  emoji("🛸", ufoX, 220, 56);
});
`
  },
  {
    id: 6,
    title: "Bounce and Decide",
    tag: "If statements",
    story: "<p>Games need to make choices. <em>If</em> the ball hits a wall, <em>then</em> turn around. The word for this is <code>if</code>.</p>",
    big: { term: "If statement", text: "<code>if (something) { ... }</code> runs the code in the curly braces only when the <em>something</em> is true. Handy symbols: <code>&lt;</code> less than, <code>&gt;</code> greater than, <code>||</code> means \"or\", <code>&amp;&amp;</code> means \"and\". A minus sign flips a number: <code>speed = -speed</code> turns it around." },
    mission: [
      "Run it. The ball bounces off the left and right walls and beeps.",
      "Predict: what if you delete the minus sign in <code>-speed</code>? Try it, then put it back.",
      "Make the ball also move up and down, bouncing off the floor and the ceiling."
    ],
    starter: `let x = 240;
let speed = 3;

onFrame(() => {
  background("lavender");
  x = x + speed;

  if (x > width - 25 || x < 25) {
    speed = -speed;
    beep(660);
  }

  emoji("⚽", x, 160, 50);
});
`,
    hints: [
      "Copy the x variables to make <code>y</code> and <code>ySpeed</code>. Start <code>y</code> at 160 and <code>ySpeed</code> at 2.",
      "Copy the whole <code>if</code> block, then swap <code>x</code> for <code>y</code>, <code>speed</code> for <code>ySpeed</code>, and <code>width</code> for <code>height</code>. Change the <code>emoji</code> line to use <code>y</code> too."
    ],
    answer: `let x = 240;
let speed = 3;
let y = 160;
let ySpeed = 2;

onFrame(() => {
  background("lavender");

  x = x + speed;
  y = y + ySpeed;

  if (x > width - 25 || x < 25) {
    speed = -speed;
    beep(660);
  }
  if (y > height - 25 || y < 25) {
    ySpeed = -ySpeed;
    beep(440);
  }

  emoji("⚽", x, y, 50);
});
`
  },
  {
    id: 7,
    title: "Take the Controls",
    tag: "Keyboard input",
    story: "<p>Now it is your turn to drive. <code>keyDown(\"left\")</code> is true for as long as the left arrow is held down. Combine it with <code>if</code> and you can steer anything.</p><p>Click <strong>Run</strong>, then use the arrow keys (or A and D). On a tablet, use the buttons under the stage.</p>",
    big: { term: "Input", text: "Input is anything the player does: pressing keys, tapping, clicking. <code>keyDown(\"left\")</code>, <code>keyDown(\"right\")</code>, <code>keyDown(\"up\")</code>, <code>keyDown(\"down\")</code> and <code>keyDown(\"space\")</code> all work." },
    mission: [
      "Drive the basket left and right. Try to drive it off the screen. Oops!",
      "Add two <code>if</code> rules so it stops at the walls. The basket is 56 wide, so keep x between 28 and <code>width - 28</code>.",
      "Bonus: hold <strong>Space</strong> for turbo speed."
    ],
    starter: `let x = 240;

onFrame(() => {
  background("honeydew");

  if (keyDown("left")) {
    x = x - 4;
  }
  if (keyDown("right")) {
    x = x + 4;
  }

  emoji("🧺", x, 280, 56);
});
`,
    hints: [
      "A wall rule looks like this: <code>if (x &lt; 28) { x = 28; }</code> Write another one for the right side using <code>width - 28</code>.",
      "For turbo, make a <code>speed</code> box. Set it to 4 at the start of each frame, then <code>if (keyDown(\"space\")) { speed = 9; }</code> and use <code>speed</code> when you move."
    ],
    answer: `let x = 240;
let speed = 4;

onFrame(() => {
  background("honeydew");

  speed = 4;
  if (keyDown("space")) {
    speed = 9;
  }

  if (keyDown("left")) {
    x = x - speed;
  }
  if (keyDown("right")) {
    x = x + speed;
  }

  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  emoji("🧺", x, 280, 56);
});
`
  },
  {
    id: 8,
    title: "Falling Stars",
    tag: "Random",
    story: "<p>Every game needs a little surprise. <code>random(30, 450)</code> picks a surprise number between 30 and 450. When the star falls off the bottom, we teleport it back to the top at a brand new random spot.</p>",
    big: { term: "Random", text: "<code>random(1, 6)</code> gives a whole number from 1 to 6, like rolling a dice. Use it so the game is different every time you play." },
    mission: [
      "Run it and watch the star fall again and again in different places.",
      "Add a second falling thing, like a <code>🌙</code>, with its own variables and its own speed.",
      "Bonus: make the star fall faster."
    ],
    starter: `let starX = random(30, 450);
let starY = 0;

onFrame(() => {
  background("midnightblue");

  starY = starY + 3;
  if (starY > height + 20) {
    starY = -20;
    starX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
});
`,
    hints: [
      "Make <code>moonX</code> and <code>moonY</code> boxes above <code>onFrame</code>. Start <code>moonY</code> at -100 so the moon arrives later than the star.",
      "Copy the star's falling code and the star's <code>emoji</code> line, then swap the names to <code>moonX</code> and <code>moonY</code> and use a bigger speed like 5."
    ],
    answer: `let starX = random(30, 450);
let starY = 0;
let moonX = random(30, 450);
let moonY = -100;

onFrame(() => {
  background("midnightblue");

  starY = starY + 3;
  if (starY > height + 20) {
    starY = -20;
    starX = random(30, 450);
  }

  moonY = moonY + 5;
  if (moonY > height + 20) {
    moonY = -20;
    moonX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("🌙", moonX, moonY, 40);
});
`
  },
  {
    id: 9,
    title: "Catch It!",
    tag: "Collisions and score",
    story: "<p>Now we put the basket and the star together. The star falls, the basket moves, but nothing happens when they meet. We need the computer to notice a catch.</p>",
    big: { term: "Collision", text: "<code>distance(x1, y1, x2, y2)</code> tells you how far apart two spots are. If the star is closer than 40 to the basket, you caught it! Then add 1 to your score and send the star back to the top." },
    mission: [
      "Run it. You can steer, but catching does nothing yet.",
      "Add an <code>if</code> that uses <code>distance</code> to notice a catch, add 1 to <code>score</code>, and reset the star.",
      "Add <code>beep(880)</code> for a happy catch sound."
    ],
    starter: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let score = 0;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3;
  if (starY > height + 20) {
    starY = -20;
    starX = random(30, 450);
  }

  // MISSION: catch the star here!

  emoji("⭐", starX, starY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");
});
`,
    hints: [
      "Put your <code>if</code> where the <code>MISSION</code> note is. The basket is at <code>x, 280</code> and the star is at <code>starX, starY</code>.",
      "Start with <code>if (distance(x, 280, starX, starY) &lt; 40) {</code> then add 1 to the score, beep, and reset the star the same way it resets at the bottom."
    ],
    answer: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let score = 0;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3;
  if (starY > height + 20) {
    starY = -20;
    starX = random(30, 450);
  }

  if (distance(x, 280, starX, starY) < 40) {
    score = score + 1;
    beep(880);
    starY = -20;
    starX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");
});
`
  },
  {
    id: 10,
    title: "Lives and Game Over",
    tag: "Game state",
    story: "<p>Right now you cannot lose, so you cannot really win either. Let's add <strong>lives</strong>. Miss a star and lose one. Lose all three and it is game over.</p><p>We will also make the stars speed up as your score climbs.</p>",
    big: { term: "Game state", text: "State means everything the game needs to remember right now: score, lives, positions. <code>stopGame()</code> freezes the game when you are done. Press Run to play again." },
    mission: [
      "Make a <code>lives</code> box that starts at 3.",
      "When the star falls past the bottom, take away a life and play a low <code>beep(200)</code>.",
      "Show the lives as hearts using a loop.",
      "When <code>lives</code> hits 0, write GAME OVER and call <code>stopGame()</code>.",
      "Bonus: make stars fall faster as the score goes up."
    ],
    starter: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let score = 0;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3;

  if (distance(x, 280, starX, starY) < 40) {
    score = score + 1;
    beep(880);
    starY = -20;
    starX = random(30, 450);
  }

  if (starY > height + 20) {
    // MISSION: the star was missed. Lose a life here!
    starY = -20;
    starX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");
});
`,
    hints: [
      "Add <code>let lives = 3;</code> at the top. Where the star is missed, write <code>lives = lives - 1;</code>",
      "Hearts: <code>for (let i = 0; i &lt; lives; i++) { emoji(\"❤️\", 450 - i * 36, 28, 28); }</code> Game over: <code>if (lives &lt;= 0) { write(\"GAME OVER\", 100, 150, 48, \"tomato\"); stopGame(); }</code> at the very end of <code>onFrame</code>.",
      "To speed up, change <code>starY = starY + 3;</code> to <code>starY = starY + 3 + score * 0.3;</code>"
    ],
    answer: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let score = 0;
let lives = 3;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3 + score * 0.3;

  if (distance(x, 280, starX, starY) < 40) {
    score = score + 1;
    beep(880);
    starY = -20;
    starX = random(30, 450);
  }

  if (starY > height + 20) {
    lives = lives - 1;
    beep(200);
    starY = -20;
    starX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");

  for (let i = 0; i < lives; i++) {
    emoji("❤️", 450 - i * 36, 28, 28);
  }

  if (lives <= 0) {
    write("GAME OVER", 100, 150, 48, "tomato");
    write("Press Run to play again", 120, 200, 20, "white");
    stopGame();
  }
});
`
  },
  {
    id: 11,
    title: "Make It Yours",
    tag: "Remix",
    story: "<p>You built a real game. Now the best part: make it <em>yours</em>. Real game makers remix and tweak until it feels just right.</p><p>Pick at least three ideas from the mission list. Change them, break them, fix them.</p>",
    big: { term: "Remix", text: "Every programmer starts by changing other people's code. Change a number, see what happens. If it breaks, press Reset or undo, and try again. Breaking things is how you learn." },
    mission: [
      "Change the basket, the star, the colors, and the background.",
      "Give your game a name and write it on the stage.",
      "Add a bomb <code>💣</code> that costs a life if you catch it. (Peek at the answer if you get stuck.)",
      "Add a golden star <code>🌟</code> worth 5 points that falls faster.",
      "Make it harder or easier: change the speed, the number of lives, or the catch distance.",
      "Show your family and let them play!"
    ],
    starter: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let score = 0;
let lives = 3;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3 + score * 0.3;

  if (distance(x, 280, starX, starY) < 40) {
    score = score + 1;
    beep(880);
    starY = -20;
    starX = random(30, 450);
  }

  if (starY > height + 20) {
    lives = lives - 1;
    beep(200);
    starY = -20;
    starX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");

  for (let i = 0; i < lives; i++) {
    emoji("❤️", 450 - i * 36, 28, 28);
  }

  if (lives <= 0) {
    write("GAME OVER", 100, 150, 48, "tomato");
    write("Press Run to play again", 120, 200, 20, "white");
    stopGame();
  }
});
`,
    hints: [
      "Easy wins: change <code>\"midnightblue\"</code> to another color, swap the emoji, or set <code>lives</code> to 5.",
      "For a bomb, make <code>bombX</code> and <code>bombY</code> boxes (start <code>bombY</code> at -200), make it fall, and when <code>distance</code> to the basket is under 40 do <code>lives = lives - 1;</code> and reset the bomb."
    ],
    answer: `let x = 240;
let starX = random(30, 450);
let starY = 0;
let bombX = random(30, 450);
let bombY = -200;
let score = 0;
let lives = 3;

onFrame(() => {
  background("midnightblue");

  if (keyDown("left")) {
    x = x - 6;
  }
  if (keyDown("right")) {
    x = x + 6;
  }
  if (x < 28) {
    x = 28;
  }
  if (x > width - 28) {
    x = width - 28;
  }

  starY = starY + 3 + score * 0.3;
  bombY = bombY + 4;

  if (distance(x, 280, starX, starY) < 40) {
    score = score + 1;
    beep(880);
    starY = -20;
    starX = random(30, 450);
  }

  if (starY > height + 20) {
    lives = lives - 1;
    beep(200);
    starY = -20;
    starX = random(30, 450);
  }

  if (distance(x, 280, bombX, bombY) < 40) {
    lives = lives - 1;
    beep(150);
    bombY = -20;
    bombX = random(30, 450);
  }

  if (bombY > height + 20) {
    bombY = -20;
    bombX = random(30, 450);
  }

  emoji("⭐", starX, starY, 40);
  emoji("💣", bombX, bombY, 40);
  emoji("🧺", x, 280, 56);
  write("Score: " + score, 12, 28, 22, "white");

  for (let i = 0; i < lives; i++) {
    emoji("❤️", 450 - i * 36, 28, 28);
  }

  if (lives <= 0) {
    write("GAME OVER", 100, 150, 48, "tomato");
    write("Press Run to play again", 120, 200, 20, "white");
    stopGame();
  }
});
`
  }
];

if (typeof module !== "undefined") module.exports = LESSONS;
