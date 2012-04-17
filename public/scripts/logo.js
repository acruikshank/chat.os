(function() {
  var RADIUS = 70;
  var COLORS = ['#6c0','#f60','#cc0','#f00','#06f'];
  var SETUP = 5000;
  var REPULSE = 250, DRAG = .008, DT = 10/1000, SPIN = 8, MOUSE_HEIGHT=10, MOUSE_REPULSE=1500;

  function el(id) { return document.getElementById(id); }
  var ctx = el('logo-anim').getContext('2d');
  var cacheCtx = el('logo-cache').getContext('2d');

  var v = {
    norm : function(v) { return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); },
    add : function(v0,v1) { return [v0[0]+v1[0],v0[1]+v1[1],v0[2]+v1[2]]; },
    sub : function(v0,v1) { return [v0[0]-v1[0],v0[1]-v1[1],v0[2]-v1[2]]; },
    dot : function(v0,v1) { return v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2]; },
    scale : function(v,s) { return [v[0]*s,v[1]*s,v[2]*s]; },
    cross : function(v1,v2) { return [
            v1[1]*v2[2] - v1[2]*v2[1],
            v1[2]*v2[0] - v1[0]*v2[2],
            v1[0]*v2[1] - v1[1]*v2[0] ]; },
    unit : function(v) { return this.scale(v,1/this.norm(v)); }
  }

  var q = {
    quaternion : function(vec) { return [0].concat(vec); },
    rotation : function( a, vec ) { var a2=a/2, sina2=Math.sin(a2);
               return [Math.cos(a2), vec[0]*sina2, vec[1]*sina2, vec[2]*sina2 ]; },
    safe_rotation : function( a, vec ) { return q.rotation(a,v.unit( vec )); },
    rotate : function( vec, rot ) { return q.mul(q.mul(rot,q.quaternion(vec)),q.conjugate(rot)).slice(1); },
    norm : function(q) { var w=q[0],x=q[1],y=q[2],z=q[3]; return Math.sqrt(w*w+x*x+y*y+z*z); },
    conjugate : function(q) { return [q[0],-q[1],-q[2],-q[3]] },
    mul : function(q1,q2) { return [ 
          q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2] - q1[3]*q2[3],
          q1[0]*q2[1] + q1[1]*q2[0] - q1[2]*q2[3] + q1[3]*q2[2],
          q1[0]*q2[2] + q1[1]*q2[3] + q1[2]*q2[0] - q1[3]*q2[1],
          q1[0]*q2[3] - q1[1]*q2[2] + q1[2]*q2[1] + q1[3]*q2[0] ]; },
  }

  function Particle(x,y,z,c) {
    var p={ color:c, position: [x,y,z], velocity:[0,0,0], history:[] };
    p.history.push([p.position,p.velocity]);
    p.rotate = function( a, vec ) { p.position = q.rotate(p.position, q.safe_rotation(a,vec)); }
    p.step = function(f, drag, dt) { 
      var ve = p.velocity, veOnSphere, veRot;
      ve = v.sub(v.add(ve, v.scale(f,dt)), v.scale(ve,drag));
      if ( ve[0]==0 && ve[1]==0 && ve[2]==0 ) return p.history.push([p.position,p.velocity]);
      veOnSphere = v.cross( v.unit(p.position), ve );
      veRot = q.safe_rotation( v.norm(veOnSphere) * dt, veOnSphere );
      p.position = q.rotate(p.position,veRot); 
      p.velocity = q.rotate(ve,veRot);
      p.history.push([p.position,p.velocity]);
    }
    return p;
  } 

  var points = [];
  for ( var i=0; i < COLORS.length; i++ ) {
    var pos = [RADIUS,0,0];
    pos = q.rotate( pos, q.rotation( Math.PI / 40, [0,0,1] ) );
    pos = q.rotate( pos, q.rotation( 2 * Math.PI * i  / COLORS.length, [1,0,0] ) );
    pos = q.rotate( pos, q.rotation( 2*Math.PI / 16, [0,0,-1] ) );
    pos = q.rotate( pos, q.rotation( 2*Math.PI / 16, [0,1,0] ) );
    
    points.push( Particle(pos[0],pos[1],pos[2],COLORS[i]) )
  }
  var stationaryRotation = [1,0,0];
  stationaryRotation = q.rotate( stationaryRotation, q.rotation( 2*Math.PI / 16, [0,0,-1] ) );
  stationaryRotation = q.rotate( stationaryRotation, q.rotation( 2*Math.PI / 16, [0,1,0] ) );



  var start = new Date().getTime(), avg;
  function step() {
    var ms = new Date().getTime() - start, f, theta = ms/2000;
    if ( ms < SETUP )
      return drawStationary(ms)

    for (var i=0,point; point = points[i]; i++ ) {
      f = [0,0,0];
      f = v.add( f, v.scale( v.unit( v.cross( point.position, [0,0,1] ) ), SPIN ) );
      if ( lastMousePos ) {
        var sep = v.sub(point.position, lastMousePos), dist = v.norm(sep);
        f = v.add( f, v.scale(sep, -MOUSE_REPULSE/(dist*dist)) );
      }
      for (var j=0,o; o = points[j]; j++) {
        if (o !== point) {
          var sep = v.sub(point.position, o.position), dist = v.norm(sep);
          f = v.add( f, v.scale(sep, -REPULSE/(dist*dist)) );
        }
      }
      point.step( f, DRAG, DT );
    }
  }

  function draw() {
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1;
    cacheCtx.globalAlpha = .8;
    cacheCtx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    cacheCtx.drawImage(el('logo-anim'),0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(el('logo-cache'),0,0,ctx.canvas.width, ctx.canvas.height);


    for (var i=0,point; point = points[i]; i++ ) {
      var last = point.history[0];

      for (var j=1, next; next = point.history[j]; j++) {
        ctx.globalAlpha = Math.min(1,Math.max(0, 3*((next[0][2] + RADIUS)/(2*RADIUS) - .25) ));
        ctx.beginPath();

        ctx.strokeStyle = point.color;
        ctx.moveTo( 80+last[0][0], 80+last[0][1] );
        ctx.lineTo( 80+next[0][0], 80+next[0][1] );
        ctx.stroke();
        last = next;
      }

      point.history = point.history.slice(point.history.length-1);
    }
  }

  function drawStationary(ms) {
    var t = Math.max(0,Math.min(5 * ms - 4 * SETUP,5*SETUP))/SETUP;
    t = 1-(1-t)*(1-t);
    el('logo').style.marginLeft = (.4 * (1-t)) + 'em';
    el('logo-t').style.marginLeft = (.6 * t) + 'em';
    el('logo-t').style.fontSize = (1 - .2*t) + 'em';
    el('logo-t').style.opacity = 1 - .4*t;
    //el('logo-t').style.marginRight = (.4 + .2*t) + 'em';
    for (var i=0,point; point = points[i]; i++ ) {
      point.rotate( 150*Math.PI/(SETUP+100-ms), stationaryRotation );
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc( 80+point.position[0], 80+point.position[1], 2, 0, 2*Math.PI );
      ctx.fill();
    }
  }


  var lastMousePos;
  document.body.onmousemove = function(e) {
    e = e || window.event;
    var logo = el('logo-anim');
    var canvasCenterX = logo.offsetLeft + logo.offsetWidth / 2;
    var canvasCenterY = logo.offsetTop + logo.offsetHeight / 2;
    var pos = [ e.clientX - canvasCenterX, e.clientY - canvasCenterY, MOUSE_HEIGHT ];
    lastMousePos = pos;
  }

  var runner = setInterval(function() {step();draw();}, 20);
})();