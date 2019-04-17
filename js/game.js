// Define canvas for drawing objects
const canvas = document.getElementById("canvas");

// Parameters to change
const circleColors = ["red", "green", "blue"];
const coverColor = "grey";
const CIRCLE_RADIUS = 50;
const SPEED = 1;
const ELLIPSE_RATIO = 0.4;
const NUM_CIRCLES = 3;

const vertVal = Math.sqrt(3) / 2;
const spacingRatio = 0.7;

let relPositions = [[0, (-vertVal * 2) / 3], [-0.5, vertVal / 3], [0.5, vertVal / 3]];

// Parameters not to change
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;
const numSwapPoints = 100 / SPEED;
const circleInitialPositions = relPositions.map(x => [
  x[0] * CANVAS_HEIGHT * spacingRatio + CENTER_X,
  x[1] * CANVAS_HEIGHT * spacingRatio + CENTER_Y + (vertVal * spacingRatio * CANVAS_HEIGHT) / 6
]);

// Global variables
let ctx = canvas.getContext("2d");
let circles = [];
let squares = [];

// Initialize circles
for (let i = 0; i < NUM_CIRCLES; i++) {
  circles.push(
    new Circle(
      circleInitialPositions[i][0],
      circleInitialPositions[i][1],
      CIRCLE_RADIUS,
      circleColors[i]
    )
  );
}

// Circle Class
function Circle(x, y, rad, color) {
  let _this = this;

  // constructor
  (function() {
    _this.x = x || null;
    _this.y = y || null;
    _this.radius = rad || null;
    _this.color = color || null;
    _this.hidden = false;
  })();

  this.moveTo = function(x, y) {
    _this.x = x;
    _this.y = y;
  };

  this.hide = function() {
    _this.hidden = true;
  };
  this.unhide = function() {
    _this.hidden = false;
  };
  this.draw = function() {
    if (_this.hidden) {
      sideWidth = _this.radius * 2.0;
      ctx.fillStyle = "grey";
      ctx.fillRect(_this.x - sideWidth / 2, _this.y - sideWidth / 2, sideWidth, sideWidth);
    } else {
      ctx.beginPath();
      ctx.arc(_this.x, _this.y, _this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = _this.color;
      ctx.fill();
    }
  };
}

// Refresh initial positions of circles
function refreshCircleInitialPositions() {
  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles[i].moveTo(circleInitialPositions[i][0], circleInitialPositions[i][1]);
  }
}

// Draw all circles (necessary after any change to canvas)
function drawAll() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles[i].draw();
  }
}

// Rotate x,y point around the origin by angle
function rotate(x, y, angle) {
  const nx = x * Math.cos(angle) - y * Math.sin(angle);
  const ny = y * Math.cos(angle) + x * Math.sin(angle);
  return [nx, ny];
}

// Calculate elliptical path for swap
function getSwapPath(c1X, c1Y, c2X, c2Y) {
  let points;
  const diffX = c2X - c1X;
  const diffY = c2Y - c1Y;
  const d = Math.sqrt(diffX * diffX + diffY * diffY);
  const a = d / 2;
  const b = a * ELLIPSE_RATIO;
  const ellipseAngle = Math.atan2(diffY, diffX);
  const ellipseCenter = [c1X + diffX / 2, c1Y + diffY / 2];

  points = Array(numSwapPoints)
    .fill(0)
    .map((x, i) => {
      const t = Math.PI - (Math.PI * (i + 1)) / numSwapPoints;
      const relX = a * Math.cos(t);
      const relY = b * Math.sin(t);
      const [absX, absY] = rotate(relX, relY, ellipseAngle);

      return [ellipseCenter[0] + absX, ellipseCenter[1] + absY];
    });

  return points;
}

// Run one swap
function runSwap(index1, index2) {
  return new Promise(function(resolve, reject) {
    const c1X = circles[index1].x;
    const c1Y = circles[index1].y;
    const c2X = circles[index2].x;
    const c2Y = circles[index2].y;

    const path1 = getSwapPath(c1X, c1Y, c2X, c2Y);
    const path2 = getSwapPath(c2X, c2Y, c1X, c1Y);

    // Animation for a swap
    function doSwapAnimation(index1, index2, path1, path2, i) {
      if (i < numSwapPoints) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        circles[index1].moveTo(path1[i][0], path1[i][1]);
        circles[index2].moveTo(path2[i][0], path2[i][1]);

        drawAll();

        requestAnimationFrame(function(timestamp) {
          doSwapAnimation(index1, index2, path1, path2, i + 1);
        });
      } else {
        resolve();
      }
    }

    requestAnimationFrame(function(timestamp) {
      doSwapAnimation(index1, index2, path1, path2, 0);
    });
  });
}

// Hide every circle
function hideCircles() {
  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles[i].hide();
  }
}

// Unhide every circle
function unhideCircles() {
  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles[i].unhide();
  }
}

// Pause execution for t milliseconds
function pause(t) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(), t);
  });
}

// Read keyboard key from user if user presses one
const readKey = () =>
  new Promise(resolve => window.addEventListener("keypress", resolve, { once: true }));

// Pause until user presses the correct keyboard key: keyName
async function waitForNextKey(keyName) {
  const keyPressed = await readKey();
  if (String.fromCharCode(keyPressed.which) !== keyName) {
    await waitForNextKey(keyName);
  }
}

// Make guess functionality (Not yet implemented)
function makeGuess() {}

// Update an html div with text
function updateDiv(divId, text) {
  document.getElementById(divId).innerText = text;
}

// Run one experiment trial
async function runTrial(swaps, trialIndex) {
  hideCircles();
  drawAll();
  await pause(1000);

  // Make each swap
  for (let s = 0; s < swaps.length; s++) {
    const swap = swaps[s];
    await runSwap(swap[0] - 1, swap[1] - 1);
    await pause(400);
  }

  updateDiv("status", `Trial ${trialIndex + 1}: Make Guess`);
  makeGuess();
  await pause(2000);
  unhideCircles();
  drawAll();
}

// Main code execution
async function main() {
  requestAnimationFrame(drawAll);

  for (let i = 0; i < TRIALIDS.length; i++) {
    updateDiv("status", `Trial ${i + 1}: Press 's' key to begin trial`);
    await waitForNextKey("s");
    updateDiv("status", `Trial ${i + 1}`);

    // Get correct swaps from global TRIALS variable, and run one trial with that data
    trialId = TRIALIDS[i];
    const swaps = TRIALS[trialId].swaps;
    await runTrial(swaps, i);
  }
  document.getElementById("status").innerText = "FINISHED!";
}

main();
