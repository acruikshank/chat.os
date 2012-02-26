# command-history

Maintains a list of all commands you have entered into the message bar, and allows you
to return to them using the up and down arrow keys.


## Command
```
:upgrade {"type":"upgrade","name":"command-history","markup":"","style":"","script":"(function() {\n  console.log('command-history v1.2')\n  function el(id) { return document.getElementById(id); }\n  function wrap(o,prop,f) { \n    var old = o[prop]; \n    o[prop] = (old ? function() { \n      return f.apply(this,arguments)!==false && old.apply(this,arguments); \n      } : f); \n  }\n\n  var history = [];\n  var index = 0;\n\n  var keyHandler = chat.os.replaceSafe( 'command-history-key-handler', function(e) { \n    e=e||window.event; var code=e.keyCode||e.which; \n    if ( code == 38 ) {  // up\n      if ( index > 0 )\n        el('message').value = history[--index];\n      return false;\n    } else if ( code == 40 ) { // down\n      if ( index < history.length )\n        el('message').value = history[++index]||'';\n      return false;\n    }\n    return true;\n  } );\n  if ( keyHandler ) \n    wrap( el('message'), 'onkeydown', keyHandler );\n\n  chat.os.addOutputHandler( function commandHistoryOutputHandler( ctx, next ) {\n    try {\n      if ( ctx.text ) history.push( ctx.text );\n      index = history.length;\n    } finally { next(); }\n  }, 0 );\n\n})();"}
```

## Script
```javascript
(function() {
  console.log('command-history v1.2')
  function el(id) { return document.getElementById(id); }
  function wrap(o,prop,f) { 
    var old = o[prop]; 
    o[prop] = (old ? function() { 
      return f.apply(this,arguments)!==false && old.apply(this,arguments); 
      } : f); 
  }

  var history = [];
  var index = 0;

  var keyHandler = chat.os.replaceSafe( 'command-history-key-handler', function(e) { 
    e=e||window.event; var code=e.keyCode||e.which; 
    if ( code == 38 ) {  // up
      if ( index > 0 )
        el('message').value = history[--index];
      return false;
    } else if ( code == 40 ) { // down
      if ( index < history.length )
        el('message').value = history[++index]||'';
      return false;
    }
    return true;
  } );
  if ( keyHandler ) 
    wrap( el('message'), 'onkeydown', keyHandler );

  chat.os.addOutputHandler( function commandHistoryOutputHandler( ctx, next ) {
    try {
      if ( ctx.text ) history.push( ctx.text );
      index = history.length;
    } finally { next(); }
  }, 0 );

})();
```