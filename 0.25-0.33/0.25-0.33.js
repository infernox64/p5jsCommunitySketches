// your sketch goes here!

/*
 Transcript of relevant video section, with keywords 
 that could be used highlighted:


 "We acknowledge that not everyone has the TIME,
 FINANCIAL MEANS, or CAPACITY to ACTIVELY PARTICIPATE, 
 but we RECOGNIZE and ENCOURAGE INVOLVEMENT of all kinds."


 Current idea: floating particles of various shapes and 
 colours, represinting people of different backgrounds. 
 They all gently float around.

 One particle is the p5 asterisk. It "hunts" for 
 friends, moving from unvisited particle to unvisited
 particle. A particle may or may not join the network
 of friends (chance of joining determined by testing). 

 If it joins, it will become connected to the network.
 A line between itself and the particle that befriended
 it is formed, and it will start to hunt for friends as
 well.

 Note that this is a reference to Fry & Reas' famous
 Processing sketch. You know, the one that looks like:
 http://studio.sketchpad.cc/sp/pad/view/ro.9sfQKA0T6QIW-/rev.10

*/

var s = function( p ) {
  var particles, p5Asterisk;

  // Create a center-point to gently nudge 
  // the particles towards, so they don't
  // drift off-screen
  var cx, cy, cradius;

  var particleRadius;

  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(255, 255, 255);

    cx = (p.width/4 | 0);
    cy = (p.height/2 | 0);
    cradius = (p.min(cx, cy)/2 | 0);

    particleRadius = (p.min(p.width, p.height)/40 | 0);

    particles = new Array(0);
    for (var i = 0; i < 50; i++) {
      particles.push(new Drifter());
    };

    p5Asterisk = new Asterisk();
    p.imageMode(p.CENTER);
    p.strokeWeight(2);
  };

  p.draw = function() {
    p.background(255, 255, 255);
    for (var i = particles.length - 1; i >= 0; i--) {
      if (particles[i].isDrifting){
        particles[i].move();
      }
    };
    p5Asterisk.move();

    // Draw the unavailable particles in the back
    for (var i = particles.length - 1; i >= 0; i--) {
      if (particles[i].isNotAvailable){
        particles[i].draw();
      }
    };

    // Draw the friendship network
    // Match color of asterisk
    p.stroke(237, 34, 93, 128);
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].drawNetwork();
    };

    p5Asterisk.drawNetwork();

    // Draw the befriended and/or followed particles 
    for (var i = particles.length - 1; i >= 0; i--) {
      if (particles[i].isBefriended || particles[i].isFollowed){
        particles[i].draw();
      }
    };    

    p5Asterisk.draw();
  };


  // ========== DRIFTER ==========

  var Drifter = function () {

    // A drifter is either freely drifting around,
    // being followed by the p5 Asterisk or one
    // of its friends, a friend of the asterisk,
    // or not available
    this.isDrifting = false;
    this.isBefriended = false;
    this.isFollowed = false;
    this.isNotAvailable = false;

    // sets first position within a circle
    // make sure cx, cy and cradius are set before creating a Drifter!
    var t = p.random(p.TAU);
    var r = p.random(cradius/2, cradius*2);
    this.x = cx + r * Math.sin(t);
    this.y = cy + r * Math.cos(t);

    // store motion in polar coordinates
    this.theta = p.random(p.TAU);
    this.dtheta = p.random(-0.01, 0.01);
    this.ddtheta = p.random(-0.05 - this.dtheta * 0.1, 0.05 - this.dtheta * 0.1);
    this.v = p.random(0.2, 0.5);
    this.dx = Math.sin(this.theta) * this.v;
    this.dy = Math.cos(this.theta) * this.v;

    this.squiggle = new Squiggle(2);

    this.friends = new Array(0);
    this.maxFriends = 2;

    this.nextFriend = null;
  };

  Drifter.prototype.draw = function() {
    this.squiggle.draw(this.x, this.y);
    return this;
  };

  Drifter.prototype.drawNetwork = function() {
    if (this.friends.length > 0){
      for (var i = this.friends.length - 1; i >= 0; i--) {
        p.line(this.x, this.y, this.friends[i].x, this.friends[i].y);
      };
    }
    return this;
  }

  Drifter.prototype.move = function() {
    if (this.nextFriend != null){
      this.follow();
    } else {
      this.drift();
    }
     this.squiggle.move();
    return this;
  }

  Drifter.prototype.drift = function() {
    // random acceleration with negative feedback to angular velocity
    this.ddtheta = p.random(-0.1 - this.dtheta * 0.1, 0.1 - this.dtheta * 0.1);
    this.dtheta = this.dtheta + this.ddtheta;
    this.theta = (this.theta + this.dtheta + p.TAU) % p.TAU;

    // convert polar to carthesian coordinates
    this.dx = Math.sin(this.theta) * this.v;
    this.dy = Math.cos(this.theta) * this.v;

    if (this.isBefriended){
      this.dx *= 5;
      this.dy *= 5;
      // gently nudge into a ring around (cx, cy)
      var dx = this.x - cx;
      var dy = this.y - cy;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > cradius/2) {
         this.x = this.x - dx*0.005;
         this.y = this.y - dy*0.005;
      } else {
         this.x = this.x + dx*0.01;
         this.y = this.y + dy*0.01;
      }
    }    
    // add velocity to position
    this.x = this.x + this.dx;
    this.y = this.y + this.dy;

    return this;
  }  

  Drifter.prototype.follow = function() {
    var dx, dy;
    if (this.nextFriend != null){
      this.x = this.x * 0.9 + this.nextFriend.x * 0.1;
      this.y = this.y * 0.9 + this.nextFriend.y * 0.1;

      dx = (this.x - this.nextFriend.x);
      dy = (this.y - this.nextFriend.y);

      // If less than particleRadius pixels away from nextFriend
      if (dx*dx + dy*dy < particleRadius*particleRadius){
        this.nextFriend.isFollowed = false;
        //Try to befriend 
        this.befriend();
      }
    }
    return this;
  }

  Drifter.prototype.befriend = function(){
  	// the more friends you have, the harder it is to make new ones
  	// Gives a more "even" network

    if (p.random(1) < 3/(this.friends.length + 5)){
      
      if (!this.nextFriend.isBefriended){
        this.nextFriend.isBefriended = true;
        this.nextFriend.squiggle.tfactor = 2;
        this.nextFriend.squiggle.talpha = 255;
        this.nextFriend.nextTarget();
      }

      // Connect to new friend
      this.addFriend(this.nextFriend);

      // Connect new friend to the p5 Asterisk
      p5Asterisk.addFriend(this.nextFriend);

    } else if (!this.nextFriend.isBefriended){
      this.nextFriend.isNotAvailable = true;
      // Squiggle slower if not available,
      // be bigger in size, and nearly transparant
      this.nextFriend.squiggle.tfactor = 8;
      this.nextFriend.squiggle.talpha = 16;
    }

    this.nextTarget();
  }

  Drifter.prototype.addFriend = function(newFriend) {
    var alreadyFriends = false;
    for (var i = 0; i < this.friends.length; i++){
     alreadyFriends = alreadyFriends || this.friends[i] == newFriend;
    }
    if (!alreadyFriends){
      this.friends.push(newFriend);
    }
  }

  Drifter.prototype.nextTarget = function(){
    this.findTarget();
    //this.createTarget();
  }

  Drifter.prototype.findTarget = function() {
    this.nextFriend = null;
  	if(this.friends.length < this.maxFriends){
      // Filter out the particles who are 
      // not available or are being followed
      // and check if there are still free particles
      var potentialFriends = new Array(0);
      for (var i = particles.length - 1; i >= 0; i--) {
        if (!(particles[i].isBefriended || particles[i].isFollowed || particles[i].isNotAvailable)){
          potentialFriends.push(particles[i]);
        }
      };
      
      if (potentialFriends.length > 0){
        var index = ( p.random(potentialFriends.length) | 0 );
        this.nextFriend = potentialFriends[index];
        this.nextFriend.isFollowed = true;
        this.nextFriend.isDrifting = true;
      }
    }

    return this;
  }

  // //Alternatively: spawn a new potential friend
  // Drifter.prototype.createTarget = function() {
  //   if (particles.length < 50){
  //     this.nextFriend = new Drifter();
  //     particles.push(this.nextFriend);
  //   } else {
  //     this.nextFriend = null;
  //   }
  // }

  Drifter.prototype.sqDist = function(that){
  	var dx = this.x - that.x;
  	var dy = this.y - that.y;
  	return dx*dx + dy*dy;
  }
  // ========== ASTERISK ==========
  // Inherits from Drifter
  // Is the first to look for friends

  var Asterisk = function () {
    Drifter.call(this);
    // Image and matching colors
    this.img = p.loadImage("assets/p5-asterisk.png");

    //p5 is always looking for friends!
    this.isBefriended = true;
    this.isDrifting = true;
    this.maxFriends = particles.length;
    this.nextTarget();
  }

  Asterisk.prototype = Object.create(Drifter.prototype);

  Asterisk.prototype.constructor = Asterisk;

  Asterisk.prototype.draw = function(){
    p.image(this.img, this.x, this.y, particleRadius*2, particleRadius*2);
  }

  Asterisk.prototype.move = function() {
  	this.follow();
  }

  Asterisk.prototype.findTarget = function() {
    this.nextFriend = null;
  	if(this.friends.length < this.maxFriends){
      // Filter out the particles who are 
      // not available or are being followed
      // and check if there are still free particles
      var potentialFriends = new Array(0);
      for (var i = particles.length - 1; i >= 0; i--) {
        if (!(particles[i].isFollowed || particles[i].isNotAvailable)){
          potentialFriends.push(particles[i]);
        }
      };
      
      if (potentialFriends.length > 0){
        var index = (p.random(potentialFriends.length) | 0);
        this.nextFriend = potentialFriends[index];
        this.nextFriend.isFollowed = true;
        this.nextFriend.isDrifting = true;
      }
    }

    return this;
  }

  // ========== SQUIGGLE ==========
  // Squiggle shape - used by drifter, refactored into separate class

  var Squiggle = function (_factor) {
  	this.factor = _factor;
  	this.tfactor = _factor;
  	this.verticeTimer = p.random(2*this.factor, 5*this.factor);

    // make it a random squiggle
    var points = 2 * (p.random(7, 10) | 0);
    this.vertices = new Float32Array(points);
    this.tvertices = new Float32Array(this.vertices.length);
    this.randomiseVertices();
    this.randomiseTVertices();

    // squiggle's colour
    this.r = p.random(64, 255);
    this.g = p.random(64, 255);
    this.b = p.random(64, 255);
    //ensure that one channel is darker,
    //for visibility reasons
    var t = (p.random(3) | 0);
    switch(t){
      case 2:
      this.r = p.random(128);
      break;
      case 1:
      this.g = p.random(128);
      break;
      case 0:
      this.b = p.random(128);
    }
    this.alpha = 0;
    this.talpha = 64;
  }

  Squiggle.prototype.randomiseVertices = function () {
    for (var i = 0; i < this.vertices.length; i += 2) {
      var t = p.TAU* (p.random(2) + i) / this.vertices.length;
      var r =  p.random(0.1, 1);
      this.vertices[i]     = r*Math.sin(t);
      this.vertices[i + 1] = r*Math.cos(t);
    };
  }

  Squiggle.prototype.randomiseTVertices = function () {
    for (var i = 0; i < this.tvertices.length; i += 2) {
      var t = p.TAU* (p.random(2) + i) / this.tvertices.length;
      var r =  p.random(0.1, 1);
      this.tvertices[i]     = r*Math.sin(t);
      this.tvertices[i + 1] = r*Math.cos(t);
    };
  }

  // Makes it look like they're talking :)
  Squiggle.prototype.move = function() {
  	this.factor = this.factor * (15/16) + this.tfactor * (1/16);
    

    if (--this.verticeTimer < 0){
      this.randomiseTVertices();
      this.verticeTimer = (p.random(4*this.factor, 10*this.factor) | 0);
    }
    else {
      for (var i = this.vertices.length - 1; i >= 0; i -= 1) {
      	var speed = 0.25 / this.factor 
        this.vertices[i] = (1 - speed)*this.vertices[i] + speed*this.tvertices[i];
      }
    }
  }

  Squiggle.prototype.draw = function(x, y) {

    this.alpha = this.alpha * 0.9 + this.talpha * 0.1;
    p.fill(this.r, this.g, this.b, this.alpha);
    p.noStroke();

    p.beginShape();

    var radius = particleRadius * this.factor;
    for (var i = 0; i < this.vertices.length; i += 2) {
      p.curveVertex(x + radius * this.vertices[i], y + radius * this.vertices[i+1]);
    };
    p.curveVertex(x + radius * this.vertices[0], y + radius * this.vertices[1]);
    p.curveVertex(x + radius * this.vertices[2], y + radius * this.vertices[3]);
    p.curveVertex(x + radius * this.vertices[4], y + radius * this.vertices[5]);

    p.endShape();
  }


};

var myp5 = new p5(s);

