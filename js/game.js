// import { trials, trialIds } from "./data";

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

const vertVal = Math.sqrt(3) / 2;
const spacingRatio = 0.7;
let circlePositions = [[0, (-vertVal * 2) / 3], [-0.5, vertVal / 3], [0.5, vertVal / 3]];
circlePositions = circlePositions.map(x => [
  x[0] * CANVAS_HEIGHT * spacingRatio + CENTER_X,
  x[1] * CANVAS_HEIGHT * spacingRatio + CENTER_Y
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

  this.move = function(ctx, x, y) {
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
      sideWidth = _this.radius * 2.2;
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

function drawAll() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (var i = 0; i < circles.length; i++) {
    circles[i].draw(ctx);
  }
}

function getSwapPath(c1X, c1Y, c2X, c2Y, clockwise) {
  let points;
  if (clockwise) {
    points = Array(numSwapPoints)
      .fill(0)
      .map((x, i) => {
        const diffX = (c2X - c1X) / numSwapPoints;
        const diffY = (c2Y - c1Y) / numSwapPoints;
        return [c1X + (i + 1) * diffX, c1Y + (i + 1) * diffY];
      });
  } else {
    points = Array(numSwapPoints)
      .fill(0)
      .map((x, i) => {
        const diffX = (c1X - c2X) / numSwapPoints;
        const diffY = (c1Y - c2Y) / numSwapPoints;
        return [c2X + (i + 1) * diffX, c2Y + (i + 1) * diffY];
      });
  }
  return points;
}

function runSwap(index1, index2) {
  return new Promise(function(resolve, reject) {
    const c1X = circles[index1].x;
    const c1Y = circles[index1].y;
    const c2X = circles[index2].x;
    const c2Y = circles[index2].y;

    const path1 = getSwapPath(c1X, c1Y, c2X, c2Y, true);
    const path2 = getSwapPath(c1X, c1Y, c2X, c2Y, false);

    function doSwapAnimation(index1, index2, path1, path2, i) {
      if (i < numSwapPoints) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        circles[index1].move(ctx, path1[i][0], path1[i][1]);
        circles[index2].move(ctx, path2[i][0], path2[i][1]);

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

async function runTrial(swaps) {
  hideCircles();
  drawAll();
  await pause(1000);

  for (let s = 0; s < swaps.length; s++) {
    const swap = swaps[s];
    await runSwap(swap[0] - 1, swap[1] - 1);
  }

  makeGuess();
  await pause(2000);
  unhideCircles();
  drawAll();
}

async function main() {
  requestAnimationFrame(drawAll);

  for (let i = 0; i < TRIALIDS.length; i++) {
    await waitForNextKey("s");
    trialId = TRIALIDS[i];
    const swaps = TRIALS[trialId].swaps;
    await runTrial(swaps);
  }
}

main();
