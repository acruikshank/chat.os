
## Command
```
:upgrade {"type":"upgrade","name":"browse-upgrades","markup":"<div id='browse-upgrades'>\n  <div class='header'><label>browse upgrades:</label></div>\n  <div class='sections'>\n    <ul class='upgrades'></ul>\n  </div>\n  <div class='actions'>\n    <button class='close'>close</button>\n  </div>\n</div>\n","style":"#logo {\n  position: relative;\n  cursor: pointer;\n  z-index: 1000;\n}\n\n#browse-upgrades {\n  z-index: 1000;\n  position: absolute;\n  left: 0;\n  color: #000;\n  opacity: 0;\n  top: 0;\n  bottom: 0;\n  right: 0;\n  left: 0;\n  padding: 0 40px;\n  font-family: Hoefler Text, Georgia, serif;\n  text-rendering: optimizeLegibility;\n  background-image: -webkit-linear-gradient(top,rgba(240,240,240,1), rgba(50,50,50,1));\n  -webkit-transition-property: opacity;\n  -webkit-transition-duration: .25s;\n}\n\n#browse-upgrades {\n  display: none;\n}\n\n#browse-upgrades .header {\n  margin: 20px 16px;\n}\n\n#browse-upgrades .header > label {\n  display: inline-block;\n  font-size: 30px;\n  text-align: right;\n}\n\n#browse-upgrades .sections {\n  position: absolute;\n  top: 80px;\n  bottom: 100px;\n  right: 40px;\n  left: 40px;\n  overflow-y: auto;\n  padding: 20px;\n\n  border: 1px solid rgba(255,255,255,.8);\n  background-color: rgba(255,255,255,.6);\n  color: #09C;\n}\n\n#browse-upgrades .upgrades {\n  list-style: none;\n  padding: 0;\n}\n\n#browse-upgrades .upgrades li {\n  margin-bottom: 16px;\n}\n\n#browse-upgrades .upgrades a {\n  text-decoration: none;\n  color: #333;\n}\n\n#browse-upgrades .actions {\n  position: absolute;\n  bottom: 0;\n  height: 100px;\n  left: 0;\n  right: 0;\n  padding: 0 60px;\n}\n\n#browse-upgrades .actions button {\n  float: right;\n}\n\n#browse-upgrades .actions button,\n#browse-upgrades .upgrades a {\n  font-family: Hoefler Text, Georgia, serif;\n  font-size: 23px;\n  border: none;\n  background: none;\n  padding: 12px;\n  margin-bottom: 20px;\n  color: rgba;\n}\n\n#browse-upgrades .actions button:hover,\n#browse-upgrades .upgrades a:hover {\n  color: #000;\n  background-color: rgba(255,255,255,.6);\n  -webkit-border-radius: 2px;\n  -webkit-transition-property: background, box-shadow;\n  -webkit-transition-duration: .2s;\n  box-shadow: 2px 2px 7px rgba(0,0,0,.25);\n  cursor: pointer;\n}\n","script":"(function() {\n  console.log(\"browse upgrades: v0.1\");\n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), \n        el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n\n  chat.os.addOutputHandler( function( ctx, next ) {\n    if ( ! ctx.message || ctx.message.type != 'browse-upgrades' ) return next();\n    open();\n  });\n\n  function open() {\n    select('#browse-upgrades').style.display = 'block';\n    select('#browse-upgrades').style.opacity = 1;\n  \n    var upgrades_ul = select('#browse-upgrades .upgrades');\n    upgrades_ul.innerHTML = '';    \n\n    for (var upgrade in chat.os.upgrades) {\n      var a = gen('a', {href:\"#\", \"data-upgrade\": upgrade}).text(upgrade).el()\n      var li = gen('li').el()\n      li.appendChild(a)\n      a.addEventListener('click', function(e){\n        edit(e.target.getAttribute(\"data-upgrade\"));\n      });\n      upgrades_ul.appendChild(li);\n    }\n  }\n\n  function close() {\n    select('#browse-upgrades').style.opacity = 0;\n    setTimeout(function() { select('#browse-upgrades').style.display='none';}, 250);    \n  }\n\n  function edit(upgrade) {\n    close()\n    chat.os.send( ':edit-upgrade '+upgrade );\n  }\n\n  select('#logo').onclick = open;\n  select('#browse-upgrades .close').onclick  = close;\n})()"}
```

## Markup
```html
<div id='browse-upgrades'>
  <div class='header'><label>browse upgrades:</label></div>
  <div class='sections'>
    <ul class='upgrades'></ul>
  </div>
  <div class='actions'>
    <button class='close'>close</button>
  </div>
</div>

```

## Style
```css
#logo {
  position: relative;
  cursor: pointer;
  z-index: 1000;
}

#browse-upgrades {
  z-index: 1000;
  position: absolute;
  left: 0;
  color: #000;
  opacity: 0;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 0 40px;
  font-family: Hoefler Text, Georgia, serif;
  text-rendering: optimizeLegibility;
  background-image: -webkit-linear-gradient(top,rgba(240,240,240,1), rgba(50,50,50,1));
  -webkit-transition-property: opacity;
  -webkit-transition-duration: .25s;
}

#browse-upgrades {
  display: none;
}

#browse-upgrades .header {
  margin: 20px 16px;
}

#browse-upgrades .header > label {
  display: inline-block;
  font-size: 30px;
  text-align: right;
}

#browse-upgrades .sections {
  position: absolute;
  top: 80px;
  bottom: 100px;
  right: 40px;
  left: 40px;
  overflow-y: auto;
  padding: 20px;

  border: 1px solid rgba(255,255,255,.8);
  background-color: rgba(255,255,255,.6);
  color: #09C;
}

#browse-upgrades .upgrades {
  list-style: none;
  padding: 0;
}

#browse-upgrades .upgrades li {
  margin-bottom: 16px;
}

#browse-upgrades .upgrades a {
  text-decoration: none;
  color: #333;
}

#browse-upgrades .actions {
  position: absolute;
  bottom: 0;
  height: 100px;
  left: 0;
  right: 0;
  padding: 0 60px;
}

#browse-upgrades .actions button {
  float: right;
}

#browse-upgrades .actions button,
#browse-upgrades .upgrades a {
  font-family: Hoefler Text, Georgia, serif;
  font-size: 23px;
  border: none;
  background: none;
  padding: 12px;
  margin-bottom: 20px;
  color: rgba;
}

#browse-upgrades .actions button:hover,
#browse-upgrades .upgrades a:hover {
  color: #000;
  background-color: rgba(255,255,255,.6);
  -webkit-border-radius: 2px;
  -webkit-transition-property: background, box-shadow;
  -webkit-transition-duration: .2s;
  box-shadow: 2px 2px 7px rgba(0,0,0,.25);
  cursor: pointer;
}

```

## Script
```javascript
(function() {
  console.log("browse upgrades: v0.1");
  function select(selector,ctx) {
    var m = selector.match(/^([\.#]?)(\S+)(\s+(.*))?$/), 
        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),
        els=(ctx||document)[meth](m[2]), 
        el=(m[1]=='#'?els:els[0]);
    return m[4] ? select(m[4], el) : el;
  }

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

  chat.os.addOutputHandler( function( ctx, next ) {
    if ( ! ctx.message || ctx.message.type != 'browse-upgrades' ) return next();
    open();
  });

  function open() {
    select('#browse-upgrades').style.display = 'block';
    select('#browse-upgrades').style.opacity = 1;
  
    var upgrades_ul = select('#browse-upgrades .upgrades');
    upgrades_ul.innerHTML = '';    

    for (var upgrade in chat.os.upgrades) {
      var a = gen('a', {href:"#", "data-upgrade": upgrade}).text(upgrade).el()
      var li = gen('li').el()
      li.appendChild(a)
      a.addEventListener('click', function(e){
        edit(e.target.getAttribute("data-upgrade"));
      });
      upgrades_ul.appendChild(li);
    }
  }

  function close() {
    select('#browse-upgrades').style.opacity = 0;
    setTimeout(function() { select('#browse-upgrades').style.display='none';}, 250);    
  }

  function edit(upgrade) {
    close()
    chat.os.send( ':edit-upgrade '+upgrade );
  }

  select('#logo').onclick = open;
  select('#browse-upgrades .close').onclick  = close;
})()
```