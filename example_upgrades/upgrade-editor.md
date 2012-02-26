# upgrade-editor

The upgrade-editor upgrade introduces the edit-upgrade command:
<pre>
:edit-upgrade name
</pre>
where _name_ is the name of an upgrade to be edited or created. When called a simple
edit UI is displayed only to the current user to simplify the task of creating upgrades.

## Command
```
:upgrade {"type":"upgrade","name":"upgrade-editor","markup":"<div id='upgrade-editor'>\n  <div class='header'><label>edit upgrade:</label><input class='name'/></div      >\n  <div class='sections'>\n    <div class='markup'><label>html</label><textarea wrap='off'></textarea></div>\n    <div class='style'><label>style</label><textarea wrap='off'></textarea></div>\n    <div class='script'><label>script</label><textarea wrap='off'></textarea></div>\n  </div>\n  <div class='actions'>\n    <button class='save'>create upgrade</button>\n    <button class='cancel'>cancel</button>\n  </div>\n</div>\n","style":"#upgrade-editor {\n  z-index: 1000;\n  position: absolute;\n  left: 0;\n  color: #000;\n  opacity: 0;\n  top: 0;\n  padding: 0 2%;\n  width: 100%;\n  height: 100%;\n  font-family: Hoefler Text, Georgia, serif;\n  text-rendering: optimizeLegibility;\n  background-image: -webkit-linear-gradient(top,rgba(240,240,240,1), rgba(50,50,50,1));\n  -webkit-transition-property: opacity;\n  -webkit-transition-duration: .25s;\n}\n\n#upgrade-editor {\n  display: none;\n}\n\n#upgrade-editor .header {\n  margin: 20px 16px;\n}\n\n#upgrade-editor .header > label {\n  display: inline-block;\n  font-size: 30px;\n  text-align: right;\n}\n\n#upgrade-editor .header > input {\n  margin-left: 1%;\n  font-size: 30px;\n  border: none;\n  border-bottom: 1px dashed #999;\n  font-family: Hoefler Text, Georgia, serif;\n  text-rendering: optimizeLegibility;\n  background: none;\n  color: #09c;\n}\n\n#upgrade-editor .sections {\n  display: -webkit-box;\n  -webkit-box-orient: horizontal;\n  margin-top: 40px;\n}\n\n#upgrade-editor .sections > div {\n  width: 30%;\n  margin: 0 1%; \n  -webkit-transition-property: width;\n  -webkit-transition-duration: .25s;\n}\n\n#upgrade-editor .sections > div label {\n  display: block;\n  text-align: left;\n  margin: 5px 0;\n  font-size: 18px;\n  color: #666;\n  width: 50px;\n  -webkit-transform-origin: 0 10px;\n  -webkit-transition-property: transform;\n  -webkit-transition-duration: .25s;\n}\n\n#upgrade-editor .sections > div label:hover {\n  cursor: pointer;\n  color: #09c;\n}\n\n#upgrade-editor .sections textarea {\n  width: 100%;\n  height: 550px;\n  background-color: #000;\n  color: #09c;\n  padding: 18px 8px;\n  font-size: 12px;\n  font-family: Monaco, Courier;\n  line-height: 18px;\n}\n\n#upgrade-editor .actions {\n  display: box;\n  box-orient: horizontal;\n  text-align: right;\n  margin: 10px;\n  padding: 0 4%;\n}\n\n#upgrade-editor .actions button {\n  font-family: Hoefler Text, Georgia, serif;\n  font-size: 23px;\n  border: none;\n  background: none;\n  padding: 12px;\n  margin-bottom: 20px;\n  color: #333;\n}\n\n#upgrade-editor .actions button:hover {\n  color: #000;\n  background-image: -webkit-linear-gradient(top,#c8c8c8,#c1c1c1);\n  -webkit-border-radius: 2px;\n  -webkit-transition-property: background, box-shadow;\n  -webkit-transition-duration: .2s;\n  box-shadow: 2px 2px 7px rgba(0,0,0,.25);\n  cursor: pointer;\n}\n","script":"(function() {\n  console.log(\"upgrade editor: v2.1\");\n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), \n        el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  chat.os.addOutputHandler( function( ctx, next ) {\n    if ( ! ctx.message || ctx.message.type != 'edit-upgrade' ) return next();\n    select('#upgrade-editor').style.display = 'block';\n    select('#upgrade-editor').style.opacity = 1;\n    var name = ctx.message.text, upgrade = chat.os.upgrades[name];\n    select('#upgrade-editor .name').value = name || '';\n    select('#upgrade-editor .markup textarea').value = (upgrade && upgrade.markup) || '';\n    select('#upgrade-editor .style textarea').value = (upgrade && upgrade.style) || '';\n    select('#upgrade-editor .script textarea').value = (upgrade && upgrade.script) || '';\n  });\n\n  // section toggles\n  var sections = { markup:true, style:true, script:true };\n  select('#upgrade-editor .markup label').onclick = function() { sections.markup=!sections.markup; toggleSections(); };\n  select('#upgrade-editor .style label').onclick = function() { sections.style=!sections.style; toggleSections(); };\n  select('#upgrade-editor .script label').onclick = function() { sections.script=!sections.script; toggleSections(); };\n  function toggleSections() {\n    var open = (sections.markup?1:0) + (sections.style?1:0) + (sections.script?1:0);\n    var openWidth = open ? ((90 - (3-open)*3) / open) + '%' : '0%';\n    for ( var section in sections ) {\n      select('#upgrade-editor .'+section+' label').style.webkitTransform = (sections[section]?'rotate(0deg)':'rotate(-90deg)');\n      select('#upgrade-editor .'+section).style.width=(sections[section] ? openWidth : '3%');\n    }\n  }\n\n  // handle tabs\n  function tabHandler(e) {\n    e=e||window.event; var code=e.keyCode||e.which, ta=e.target;\n    if ( code == 9 ) { // tabs\n      var ss=ta.selectionStart, se=ta.selectionEnd;\n      e.preventDefault();\n      ta.value = ta.value.slice(0,ss)+'  '+ta.value.slice(se,ta.value.length);\n      ta.selectionEnd = ss+2;\n    }\n  }\n  select('#upgrade-editor .markup textarea').onkeydown = \n    select('#upgrade-editor .style textarea').onkeydown =\n    select('#upgrade-editor .script textarea').onkeydown = tabHandler;\n\n  function close() {\n    select('#upgrade-editor').style.opacity = 0;\n    setTimeout(function() { select('#upgrade-editor').style.display='none';}, 250);    \n  }\n\n  select('#upgrade-editor .save').onclick  = function() {\n    var upgrade = {\n      type: 'upgrade',\n      name: select('#upgrade-editor .name').value,\n      markup: select('#upgrade-editor .markup textarea').value,\n      style: select('#upgrade-editor .style textarea').value,\n      script: select('#upgrade-editor .script textarea').value\n    }\n    chat.os.send( '', upgrade );\n    close();\n  }\n\n  select('#upgrade-editor .cancel').onclick  = close;\n})()"}
```

## Markup
```html
<div id='upgrade-editor'>
  <div class='header'><label>edit upgrade:</label><input class='name'/></div      >
  <div class='sections'>
    <div class='markup'><label>html</label><textarea wrap='off'></textarea></div>
    <div class='style'><label>style</label><textarea wrap='off'></textarea></div>
    <div class='script'><label>script</label><textarea wrap='off'></textarea></div>
  </div>
  <div class='actions'>
    <button class='save'>create upgrade</button>
    <button class='cancel'>cancel</button>
  </div>
</div>

```

## Style
```css
#upgrade-editor {
  z-index: 1000;
  position: absolute;
  left: 0;
  color: #000;
  opacity: 0;
  top: 0;
  padding: 0 2%;
  width: 100%;
  height: 100%;
  font-family: Hoefler Text, Georgia, serif;
  text-rendering: optimizeLegibility;
  background-image: -webkit-linear-gradient(top,rgba(240,240,240,1), rgba(50,50,50,1));
  -webkit-transition-property: opacity;
  -webkit-transition-duration: .25s;
}

#upgrade-editor {
  display: none;
}

#upgrade-editor .header {
  margin: 20px 16px;
}

#upgrade-editor .header > label {
  display: inline-block;
  font-size: 30px;
  text-align: right;
}

#upgrade-editor .header > input {
  margin-left: 1%;
  font-size: 30px;
  border: none;
  border-bottom: 1px dashed #999;
  font-family: Hoefler Text, Georgia, serif;
  text-rendering: optimizeLegibility;
  background: none;
  color: #09c;
}

#upgrade-editor .sections {
  display: -webkit-box;
  -webkit-box-orient: horizontal;
  margin-top: 40px;
}

#upgrade-editor .sections > div {
  width: 30%;
  margin: 0 1%; 
  -webkit-transition-property: width;
  -webkit-transition-duration: .25s;
}

#upgrade-editor .sections > div label {
  display: block;
  text-align: left;
  margin: 5px 0;
  font-size: 18px;
  color: #666;
  width: 50px;
  -webkit-transform-origin: 0 10px;
  -webkit-transition-property: transform;
  -webkit-transition-duration: .25s;
}

#upgrade-editor .sections > div label:hover {
  cursor: pointer;
  color: #09c;
}

#upgrade-editor .sections textarea {
  width: 100%;
  height: 550px;
  background-color: #000;
  color: #09c;
  padding: 18px 8px;
  font-size: 12px;
  font-family: Monaco, Courier;
  line-height: 18px;
}

#upgrade-editor .actions {
  display: box;
  box-orient: horizontal;
  text-align: right;
  margin: 10px;
  padding: 0 4%;
}

#upgrade-editor .actions button {
  font-family: Hoefler Text, Georgia, serif;
  font-size: 23px;
  border: none;
  background: none;
  padding: 12px;
  margin-bottom: 20px;
  color: #333;
}

#upgrade-editor .actions button:hover {
  color: #000;
  background-image: -webkit-linear-gradient(top,#c8c8c8,#c1c1c1);
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
  console.log("upgrade editor: v2.1");
  function select(selector,ctx) {
    var m = selector.match(/^([\.#]?)(\S+)(\s+(.*))?$/), 
        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),
        els=(ctx||document)[meth](m[2]), 
        el=(m[1]=='#'?els:els[0]);
    return m[4] ? select(m[4], el) : el;
  }

  chat.os.addOutputHandler( function( ctx, next ) {
    if ( ! ctx.message || ctx.message.type != 'edit-upgrade' ) return next();
    select('#upgrade-editor').style.display = 'block';
    select('#upgrade-editor').style.opacity = 1;
    var name = ctx.message.text, upgrade = chat.os.upgrades[name];
    select('#upgrade-editor .name').value = name || '';
    select('#upgrade-editor .markup textarea').value = (upgrade && upgrade.markup) || '';
    select('#upgrade-editor .style textarea').value = (upgrade && upgrade.style) || '';
    select('#upgrade-editor .script textarea').value = (upgrade && upgrade.script) || '';
  });

   // section toggles
   var sections = { markup:true, style:true, script:true };
   select('#upgrade-editor .markup label').onclick = function() { sections.markup=!sections.markup; toggleSections(); };
   select('#upgrade-editor .style label').onclick = function() { sections.style=!sections.style; toggleSections(); };
   select('#upgrade-editor .script label').onclick = function() { sections.script=!sections.script; toggleSections(); };
   function toggleSections() {
     var open = (sections.markup?1:0) + (sections.style?1:0) + (sections.script?1:0);
     var openWidth = open ? ((90 - (3-open)*3) / open) + '%' : '0%';
     for ( var section in sections ) {
         select('#upgrade-editor .'+section+' label').style.webkitTransform = (sections[section]?'rotate(0deg)':'rotate(-90deg)');
        select('#upgrade-editor .'+section).style.width=(sections[section] ? openWidth : '3%');
      }
   }

   // handle tabs
   function tabHandler(e) {
      e=e||window.event; var code=e.keyCode||e.which, ta=e.target;
      if ( code == 9 ) { // tabs
         var ss=ta.selectionStart, se=ta.selectionEnd;
         e.preventDefault();
         ta.value = ta.value.slice(0,ss)+'   '+ta.value.slice(se,ta.value.length);
         ta.selectionEnd = ss+2;
      }
   }
   select('#upgrade-editor .markup textarea').onkeydown =  
      select('#upgrade-editor .style textarea').onkeydown =
       select('#upgrade-editor .script textarea').onkeydown = tabHandler;

   function close() {
    select('#upgrade-editor').style.opacity = 0;
    setTimeout(function() { select('#upgrade-editor').style.display='none';}, 250);    
  }

  select('#upgrade-editor .save').onclick  = function() {
    var upgrade = {
      type: 'upgrade',
      name: select('#upgrade-editor .name').value,
      markup: select('#upgrade-editor .markup textarea').value,
      style: select('#upgrade-editor .style textarea').value,
      script: select('#upgrade-editor .script textarea').value
    }
    chat.os.send( '', upgrade );
    close();
  }

  select('#upgrade-editor .cancel').onclick  = close;
})()
```