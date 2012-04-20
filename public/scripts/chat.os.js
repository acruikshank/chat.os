// requestAnimationFrame polyfil
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = 
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

(function() {
  function el(id) { return document.getElementById(id); }
  function remove(id) { if (el(id)) el(id).parentElement.removeChild(el(id)); }

  function callChain(a,cb) { 
    var args = Array.prototype.slice.call(arguments,2), i=0;
    function next() {
      if ( ! a[i] ) return cb ? cb.apply(this,args) : null;
      a[i++].apply(this,args);
    }
    args.push(next);
    next();
  }

  var ws;
  var inputHandlers = [];
  var outputHandlers = [];
  chat.os.upgrades = {};
  var replaceables = {};
  var intervals = {};
  var timeouts = {};
  var animationFrames = {};

  window.onload = function() {   
    el('message').onkeydown = function(e) { 
      e=e||window.event; var code=e.keyCode||e.which; 
      if ( code == 13 ) {
        chat.os.send( el('message').value );
        el('message').value = '';
        return false;
      }
      return true;
    }
    startSocket();
    el('message').focus();
  }

  function startSocket( reconnecting ) {
    var started = new Date().getTime();
    ws = io.connect();
    ws.on('connect', function() {
      ws.send(JSON.stringify({type:reconnecting?'reconnect':'identify', identity:chat.os.identity, room:chat.os.room}) );
    });
    ws.on('data', function(m) {
      callChain( inputHandlers, null, m ); 
    });
  }

  function upgrade( message, next ) {
    if ( message.type != 'upgrade' ) return next();

    if ( intervals[message.name] ) {
      for (var i in intervals[message.name]) clearInterval( intervals[message.name][i] );
      delete intervals[message.name];
    }

    if ( timeouts[message.name] ) {
      for (var i in timeouts[message.name]) clearTimeout( timeouts[message.name][i] );
      delete timeouts[message.name];
    }

    if ( animationFrames[message.name] ) {
      for (var i in animationFrames[message.name]) cancelAnimationFrame( animationFrames[message.name][i] );
      delete animationFrames[message.name];
    }

    if ( message.style ) {
      var style = document.createElement('STYLE');
      style.id = 'upgrade-style-' + message.name;
      style.setAttribute('type','text/css')
      style.appendChild( document.createTextNode(message.style) );
      remove(style.id);
      el('head').appendChild(style);
    }

    if ( message.markup ) {
      var markup = document.createElement('DIV');
      markup.innerHTML = message.markup;
      while ( markup.childNodes[0] ) {
        if ( markup.childNodes[0].id ) remove( markup.childNodes[0].id );
        document.body.appendChild( markup.childNodes[0] );
      }
    }

    if ( message.script ) {
      var script = document.createElement('SCRIPT');
      script.id = 'upgrade-script-' + message.name;
      script.setAttribute('language','javascript')
      script.appendChild( document.createTextNode(message.script) );
      remove( script.id );
      el('head').appendChild(script);
    }

    chat.os.upgrades[ message.name ] = message;
  }

  function reset( message, next ) {
    if ( message.type != 'reset' ) return next();
    return document.location.href = document.location.href;
  }

  function onaction( context, next ) {
    if ( ! context.text ) return next();
    var match = context.text.match(/^:(\S+)($|\s(.*)$)/);
    if ( ! match ) return next();
    if ( match[3] && match[3].match(/^[{\['"]/) )
      context.message = JSON.parse( match[3] );
    else
      context.message = {text:match[3]};
    context.message.type = match[1];
    next();
  }

  function display(message) {
    var text = message.type == 'comment' ? message.body : JSON.stringify(message);
    var response = document.createElement('P');
    response.appendChild( document.createTextNode(text) );
    el('responses').appendChild(response);
  }

  chat.os.send = function send( text, message ) {
    var context = { text:text||'', message: message || {type:'comment', body:text} };
    callChain( outputHandlers, sendMessage, context );
    function sendMessage(context) { ws.emit( 'message', JSON.stringify(context.message) ); }
  }

  chat.os.addInputHandler = function addInputHandler(handler, priority) {
    handler.priority = priority == null ? 5 : priority;
    inputHandlers = inputHandlers.filter(function(ih) { return !ih.name || ih.name != handler.name; }).concat([handler]);
    inputHandlers.sort(function(a,b) { return a.priority - b.priority;});
  }

  chat.os.addOutputHandler = function addOutputHandler(handler, priority) {
    handler.priority = priority == null ? 5 : priority;
    outputHandlers = outputHandlers.filter(function(oh) { return !oh.name || oh.name != handler.name; }).concat([handler]);
    outputHandlers.sort(function(a,b) { return a.priority - b.priority;});
  }

  chat.os.replaceSafe = function replaceSafe( name, f ) {
    if ( replaceables[name] ) return replaceables[name].replace(f);
    return (replaceables[name] = Replaceable(name,f));

    function Replaceable(name, f) {
      function wrapper() { return f.apply(this,arguments); }
      wrapper.replace = function replace(newF) { return f = newF, null; };
      return wrapper;
    }
  }

  chat.os.setInterval = function( upgrade, name, f, interval ) {
    intervals[upgrade] = intervals[upgrade] || {};
    if ( intervals[upgrade][name] ) clearInterval( intervals[upgrade][name] );
    return intervals[upgrade][name] = setInterval( f, interval );
  }

  chat.os.setTimeout = function( upgrade, name, f, interval ) {
    timeouts[upgrade] = timeouts[upgrade] || {};
    if ( timeouts[upgrade][name] ) clearInterval( timeouts[upgrade][name] );
    return timeouts[upgrade][name] = setInterval( f, interval );
  }

  chat.os.requestAnimationFrame = function( upgrade, name, f ) {
    animationFrames[upgrade] = animationFrames[upgrade] || {};
    if ( animationFrames[upgrade][name] ) cancelAnimationFrame( animationFrames[upgrade][name] );
    return animationFrames[upgrade][name] = requestAnimationFrame( f );
  }

  chat.os.addInputHandler(reset,1);
  chat.os.addInputHandler(upgrade);
  chat.os.addInputHandler(display,10);

  chat.os.addOutputHandler(onaction,1);
})();
