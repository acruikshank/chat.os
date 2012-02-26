# panes

## Command
```
:upgrade {"type":"upgrade","name":"panes","markup":"<div id=\"panes\">\n  <div id=\"panes-spacer\"></div>\n  <div id=\"panes-content\"></div>\n  <div id=\"panes-menu\"></div>\n</div>","style":"#message {\n position: relative;\n z-index: 1;\n}\n\n#panes {\n  position: absolute;\n  left: 50px;\n  top: 0;\n  width: 61%;\n  height: 100%;\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-orient: vertical;\n  -moz-box-orient: vertical;\n  z-index: 0;\n  overflow: hidden;\n}\n\n#panes-spacer {\n  height: 46px;\n  width: 0%;\n}\n\n#panes-menu {\n  height: 24px;\n  width: 100%;\n  padding-top: 10px;\n  text-align: center;\n}\n\n#panes-menu .panes-toggle {\n  display: inline-block;\n  width: 8px;\n  height: 8px;\n  border-radius: 5px;\n  background: rgba(255,255,255,.3);\n  border: 1px solid #fff;\n  margin: 0 5px;\n  -webkit-transition-property: -webkit-box-shadow;\n  -webkit-transition-duration: .25s;\n  -moz-transition-property: -moz-box-shadow;\n  -moz-transition-duration: .25s;\n}\n\n#panes-menu .panes-toggle.selected {\n  background: white;\n}\n\n#panes-menu .panes-toggle:hover {\n  -moz-box-shadow: 0 0 6px #fff;\n  -webkit-box-shadow: 0 0 6px #fff;\n  cursor: pointer;\n}\n\n#panes-content {\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-orient: horizontal;\n  -moz-box-orient: horizontal;\n  -webkit-box-flex: 1;\n  -moz-box-flex: 1;\n  position: relative;\n  -webkit-transition-property: left;\n  -webkit-transition-duration: .4s;\n  -webkit-transition-timing-function: ease-in-out;\n  -moz-transition-property: left;\n  -moz-transition-duration: .4s;\n  -moz-transition-timing-function: ease-in-out;\n}\n\n#panes .pane {\n  background: -moz-linear-gradient(-49deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.32) 50%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, .15) 100%);\n  background: -webkit-linear-gradient(-49deg, rgba(255, 255, 255, 0.3) 0%,rgba(255, 255, 255, 0.15) 50%,rgba(255, 255, 255, 0) 50%,rgba(255, 255, 255, .15) 100%);\n  width: 100%;\n  border-top: 1px solid rgba(255, 255, 255, .9);\n  position: relative;\n  margin-right: 20px;\n  -webkit-transition-property: opacity;\n  -webkit-transition-duration: .4s;\n  -moz-transition-property: opacity;\n  -moz-transition-duration: .4s;\n}\n\n#panes .pane-header {\n  padding: 5px 10px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.2);\n  position: relative;\n  font-size: 14px;\n  color: rgba(255,255,255,.8);\n}\n\n#panes .pane-header .close {\n  background: rgba(0, 0, 0, .3);\n  color: rgba(255,255,255,.7);\n  border: none;\n  font-size: 13px;\n  height: 22px;\n  width: 22px;\n  line-height: 22px;\n  border-image: initial;\n  padding: 0;\n  border-radius: 11px;\n  position: absolute;\n  top: 1px;\n  right: 0px;\n  font-weight: bold;\n  -webkit-transition-property: background, color;\n  -webkit-transition-duration: .25s;\n  -moz-transition-property: background, color;\n  -moz-transition-duration: .25s;\n}\n\n\n#panes .pane-header .close:hover {\n  background: rgba(0, 0, 0, 1);\n  color: rgba(255,255,255,1);\n  cursor: pointer;\n}","script":"(function() {\n  var panes = {};\n\n  function el(id) { return document.getElementById(id); }\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n\n  /*\n   'open', el - dom element in which content may be placed. Id of element may be used to close pane.\n   'close', undefined - close has been requested externally (container will be destroyed)\n   */\n  chat.os.pane = function pane( id, title, eventResponder /* ( id, eventType, data ) */ ) {\n    var pane, paneTitle, close, body;\n    if ( ! panes[id] ) {\n      pane = gen('div','pane',{id:'panes-' + id})\n        .add( gen('div','pane-header')\n          .add( gen('span',{id:'pane-title-'+id}).text(title) )\n          .add( close = gen('button','close').text('\\u24E7') ) )\n        .add( body = gen('div','pane-body',{id:'pane-body-'+id} ).el() )\n\n      close.el().onclick = function() { chat.os.send( '', { type:'close-pane', paneId:id } ); }\n\n      el('panes-content').appendChild(pane.el());\n\n      el('panes-menu').appendChild( gen('div', 'panes-toggle', { id: 'pane-toggle-'+id } ).el() );\n    } else {\n      panes[id]( id, 'close' );\n      body = el('pane-body-'+id);\n      body.innerHTML = '';\n      paneTitle = el('pane-title-'+id);\n      paneTitle.innerHTML = '';\n      paneTitle.appendChild( document.createTextNode(title) );\n    }\n    panes[id] = eventResponder;\n    select( id );\n    eventResponder( id, 'open', body );\n  }\n\n  chat.os.closePane = function closePane( id ) {\n    if ( ! panes[id] ) return;\n    panes[id]( id, 'close' );\n    var next, found = false; \n    for ( var pane in panes ) {\n      if ( pane == id ) found = true;\n      else next = pane;\n      if ( found && next ) break;\n    }\n    var pane = el('panes-'+id), paneToggle = el('pane-toggle-'+id);\n    paneToggle.parentNode.removeChild(paneToggle);\n    pane.style.opacity = 0;\n    delete panes[id];\n    select( next );\n    setTimeout( function() { pane.parentNode.removeChild(pane); select(next); }, 500 );\n  }\n\n  function select( selectedId ) {\n    for (var id in panes) {\n      if ( id == selectedId )\n        el('panes-content').style.left = (-el('panes-'+id).offsetLeft) + 'px';\n      el('pane-toggle-'+id).setAttribute( 'class', id==selectedId ? 'panes-toggle selected' : 'panes-toggle');\n    }\n  }\n\n  var inputHandlers = { \n    'select-pane' : function selectPaneIH(message) { select( message.paneId ); }, \n    'close-pane': function closePaneIH(message) { chat.os.closePane( message.paneId ); } \n  }\n\n  function selectOrClosePane( message, next ) {\n    if ( ! (message.type in inputHandlers) ) return next();\n    inputHandlers[message.type]( message );\n  }\n\n  chat.os.addInputHandler(selectOrClosePane, 1);\n\n  el('panes-menu').onclick = function paneToggleClick( e ) {\n    e = e || window.event;\n    var m = e.target.id.match(/^pane-toggle-(.+)$/);\n    if ( m ) return chat.os.send( '', { type:'select-pane', paneId:m[1] } );\n  }\n})()"}
```

## Markup
```html
<div id="panes">
  <div id="panes-spacer"></div>
  <div id="panes-content"></div>
  <div id="panes-menu"></div>
</div>
```

## Style
```css
#message {
 position: relative;
 z-index: 1;
}

#panes {
  position: absolute;
  left: 50px;
  top: 0;
  width: 61%;
  height: 100%;
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  z-index: 0;
  overflow: hidden;
}

#panes-spacer {
  height: 46px;
  width: 0%;
}

#panes-menu {
  height: 24px;
  width: 100%;
  padding-top: 10px;
  text-align: center;
}

#panes-menu .panes-toggle {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 5px;
  background: rgba(255,255,255,.3);
  border: 1px solid #fff;
  margin: 0 5px;
  -webkit-transition-property: -webkit-box-shadow;
  -webkit-transition-duration: .25s;
  -moz-transition-property: -moz-box-shadow;
  -moz-transition-duration: .25s;
}

#panes-menu .panes-toggle.selected {
  background: white;
}

#panes-menu .panes-toggle:hover {
  -moz-box-shadow: 0 0 6px #fff;
  -webkit-box-shadow: 0 0 6px #fff;
  cursor: pointer;
}

#panes-content {
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-orient: horizontal;
  -moz-box-orient: horizontal;
  -webkit-box-flex: 1;
  -moz-box-flex: 1;
  position: relative;
  -webkit-transition-property: left;
  -webkit-transition-duration: .4s;
  -webkit-transition-timing-function: ease-in-out;
  -moz-transition-property: left;
  -moz-transition-duration: .4s;
  -moz-transition-timing-function: ease-in-out;
}

#panes .pane {
  background: -moz-linear-gradient(-49deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.32) 50%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, .15) 100%);
  background: -webkit-linear-gradient(-49deg, rgba(255, 255, 255, 0.3) 0%,rgba(255, 255, 255, 0.15) 50%,rgba(255, 255, 255, 0) 50%,rgba(255, 255, 255, .15) 100%);
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, .9);
  position: relative;
  margin-right: 20px;
  -webkit-transition-property: opacity;
  -webkit-transition-duration: .4s;
  -moz-transition-property: opacity;
  -moz-transition-duration: .4s;
}

#panes .pane-header {
  padding: 5px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  font-size: 14px;
  color: rgba(255,255,255,.8);
}

#panes .pane-header .close {
  background: rgba(0, 0, 0, .3);
  color: rgba(255,255,255,.7);
  border: none;
  font-size: 13px;
  height: 22px;
  width: 22px;
  line-height: 22px;
  border-image: initial;
  padding: 0;
  border-radius: 11px;
  position: absolute;
  top: 1px;
  right: 0px;
  font-weight: bold;
  -webkit-transition-property: background, color;
  -webkit-transition-duration: .25s;
  -moz-transition-property: background, color;
  -moz-transition-duration: .25s;
}


#panes .pane-header .close:hover {
  background: rgba(0, 0, 0, 1);
  color: rgba(255,255,255,1);
  cursor: pointer;
}
```

## Script
```javascript
(function() {
  var panes = {};

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

  /*
   'open', el - dom element in which content may be placed. Id of element may be used to close pane.
   'close', undefined - close has been requested externally (container will be destroyed)
   */
  chat.os.pane = function pane( id, title, eventResponder /* ( id, eventType, data ) */ ) {
    var pane, paneTitle, close, body;
    if ( ! panes[id] ) {
      pane = gen('div','pane',{id:'panes-' + id})
        .add( gen('div','pane-header')
          .add( gen('span',{id:'pane-title-'+id}).text(title) )
          .add( close = gen('button','close').text('\u24E7') ) )
        .add( body = gen('div','pane-body',{id:'pane-body-'+id} ).el() )

      close.el().onclick = function() { chat.os.send( '', { type:'close-pane', paneId:id } ); }

      el('panes-content').appendChild(pane.el());

      el('panes-menu').appendChild( gen('div', 'panes-toggle', { id: 'pane-toggle-'+id } ).el() );
    } else {
      panes[id]( id, 'close' );
      body = el('pane-body-'+id);
      body.innerHTML = '';
      paneTitle = el('pane-title-'+id);
      paneTitle.innerHTML = '';
      paneTitle.appendChild( document.createTextNode(title) );
    }
    panes[id] = eventResponder;
    select( id );
    eventResponder( id, 'open', body );
  }

  chat.os.closePane = function closePane( id ) {
    if ( ! panes[id] ) return;
    panes[id]( id, 'close' );
    var next, found = false; 
    for ( var pane in panes ) {
      if ( pane == id ) found = true;
      else next = pane;
      if ( found && next ) break;
    }
    var pane = el('panes-'+id), paneToggle = el('pane-toggle-'+id);
    paneToggle.parentNode.removeChild(paneToggle);
    pane.style.opacity = 0;
    delete panes[id];
    select( next );
    setTimeout( function() { pane.parentNode.removeChild(pane); select(next); }, 500 );
  }

  function select( selectedId ) {
    for (var id in panes) {
      if ( id == selectedId )
        el('panes-content').style.left = (-el('panes-'+id).offsetLeft) + 'px';
      el('pane-toggle-'+id).setAttribute( 'class', id==selectedId ? 'panes-toggle selected' : 'panes-toggle');
    }
  }

  var inputHandlers = { 
    'select-pane' : function selectPaneIH(message) { select( message.paneId ); }, 
    'close-pane': function closePaneIH(message) { chat.os.closePane( message.paneId ); } 
  }

  function selectOrClosePane( message, next ) {
    if ( ! (message.type in inputHandlers) ) return next();
    inputHandlers[message.type]( message );
  }

  chat.os.addInputHandler(selectOrClosePane, 1);

  el('panes-menu').onclick = function paneToggleClick( e ) {
    e = e || window.event;
    var m = e.target.id.match(/^pane-toggle-(.+)$/);
    if ( m ) return chat.os.send( '', { type:'select-pane', paneId:m[1] } );
  }
})()
```