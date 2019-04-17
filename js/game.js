var canvas = document.getElementById("canvas");

var ctx = canvas.getContext("2d");
var circles = [];
var squares = [];

const circleColors = ["red", "green", "blue"];
const coverColor = "grey";

const CIRCLE_RADIUS = 50;
CANVAS_WIDTH = canvas.width;
CANVAS_HEIGHT = canvas.height;
CENTER_X = CANVAS_WIDTH / 2;
CENTER_Y = CANVAS_HEIGHT / 2;
const numSwapPoints = 100;
const ELLIPSE_RATIO = 0.4;

const vertVal = Math.sqrt(3) / 2;
const spacingRatio = 0.7;
let circlePositions = [[0, (-vertVal * 2) / 3], [-0.5, vertVal / 3], [0.5, vertVal / 3]];
circlePositions = circlePositions.map(x => [
  x[0] * CANVAS_HEIGHT * spacingRatio + CENTER_X,
  x[1] * CANVAS_HEIGHT * spacingRatio + CENTER_Y + (vertVal * spacingRatio * CANVAS_HEIGHT) / 6
]);

var c1 = new Circle(circlePositions[0][0], circlePositions[0][1], CIRCLE_RADIUS, circleColors[0]);
var c2 = new Circle(circlePositions[1][0], circlePositions[1][1], CIRCLE_RADIUS, circleColors[1]);
var c3 = new Circle(circlePositions[2][0], circlePositions[2][1], CIRCLE_RADIUS, circleColors[2]);

circles.push(c1);
circles.push(c2);
circles.push(c3);

// Circle object
function Circle(x, y, rad, color) {
  var _this = this;

  // constructor
  (function() {
    _this.x = x || null;
    _this.y = y || null;
    _this.radius = rad || null;
    _this.color = color || null;
    _this.hidden = false;
  })();

  this.moveTo = function(ctx, x, y) {
    _this.x = x;
    _this.y = y;
  };

  this.hide = function() {
    _this.hidden = true;
  };
  this.unhide = function() {
    _this.hidden = false;
  };
  this.draw = function(ctx) {
    if (_this.hidden) {
      sideWidth = _this.radius * 2.0;
      ctx.fillStyle = "grey";
      ctx.fillRect(_this.x - sideWidth / 2, _this.y - sideWidth / 2, sideWidth, sideWidth);

      // ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(_this.x, _this.y, _this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = _this.color;
      ctx.fill();
    }
  };
}

function refreshCirclePositions() {
  for (var i = 0; i < circles.length; i++) {
    circles[i].moveTo(ctx, circlePositions[i][0], circlePositions[i][1]);
  }
}

function drawAll() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (var i = 0; i < circles.length; i++) {
    circles[i].draw(ctx);
  }
}

function rotate(x, y, angle) {
  const nx = x * Math.cos(angle) - y * Math.sin(angle);
  const ny = y * Math.cos(angle) + x * Math.sin(angle);
  return [nx, ny];
}

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

function runSwap(index1, index2) {
  return new Promise(function(resolve, reject) {
    const c1X = circles[index1].x;
    const c1Y = circles[index1].y;
    const c2X = circles[index2].x;
    const c2Y = circles[index2].y;

    const path1 = getSwapPath(c1X, c1Y, c2X, c2Y);
    const path2 = getSwapPath(c2X, c2Y, c1X, c1Y);

    function doSwapAnimation(index1, index2, path1, path2, i) {
      if (i < numSwapPoints) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        circles[index1].moveTo(ctx, path1[i][0], path1[i][1]);
        circles[index2].moveTo(ctx, path2[i][0], path2[i][1]);

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

function hideCircles() {
  for (var i = 0; i < circles.length; i++) {
    circles[i].hide();
  }
}

function unhideCircles() {
  for (var i = 0; i < circles.length; i++) {
    circles[i].unhide();
  }
}

function pause(t) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(), t);
  });
}

const readKey = () =>
  new Promise(resolve => window.addEventListener("keypress", resolve, { once: true }));

async function waitForNextKey(keyName) {
  const keyPressed = await readKey();
  if (String.fromCharCode(keyPressed.which) !== keyName) {
    await waitForNextKey(keyName);
  }
}

function makeGuess() {}

async function runTrial(swaps, trialIndex) {
  hideCircles();
  drawAll();
  await pause(1000);

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

function updateDiv(divId, text) {
  document.getElementById(divId).innerText = text;
}

async function main() {
  requestAnimationFrame(drawAll);

  for (let i = 0; i < TRIALIDS.length; i++) {
    updateDiv("status", `Trial ${i + 1}: Press 's' key to begin trial`);
    await waitForNextKey("s");
    updateDiv("status", `Trial ${i + 1}`);
    trialId = TRIALIDS[i];
    const swaps = TRIALS[trialId].swaps;
    await runTrial(swaps, i);
  }
  document.getElementById("status").innerText = "FINISHED!";
}

main();
