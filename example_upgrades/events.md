# events

Creates the chat.os.event function to permit upgrades to display short, timestamped text messages.
To add an event:
```javascript
chat.os.event( date, type, message );
```
where _date_ is the JavasScript Date when the event happened (not necessarily the current time),
_type_ is type of the event (this can be anything, but it gets added as a class to the event html
and can be used to style the event and change the icon), and _message_ is the text to be displayed
(should be restricted to a could hundred characters or less).

## Command
```
:upgrade {"type":"upgrade","name":"events","markup":"<div id=\"events\"></div>","style":"#events {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  overflow: visible;\n  padding-top: 100px;\n}\n\n#events .event {\n  display: block;\n  margin-bottom: 4px;\n}\n\n#events .icon {\n  opacity: .75;\n  display: inline-block;\n  border-radius: 30px;\n  width: 6px;\n  height: 6px;\n  border: 2px solid white;\n  margin: 0 4px 0 5px;\n  vertical-align: top;\n  background: #71e000 url(http://dl.dropbox.com/u/49528799/info.png) 50% 50%;\n  background-size: 36px 36px;\n}\n\n#events .text {\n  display: inline-block;\n  vertical-align: bottom;\n  height: 8px;\n  width: 0px;\n  opacity: 0;\n  overflow: hidden;\n  background: rgba(60,60,60,.6);\n  border-radius: 4px;\n  cursor: default;\n  -webkit-animation-duration: .5s;\n  -webkit-animation-timing-function: ease-in;\n  -webkit-animation-propert: box-shadow;\n}\n\n#events .new .text {\n  box-shadow: 0 0 15px #fff;\n}\n\n#events .text div {\n  font-size: 12px;\n  margin: 4px 12px;\n  width: 200px;\n}\n\n#events .time {\n  user-select:none;\n  display: inline-block;\n  font-size: 9px;\n  font-weight: bold;\n  height: 10px;\n  opacity: .75;\n  color: #fff;\n  line-height: 10px;\n  vertical-align: middle;\n  cursor: default;\n}","script":"(function() {\n  console.log( 'events 1.0' );\n  var FADE_HEIGHT = 50, FADE_START = 100, ITEM_HEIGHT = 14, \n      MAX_ITEM_HEIGHT = 52, POP_DURATION = 250;\n  var index = 0;\n  var scrollBottom =  0;\n  var lastAnimationTime;\n  var animationFrame;\n  var scrollVelocity = 0;\n  var mouseIsOut = true;\n  var eventState = {};\n  var animations = {};\n  var lastScreenY = 0;\n  var unscroll;\n\n  function el(id) { return document.getElementById(id); }\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n  function descendent( el, id ) { \n    for (; el; el=el.parentElement) if ( el.id===id ) return true;\n    return false;\n  }\n\n  chat.os.event = function( time, type, text ) {\n    var h = time.getHours(), m = time.getMinutes(), id = 'events-'+(index++);\n    var timestr = ((h%12)||12)+':'+(m<10?'0'+m:m)+(h<12?' AM':' PM');\n    var event = gen('div','event new ' + type, {id:id} )\n      .add( gen('span','icon') )\n      .add( gen('span','text').add( gen('div','t').text( text ) ) )\n      .add( gen('span','time').text( timestr ) )\n      .el();\n    eventState[event.id] = { pop:1 };\n    el('events').appendChild(event);\n\n    var data = event.getElementsByClassName('t')[0];\n    for (var i=0; i<100 && data.offsetHeight > 46; i++ ) \n      data.style.width = (data.offsetWidth+5)+'px'; \n    \n    popEvent( event, 1 );\n    needsUpdate();\n    setTimeout( function() { \n      el(id).setAttribute('class',el(id).getAttribute('class').replace(' new','')); \n      popEvent( event, 0 );\n      needsUpdate();\n    }, 5000 );\n    if ( mouseIsOut ) clear()\n  }\n\n  function screenToEvents( y ) { return y + index*ITEM_HEIGHT - window.innerHeight + scrollBottom; }\n  function eventsToScreen( y ) { return y - el('events').offsetHeight + 100 + window.innerHeight - scrollBottom; }\n\n  function mousemove (e) {\n    var p, icon, time, text, s, interpolations;\n    if ( e.screenX > 60 ) return mouseout();\n    mouseIsOut = false;\n    unscroll = null;\n    var oSlope = 1/FADE_HEIGHT, mid = FADE_START + (window.innerHeight - FADE_START) / 2;\n    if ( e.screenY > mid )\n      scrollVelocity = -.2 * Math.min( 1, Math.max( 0, (e.screenY - window.innerHeight + FADE_HEIGHT) * oSlope ) );\n    else\n      scrollVelocity = .2 * Math.min( 1, Math.max( 0, (FADE_START + FADE_HEIGHT - e.screenY) * oSlope ) );\n\n    if ( scrollVelocity != 0 ) needsUpdate();\n\n    var overIndex = Math.round(screenToEvents(e.screenY)/ITEM_HEIGHT);\n    for (var i=0,event; event = el('events-'+i); i++) {\n      p = [1,.3][Math.abs(i-overIndex)] || 0;\n      if ( p != eventState['events-'+i].pop ) {\n        popEvent( event, p );\n        eventState['events-'+i].pop = p;\n        needsUpdate();\n      }\n    }\n    lastScreenY = e.screenY;\n  }\n\n  function popEvent( event, p ) {\n    var icon = event.getElementsByClassName('icon')[0];\n    var time = event.getElementsByClassName('time')[0];\n    var text = event.getElementsByClassName('text')[0];\n    var s = 6 + Math.round(24 * p);\n    var interpolations = [\n      interpolate_pixels( icon.style, 'width', s ),\n      interpolate_pixels( icon.style, 'height', s ),\n      interpolate( icon.style, 'opacity', .75 + p/4 ),\n      interpolate_pixels( time.style, 'height', 10+Math.round(24*p) ),\n      interpolate_pixels( time.style, 'fontSize', 9 + Math.round(11*p) ),\n      interpolate_pixels( time.style, 'lineHeight', 9 + Math.round(11*p) ),\n      interpolate( time.style, 'opacity', .75 + p/4 ),\n      toggle_animation( time.style, 'fontWeight', .5, p?'bold':'normal', p?'normal':'bold' ),\n      interpolate_pixels( text.style, 'height', 6 + Math.round(44*p) ),\n      interpolate_pixels( text.style, 'width', (text.firstChild.offsetWidth + 24)*p ),\n      interpolate( text.style, 'opacity', p ),\n      interpolate_pixels( text.style, 'marginRight', Math.round(p*6) ) ];\n    animations[event.id] = timed_animations( new Date().getTime(), POP_DURATION, interpolations, INOUT_EASING );\n  }\n\n  function mouseout(e) {\n    if ( mouseIsOut || ( e && descendent( e.relatedTarget, 'events' ))) return;\n    mouseIsOut = true;\n    for (var i=0,event; event = el('events-'+i); i++) {\n      if ( eventState['events-'+i].pop != 0 ) {\n        popEvent( event, 0 );\n        eventState['events-'+i].pop = 0;\n        needsUpdate();\n      }\n    }\n    if ( scrollBottom != 0 ) {\n      var scrollBottomStart = scrollBottom;\n      unscroll = timed_animations( new Date().getTime(), 1000, [\n          function(fraction) { scrollBottom = (1-fraction) * scrollBottomStart; }\n        ], INOUT_EASING );\n      needsUpdate();\n    }\n    clear();\n  }\n\n  function needsUpdate() {\n    if ( ! animationFrame ) {\n      lastAnimationTime = new Date().getTime();\n      animationFrame = chat.os.requestAnimationFrame( 'events', 'main', animateEvents );\n    }\n  }\n\n  function animateEvents( time ) {\n    var needsNextFrame = false;\n    var heightOffset = 0;\n    var scrollOffset = el('events').offsetHeight - 100 - window.innerHeight + FADE_START;\n    if ( scrollVelocity != 0 ) {\n      scrollBottom -= (scrollVelocity * (time-lastAnimationTime))|0;\n      if ( scrollBottom < -scrollOffset ) { scrollBottom = -scrollOffset; scrollVelocity = 0; }\n      if ( scrollBottom > 0  ) { scrollBottom = 0; scrollVelocity = 0; }\n    }\n    if ( scrollVelocity != 0 ) {\n      needsNextFrame = true;\n      mousemove( {screenY:lastScreenY} );\n    }\n    \n    if ( unscroll )\n      unscroll( time ) >= 1 ? unscroll = null : needsNextFrame = true;\n\n    var animation, oSlope = 1/FADE_HEIGHT,  top = screenToEvents( FADE_START ),\n        mid=screenToEvents( FADE_START + (window.innerHeight - FADE_START) / 2 ),\n        bottom = screenToEvents( window.innerHeight );\n    for (var i=0, y, event; y=i*ITEM_HEIGHT, event = el('events-'+i); i++ ) {\n      if ( y < mid )\n        event.style.opacity = scrollBottom <= -scrollOffset ? 1 :Math.min( 1, Math.max( 0, (y - top) * oSlope ) );\n      else\n        event.style.opacity = scrollBottom >= 0 ? 1 : Math.min( 1, Math.max( 0, (bottom - y) * oSlope ) );\n\n      if ( animation = animations['events-'+i] )\n        animation( time ) >= 1 ? delete animations['events-'+i] : needsNextFrame = true;\n    }\n\n    heightOffset = (el('events').offsetHeight - 100 - ITEM_HEIGHT * index) >> 1;\n    if ( eventState['events-'+(index-1)].pop > 0 ) heightOffset = 0;\n    el('events').style.bottom = (scrollBottom - heightOffset) + 'px';\n \n    if ( needsNextFrame ) {\n      lastAnimationTime = time;\n      animationFrame = chat.os.requestAnimationFrame('events','main',animateEvents);\n    } else {\n      animationFrame = null;\n    }\n  }\n\n  function clear() {\n    scrollBottom = scrollVelocity = 0;\n    needsUpdate();\n  }\n\n  document.getElementById('events').onmousemove = mousemove;\n  document.getElementById('events').onmouseout = mouseout;\n\n  // animation functions\n  function splinef( x1, y1, x2, y2 ) {\n    var ax=3*x1-3*x2+1, bx=-6*x1+3*x2, cx=3*x1, a=3*y1-3*y2+1, b=-6*y1+3*y2, c=3*y1;\n    return function(x) {\n      var t=0,t2=0,dt=-x;\n      while (Math.abs(dt) > .0001) { t-=dt;t2=t*t;dt=(x-t*cx-t2*bx-t2*t*ax) / (-3*t2*ax-2*t*bx-cx); }\n      return a*t2*t + b*t2 + c*t; \n    };\n  }\n  var INOUT_EASING = splinef( 0.25, 0.1, 0.25, 1.0 );\n  var OUT_EASING = splinef( 0.1, 0.1, 0.25, 1.0 );\n  var LINEAR_EASING = function(fraction) { return fraction; }\n  function timed_animations( start, duration, animations, easing ) {\n    var end = start + duration;\n    return function( t ) {\n      if ( t >= end ) {  for (var i=0,a; a=animations[i]; i++ ) a(1); return 1; }\n      var fraction = easing( (t-start)/duration );\n      for (var i=0,a; a=animations[i]; i++ ) a( fraction );\n      return fraction;\n    }\n  }\n  function interpolate( style, prop, to ) {\n    var from = parseFloat(style[prop] || 0);\n    return function(fraction) { style[prop] = from + (to-from)*fraction; }\n  }\n  function interpolate_pixels( style, prop, to, easing ) {\n    var from = parseInt(style[prop] || 0);\n    return function(fraction) { style[prop] = ((from + (to-from)*fraction)|0) + 'px'; }\n  }\n  function toggle_animation( style, prop, threshold, low, high ) {\n    return function(fraction) { style[prop] = fraction > threshold ? high : low; }\n  }\n})()"}
```

## Markup
```html
<div id="events"></div>
```

## Style
```css
#events {
  position: absolute;
  bottom: 0;
  left: 0;
  overflow: visible;
  padding-top: 100px;
}

#events .event {
  display: block;
  margin-bottom: 4px;
}

#events .icon {
  opacity: .75;
  display: inline-block;
  border-radius: 30px;
  width: 6px;
  height: 6px;
  border: 2px solid white;
  margin: 0 4px 0 5px;
  vertical-align: top;
  background: #71e000 url(http://dl.dropbox.com/u/49528799/info.png) 50% 50%;
  background-size: 36px 36px;
}

#events .text {
  display: inline-block;
  vertical-align: bottom;
  height: 8px;
  width: 0px;
  opacity: 0;
  overflow: hidden;
  background: rgba(60,60,60,.6);
  border-radius: 4px;
  cursor: default;
  -webkit-animation-duration: .5s;
  -webkit-animation-timing-function: ease-in;
  -webkit-animation-propert: box-shadow;
}

#events .new .text {
  box-shadow: 0 0 15px #fff;
}

#events .text div {
  font-size: 12px;
  margin: 4px 12px;
  width: 200px;
}

#events .time {
  user-select:none;
  display: inline-block;
  font-size: 9px;
  font-weight: bold;
  height: 10px;
  opacity: .75;
  color: #fff;
  line-height: 10px;
  vertical-align: middle;
  cursor: default;
}
```

## Script
```javascript
(function() {
  console.log( 'events 1.0' );
  var FADE_HEIGHT = 50, FADE_START = 100, ITEM_HEIGHT = 14, 
      MAX_ITEM_HEIGHT = 52, POP_DURATION = 250;
  var index = 0;
  var scrollBottom =  0;
  var lastAnimationTime;
  var animationFrame;
  var scrollVelocity = 0;
  var mouseIsOut = true;
  var eventState = {};
  var animations = {};
  var lastScreenY = 0;
  var unscroll;

  function el(id) { return document.getElementById(id); }
  function gen( name, clss, atts ) {
    var el = document.createElement(name), out={};
    if ( typeof clss == 'object' ) atts=clss, clss=null;
    for (var att in atts) el.setAttribute(att,atts[att]);
    if ( clss ) el.setAttribute('class', clss);
    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };
    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };
    out.el = function() { return el; };
    return out;
  }
  function descendent( el, id ) { 
    for (; el; el=el.parentElement) if ( el.id===id ) return true;
    return false;
  }

  chat.os.event = function( time, type, text ) {
    var h = time.getHours(), m = time.getMinutes(), id = 'events-'+(index++);
    var timestr = ((h%12)||12)+':'+(m<10?'0'+m:m)+(h<12?' AM':' PM');
    var event = gen('div','event new ' + type, {id:id} )
      .add( gen('span','icon') )
      .add( gen('span','text').add( gen('div','t').text( text ) ) )
      .add( gen('span','time').text( timestr ) )
      .el();
    eventState[event.id] = { pop:1 };
    el('events').appendChild(event);

    var data = event.getElementsByClassName('t')[0];
    for (var i=0; i<100 && data.offsetHeight > 46; i++ ) 
      data.style.width = (data.offsetWidth+5)+'px'; 
    
    popEvent( event, 1 );
    needsUpdate();
    setTimeout( function() { 
      el(id).setAttribute('class',el(id).getAttribute('class').replace(' new','')); 
      popEvent( event, 0 );
      needsUpdate();
    }, 5000 );
    if ( mouseIsOut ) clear()
  }

  function screenToEvents( y ) { return y + index*ITEM_HEIGHT - window.innerHeight + scrollBottom; }
  function eventsToScreen( y ) { return y - el('events').offsetHeight + 100 + window.innerHeight - scrollBottom; }

  function mousemove (e) {
    var p, icon, time, text, s, interpolations;
    if ( e.screenX > 60 ) return mouseout();
    mouseIsOut = false;
    unscroll = null;
    var oSlope = 1/FADE_HEIGHT, mid = FADE_START + (window.innerHeight - FADE_START) / 2;
    if ( e.screenY > mid )
      scrollVelocity = -.2 * Math.min( 1, Math.max( 0, (e.screenY - window.innerHeight + FADE_HEIGHT) * oSlope ) );
    else
      scrollVelocity = .2 * Math.min( 1, Math.max( 0, (FADE_START + FADE_HEIGHT - e.screenY) * oSlope ) );

    if ( scrollVelocity != 0 ) needsUpdate();

    var overIndex = Math.round(screenToEvents(e.screenY)/ITEM_HEIGHT);
    for (var i=0,event; event = el('events-'+i); i++) {
      p = [1,.3][Math.abs(i-overIndex)] || 0;
      if ( p != eventState['events-'+i].pop ) {
        popEvent( event, p );
        eventState['events-'+i].pop = p;
        needsUpdate();
      }
    }
    lastScreenY = e.screenY;
  }

  function popEvent( event, p ) {
    var icon = event.getElementsByClassName('icon')[0];
    var time = event.getElementsByClassName('time')[0];
    var text = event.getElementsByClassName('text')[0];
    var s = 6 + Math.round(24 * p);
    var interpolations = [
      interpolate_pixels( icon.style, 'width', s ),
      interpolate_pixels( icon.style, 'height', s ),
      interpolate( icon.style, 'opacity', .75 + p/4 ),
      interpolate_pixels( time.style, 'height', 10+Math.round(24*p) ),
      interpolate_pixels( time.style, 'fontSize', 9 + Math.round(11*p) ),
      interpolate_pixels( time.style, 'lineHeight', 9 + Math.round(11*p) ),
      interpolate( time.style, 'opacity', .75 + p/4 ),
      toggle_animation( time.style, 'fontWeight', .5, p?'bold':'normal', p?'normal':'bold' ),
      interpolate_pixels( text.style, 'height', 6 + Math.round(44*p) ),
      interpolate_pixels( text.style, 'width', (text.firstChild.offsetWidth + 24)*p ),
      interpolate( text.style, 'opacity', p ),
      interpolate_pixels( text.style, 'marginRight', Math.round(p*6) ) ];
    animations[event.id] = timed_animations( new Date().getTime(), POP_DURATION, interpolations, INOUT_EASING );
  }

  function mouseout(e) {
    if ( mouseIsOut || ( e && descendent( e.relatedTarget, 'events' ))) return;
    mouseIsOut = true;
    for (var i=0,event; event = el('events-'+i); i++) {
      if ( eventState['events-'+i].pop != 0 ) {
        popEvent( event, 0 );
        eventState['events-'+i].pop = 0;
        needsUpdate();
      }
    }
    if ( scrollBottom != 0 ) {
      var scrollBottomStart = scrollBottom;
      unscroll = timed_animations( new Date().getTime(), 1000, [
          function(fraction) { scrollBottom = (1-fraction) * scrollBottomStart; }
        ], INOUT_EASING );
      needsUpdate();
    }
    clear();
  }

  function needsUpdate() {
    if ( ! animationFrame ) {
      lastAnimationTime = new Date().getTime();
      animationFrame = chat.os.requestAnimationFrame( 'events', 'main', animateEvents );
    }
  }

  function animateEvents( time ) {
    var needsNextFrame = false;
    var heightOffset = 0;
    var scrollOffset = el('events').offsetHeight - 100 - window.innerHeight + FADE_START;
    if ( scrollVelocity != 0 ) {
      scrollBottom -= (scrollVelocity * (time-lastAnimationTime))|0;
      if ( scrollBottom < -scrollOffset ) { scrollBottom = -scrollOffset; scrollVelocity = 0; }
      if ( scrollBottom > 0  ) { scrollBottom = 0; scrollVelocity = 0; }
    }
    if ( scrollVelocity != 0 ) {
      needsNextFrame = true;
      mousemove( {screenY:lastScreenY} );
    }
    
    if ( unscroll )
      unscroll( time ) >= 1 ? unscroll = null : needsNextFrame = true;

    var animation, oSlope = 1/FADE_HEIGHT,  top = screenToEvents( FADE_START ),
        mid=screenToEvents( FADE_START + (window.innerHeight - FADE_START) / 2 ),
        bottom = screenToEvents( window.innerHeight );
    for (var i=0, y, event; y=i*ITEM_HEIGHT, event = el('events-'+i); i++ ) {
      if ( y < mid )
        event.style.opacity = scrollBottom <= -scrollOffset ? 1 :Math.min( 1, Math.max( 0, (y - top) * oSlope ) );
      else
        event.style.opacity = scrollBottom >= 0 ? 1 : Math.min( 1, Math.max( 0, (bottom - y) * oSlope ) );

      if ( animation = animations['events-'+i] )
        animation( time ) >= 1 ? delete animations['events-'+i] : needsNextFrame = true;
    }

    heightOffset = (el('events').offsetHeight - 100 - ITEM_HEIGHT * index) >> 1;
    if ( eventState['events-'+(index-1)].pop > 0 ) heightOffset = 0;
    el('events').style.bottom = (scrollBottom - heightOffset) + 'px';
 
    if ( needsNextFrame ) {
      lastAnimationTime = time;
      animationFrame = chat.os.requestAnimationFrame('events','main',animateEvents);
    } else {
      animationFrame = null;
    }
  }

  function clear() {
    scrollBottom = scrollVelocity = 0;
    needsUpdate();
  }

  document.getElementById('events').onmousemove = mousemove;
  document.getElementById('events').onmouseout = mouseout;

  // animation functions
  function splinef( x1, y1, x2, y2 ) {
    var ax=3*x1-3*x2+1, bx=-6*x1+3*x2, cx=3*x1, a=3*y1-3*y2+1, b=-6*y1+3*y2, c=3*y1;
    return function(x) {
      var t=0,t2=0,dt=-x;
      while (Math.abs(dt) > .0001) { t-=dt;t2=t*t;dt=(x-t*cx-t2*bx-t2*t*ax) / (-3*t2*ax-2*t*bx-cx); }
      return a*t2*t + b*t2 + c*t; 
    };
  }
  var INOUT_EASING = splinef( 0.25, 0.1, 0.25, 1.0 );
  var OUT_EASING = splinef( 0.1, 0.1, 0.25, 1.0 );
  var LINEAR_EASING = function(fraction) { return fraction; }
  function timed_animations( start, duration, animations, easing ) {
    var end = start + duration;
    return function( t ) {
      if ( t >= end ) {  for (var i=0,a; a=animations[i]; i++ ) a(1); return 1; }
      var fraction = easing( (t-start)/duration );
      for (var i=0,a; a=animations[i]; i++ ) a( fraction );
      return fraction;
    }
  }
  function interpolate( style, prop, to ) {
    var from = parseFloat(style[prop] || 0);
    return function(fraction) { style[prop] = from + (to-from)*fraction; }
  }
  function interpolate_pixels( style, prop, to, easing ) {
    var from = parseInt(style[prop] || 0);
    return function(fraction) { style[prop] = ((from + (to-from)*fraction)|0) + 'px'; }
  }
  function toggle_animation( style, prop, threshold, low, high ) {
    return function(fraction) { style[prop] = fraction > threshold ? high : low; }
  }
})()
```