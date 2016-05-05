//based on http://codepen.io/zadvorsky/pen/xzhBw?editors=1010

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
// canvas settings
var viewWidth = 1920,
  viewHeight = 1090,
  viewCenterX = viewWidth * 0.5,
  viewCenterY = viewHeight * 0.5,
  drawingCanvas = document.getElementById("drawing_canvas"),
  ctx,
  timeStep = (1 / 120),
  time = 0;
var paused = false;
var ppm = 48, // pixels per meter
  physicsWidth = viewWidth / ppm,
  physicsHeight = viewHeight / ppm,
  physicsCenterX = physicsWidth * 0.5,
  physicsCenterY = physicsHeight * 0.5;

var world;

var wheel,
  arrow,
  mouseBody,
  mouseConstraint;

var arrowMaterial,
  pinMaterial,
  contactMaterial;

var wheelSpinning = false,
  wheelStopped = true;

var particles = [];

var statusLabel = document.getElementById('status_label');

window.onload = function() {
  initDrawingCanvas();
  initPhysics();
  var fixedTimeStep = 1 / 120,
    maxSubSteps = 20,
    lastTimeMilliseconds;
  requestAnimationFrame(function animloop(timeMilliseconds) {
    requestAnimationFrame(animloop);
    var timeSinceLastCall = 0;
    if (timeMilliseconds !== undefined && lastTimeMilliseconds !== undefined) {
      timeSinceLastCall = (timeMilliseconds - lastTimeMilliseconds) / 1000;
    }
    draw();
    if (wheelSpinning === true) {
      $('#center_logo').css('transform', "rotate(" + (normalizeAngle(wheel.body.angle)) * -1 + "rad)");
    }
    $('#wheel_text').css('transform', "rotate(" + (normalizeAngle(wheel.body.angle)-0.105) * -1 + "rad)");
    world.step(fixedTimeStep, timeSinceLastCall, maxSubSteps);
    lastTimeMilliseconds = timeMilliseconds;
    update();

  });
  statusLabel.innerHTML = '';
};

function normalizeAngle(angle) {
  angle = angle % TWO_PI;
  if (angle < 0) {
    angle += (TWO_PI);
  }
  return angle;
}

function getColorForIndex(i) {
  //faf2d0 beige
  //D61923 rot
  //0053a0 blau
  switch (i) {
    case 0:
      return '#ffffff';
      break;
    case 1:
    case 3:
    case 5:
    case 7:
    case 9:
    case 11:
    case 13:
    case 15:
    case 17:
    case 19:
    case 21:
    case 23:
    case 25:
    case 27:
    case 29:
    case 31:
    case 33:
      return '#00204f';
      break;
    default:
      return '#fd8a02';
  }
}
//#feb300
function initDrawingCanvas() {
  drawingCanvas.width = 1920;
  drawingCanvas.height = 1200;
  ctx = drawingCanvas.getContext('2d');

  drawingCanvas.addEventListener('mousemove', updateMouseBodyPosition);
  drawingCanvas.addEventListener('mousedown', checkStartDrag);
  drawingCanvas.addEventListener('mouseup', checkEndDrag);
  drawingCanvas.addEventListener('mouseout', checkEndDrag);
  //document.addEventListener('mousedown', function(){this.paused = false;});
}

function updateMouseBodyPosition(e) {
  var p = getPhysicsCoord(e);
  mouseBody.position[0] = p.x;
  mouseBody.position[1] = p.y;
}

function checkStartDrag(e) {
  //console.log(e);
  if (world.hitTest(mouseBody.position, [wheel.body])[0]) {

    mouseConstraint = new p2.RevoluteConstraint(mouseBody, wheel.body, {
      worldPivot: mouseBody.position,
      collideConnected: false
    });

    world.addConstraint(mouseConstraint);

  }

  if (wheelSpinning === true) {
    wheelSpinning = false;
    wheelStopped = true;

    //statusLabel.innerHTML = "des dreht sisch doch noch...";
  } else {
    if (wheel.body.angularVelocity < 0 && wheel.body.angularVelocity > -1.5) {
      //wheel.body.angularVelocity = -1.5;
    } else if (wheel.body.angularVelocity > 0 && wheel.body.angularVelocity < 1.5) {
      //wheel.body.angularVelocity = 1.5;
    }
    $('#center_logo').css('transition', '');
  }

}

function checkEndDrag(e) {
  if (mouseConstraint) {
    world.removeConstraint(mouseConstraint);
    mouseConstraint = null;

    if (wheelSpinning === false && wheelStopped === true) {
      speed = Math.abs(wheel.body.angularVelocity)
      var dir = 'minus';
      if (wheel.body.angularVelocity > 0) {
        dir = 'plus';
      }
      //console.log(dir);
      if (speed > 1.0) {
        if (dir == 'minus') {
          wheel.body.angularVelocity = Math.max(speed * -1, -6);
        } else {
          wheel.body.angularVelocity = Math.min(speed, 6);
        }

        //console.log('good spin');
        statusLabel.innerHTML = ''
      } else {
        wheel.body.angularVelocity = 3;
        // console.log('sissy');
        // statusLabel.innerHTML = 'Da hat wohl jemand sein Äppler net uffgetrunke..kräftischer...';
        // setTimeout(function(){
        //     statusLabel.innerHTML = "";
        // }, 3000);
      }
      wheelSpinning = true;
      wheelStopped = false;
    }
  }
}

function getPhysicsCoord(e) {
  var rect = drawingCanvas.getBoundingClientRect(),
    x = (e.clientX - rect.left) / ppm,
    y = physicsHeight - (e.clientY - rect.top) / ppm;
  return {
    x: x,
    y: y
  };
}

function initPhysics() {
  world = new p2.World();
  world.islandSplit = false;
  world.solver.iterations = 60;
  world.solver.tolerance = 0.02;
  //world.solveConstraints = true;
  arrowMaterial = new p2.Material();
  pinMaterial = new p2.Material();
  contactMaterial = new p2.ContactMaterial(arrowMaterial, pinMaterial, {
    friction: 0.2,
    restitution: 0.2
  });
  world.addContactMaterial(contactMaterial);

  var wheelRadius = 10.8,
    wheelX = physicsCenterX + 2.05,
    wheelY = wheelRadius - 1,
    arrowX = wheelX,
    arrowY = wheelY + wheelRadius + 1.0; // + 0.625;

  wheel = new Wheel(wheelX, wheelY, wheelRadius, 33, 0.15, 10.8);
  //wheel.body.angle = (Math.PI / 32.5);
  wheel.body.angularVelocity = 1;
  arrow = new Arrow(arrowX, arrowY, 0.8, 1.8);

  mouseBody = new p2.Body();
  world.addBody(mouseBody);
}

function spawnPartices() {
  for (var i = 0; i < 500; i++) {
    var p0 = new Point(viewCenterX + 100, viewCenterY);
    var p1 = new Point(viewCenterX + 100, 0);
    var p2 = new Point(Math.random() * viewWidth, Math.random() * viewCenterY);
    var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);
    particles.push(new Particle(p0, p1, p2, p3));
  }
}

function update() {
  particles.forEach(function(p) {
    p.update();
    if (p.complete) {
      particles.splice(particles.indexOf(p), 1);
    }
  });
  if (wheelSpinning === true && wheelStopped === false && arrow.hasStopped() &&
    Math.abs(wheel.body.angularVelocity) < 0.2) {
    wheelStopped = true;
    wheelSpinning = false;
    wheel.body.angularVelocity = 0;
    var color = ctx.getImageData((1920 / 2) + 100, 200, 1, 1).data;
    $('body').css('background-color', 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')');
    if (color[0] == 255 && color[1] == 255 && color[2] == 255) {
      spawnPartices();
    }

    $('#center_logo').css('transition', 'transform 750ms ease-out');
    $('#center_logo').css('transform', 'rotate(0deg)');

    setTimeout(function() {
      $('body').css('background-color', '#ffffff');
    }, 5000);
    statusLabel.innerHTML = "";
  } else if (Math.abs(wheel.body.angularVelocity) > 0 && Math.abs(wheel.body.angularVelocity) < 0.5) {
    wheel.body.angularVelocity = wheel.body.angularVelocity * 0.9;
  }
}

function draw() {
  // ctx.fillStyle = '#fff';
  if (particles.length > 0) {
    ctx.clearRect(0, 0, 1920, 1200);
  } else {
    ctx.clearRect(0, 0, 1920, 100);
  }
  //could narrored down to just the arror
  wheel.draw();
  arrow.draw();

  particles.forEach(function(p) {
    p.draw();
  });
}



/////////////////////////////
// wheel of fortune
/////////////////////////////
function Wheel(x, y, radius, segments, pinRadius, pinDistance) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.segments = segments;
  this.pinRadius = pinRadius;
  this.pinDistance = pinDistance;

  this.pX = this.x * ppm;
  this.pY = (physicsHeight - this.y) * ppm;
  this.pRadius = this.radius * ppm;
  this.pPinRadius = this.pinRadius * ppm;
  this.pPinPositions = [];

  this.deltaPI = TWO_PI / this.segments;

  this.createBody();
  this.createPins();
  this.createStar();
}
Wheel.prototype = {
  createBody: function() {
    this.body = new p2.Body({
      mass: 5,
      position: [this.x, this.y]
    });
    this.body.angularDamping = 0.0;

    this.body.addShape(new p2.Circle({
      radius: this.radius
    }));
    this.body.shapes[0].sensor = true; //TODO use collision bits instead
    var axis = new p2.Body({
      position: [this.x, this.y]
    });
    var constraint = new p2.LockConstraint(this.body, axis);
    constraint.collideConnected = false;
    world.addBody(this.body);
    world.addBody(axis);
    world.addConstraint(constraint);
  },
  createStar: function() {
    i = 1;
    var pin = new p2.Circle({
      radius: this.pinRadius
    });
    var x = Math.cos(i / this.segments * TWO_PI) * this.pinDistance - 1,
      y = Math.sin(i / this.segments * TWO_PI) * this.pinDistance;
    pin.material = pinMaterial;
    this.body.addShape(pin, [10, 10]);
  },
  createPins: function() {
    var l = this.segments;
    for (var i = 0; i < l; i++) {
      var pin = new p2.Circle({
        radius: this.pinRadius
      });
      //this.pins[i]= pin;
      pin.material = pinMaterial;
      var x = Math.cos(i / l * TWO_PI) * this.pinDistance,
        y = Math.sin(i / l * TWO_PI) * this.pinDistance;
      this.body.addShape(pin, [x, y]);
      //this.body.ccdSpeedThreshold = 1;
      this.pPinPositions[i] = [x * ppm, -y * ppm];
    }
  },
  currentSegment: function() {
    var v = (Math.abs((wheel.body.angle * 180 / Math.PI)) + 29.5) % 360;
    return Math.abs(Math.floor(v / (360 / wheel.segments)));
  },
  draw: function() {
    // TODO this should be cached in a canvas, and drawn as an image
    // also, more doodads
    ctx.save();
    ctx.translate(this.pX, this.pY);

    ctx.beginPath();
    ctx.fillStyle = '#cccccc';
    ctx.arc(0, 0, this.pRadius + 24, 0, TWO_PI);
    ctx.fill();
    ctx.fillRect(-12, 0, 24, 400);
    ctx.rotate(-this.body.angle);
    for (var i = 0; i < this.segments; i++) {
      ctx.fillStyle = getColorForIndex(i);
      ctx.beginPath();
      ctx.arc(0, 0, this.pRadius, i * this.deltaPI, (i + 1) * this.deltaPI);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#401911';

    this.pPinPositions.forEach(function(p) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], this.pPinRadius, 0, TWO_PI);
      ctx.fill();
    }, this);

    ctx.restore();
  }
};

/////////////////////////////
// arrow on top of the wheel of fortune
/////////////////////////////
function Arrow(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.verts = [];

  this.pX = this.x * ppm;
  this.pY = (physicsHeight - this.y) * ppm;
  this.pVerts = [];

  this.createBody();
}
Arrow.prototype = {
  createBody: function() {
    this.body = new p2.Body({
      mass: 0.3,
      position: [this.x, this.y]
    });
    this.body.addShape(this.createArrowShape());

    var axis = new p2.Body({
      position: [this.x, this.y]
    });
    var constraint = new p2.RevoluteConstraint(this.body, axis, {
      worldPivot: [this.x, this.y]
    });
    constraint.collideConnected = false;

    var left = new p2.Body({
      position: [this.x - 2, this.y]
    });
    var right = new p2.Body({
      position: [this.x + 2, this.y]
    });
    var leftConstraint = new p2.DistanceConstraint(this.body, left, {
      localAnchorA: [-this.w * 2, this.h * 0.25],
      collideConnected: false
    });
    var rightConstraint = new p2.DistanceConstraint(this.body, right, {
      localAnchorA: [this.w * 2, this.h * 0.25],
      collideConnected: false
    });
    var s = 32,
      r = 1;

    leftConstraint.setStiffness(s);
    leftConstraint.setRelaxation(r);
    rightConstraint.setStiffness(s);
    rightConstraint.setRelaxation(r);

    world.addBody(this.body);
    world.addBody(axis);
    world.addConstraint(constraint);
    world.addConstraint(leftConstraint);
    world.addConstraint(rightConstraint);
  },

  createArrowShape: function() {
    this.verts[0] = [0, this.h * 0.25];
    this.verts[1] = [-this.w * 0.5, 0];
    this.verts[2] = [0, -this.h * 0.75];
    this.verts[3] = [this.w * 0.5, 0];

    this.pVerts[0] = [this.verts[0][0] * ppm, -this.verts[0][1] * ppm];
    this.pVerts[1] = [this.verts[1][0] * ppm, -this.verts[1][1] * ppm];
    this.pVerts[2] = [this.verts[2][0] * ppm, -this.verts[2][1] * ppm];
    this.pVerts[3] = [this.verts[3][0] * ppm, -this.verts[3][1] * ppm];

    var shape = new p2.Convex({
      vertices: this.verts
    });
    shape.material = arrowMaterial;

    return shape;
  },
  hasStopped: function() {
    var angle = Math.abs(this.body.angle % TWO_PI);
    return (angle < 1e-3 || (TWO_PI - angle) < 1e-3);
  },
  update: function() {

  },
  draw: function() {
    ctx.save();
    ctx.translate(this.pX, this.pY);
    ctx.rotate(-this.body.angle);

    ctx.fillStyle = '#401911';

    ctx.beginPath();
    ctx.moveTo(this.pVerts[0][0], this.pVerts[0][1]);
    ctx.lineTo(this.pVerts[1][0], this.pVerts[1][1]);
    ctx.lineTo(this.pVerts[2][0], this.pVerts[2][1]);
    ctx.lineTo(this.pVerts[3][0], this.pVerts[3][1]);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
};
/////////////////////////////
// your reward
/////////////////////////////
Particle = function(p0, p1, p2, p3) {
  this.p0 = p0;
  this.p1 = p1;
  this.p2 = p2;
  this.p3 = p3;

  this.time = 0;
  this.duration = 6 + Math.random() * 2;
  //this.color =  'hsl(' + Math.floor(Math.random() * 360) + ',100%,50%)';
  col = Math.floor(Math.random() * 360)
  this.color = 'rgb(' + col + ',' + col + ',' + col + ')';
  this.w = 10;
  this.h = 30;

  this.complete = false;
};
Particle.prototype = {
  update: function() {
    this.time = Math.min(this.duration, this.time + timeStep);

    var f = Ease.outCubic(this.time, 0, 1, this.duration);
    var p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

    var dx = p.x - this.x;
    var dy = p.y - this.y;

    this.r = Math.atan2(dy, dx) + HALF_PI;
    this.sy = Math.sin(Math.PI * f * 10);
    this.x = p.x;
    this.y = p.y;

    this.complete = this.time === this.duration;
  },
  draw: function() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    ctx.scale(1, this.sy);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

    ctx.restore();
  }
};
Point = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};
/////////////////////////////
// math
/////////////////////////////
/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
var Ease = {
  inCubic: function(t, b, c, d) {
    t /= d;
    return c * t * t * t + b;
  },
  outCubic: function(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
  inOutCubic: function(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  },
  inBack: function(t, b, c, d, s) {
    s = s || 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  }
};

function cubeBezier(p0, c0, c1, p1, t) {
  var p = new Point();
  var nt = (1 - t);

  p.x = nt * nt * nt * p0.x + 3 * nt * nt * t * c0.x + 3 * nt * t * t * c1.x + t * t * t * p1.x;
  p.y = nt * nt * nt * p0.y + 3 * nt * nt * t * c0.y + 3 * nt * t * t * c1.y + t * t * t * p1.y;

  return p;
}
