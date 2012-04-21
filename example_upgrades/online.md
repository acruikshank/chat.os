# online

This upgrade displays the number of people currently online in the top right corner.
Clicking on the number opens a display showing all the active participants.

## Command
```
:upgrade {"type":"upgrade","name":"online","markup":"<div id=\"online-status\">\n  <span class=\"count\"></span>\n  <span class=\"header\"></span>\n  <div class=\"participants\"></div>\n</div>\n","style":"#online-status {\n  position: absolute;\n  right: -10px;\n  top: -10px;\n  text-align: center;\n  font-size: 23px;\n  background: rgba(0, 0, 0, .45);\n  border: 3px solid white;\n  width: 48px;\n  height: 48px;\n  line-height: 48px;\n  border-radius: 48px;\n  z-index: 1;\n  -webkit-transition-property: height, width, border-radius;\n  -moz-transition-property: height, width, border-radius;\n  -webkit-transition-duration: .5s;\n  -moz-transition-duration: .5s;\n  overflow: hidden;\n}\n\n#online-status:hover {\n  background: rgba(0, 0, 0, .6);\n  box-shadow: 0 0 20px #fff;\n  font-weight: bold;\n  cursor: pointer;\n}\n\n#online-status.open {\n  border-radius: 20px;\n  background: rgba(0, 0, 0, .8);\n}\n\n#online-status .header {\n  display: none;\n}\n\n#online-status.open .count, #online-status.open .header {\n  display: inline-block;\n  font-family: georgia, times, serif;\n  font-size: 20px;\n  font-style: italic;\n  font-weight: normal;\n  margin-bottom: 20px;\n}\n\n#online-status.open .count {\n  font-size: 26px;\n}\n\n#online-status .participants {\n  overflow: hidden;\n  overflow-y: auto;\n  height: 90%;\n}\n\n#online-status .participants .icon {\n  display: inline-block;\n  margin: 0 10px 20px;\n  overflow: hidden;\n  font-family: georgia, times, serif;\n  font-size: 12px;\n  font-style: italic;\n  font-weight: normal;\n  text-align: center;\n  width: 140px;\n}\n#online-status .participants .icon span {\n  display: block;\n}\n\n#online-status .participants .icon .img {\n  width: 50px;\n  height: 50px;\n  border: 1px solid rgba(255,255,255,.9);\n}\n","script":"(function() {\n  var online = {};\n  var iconId = 0;\n\n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n\n  function onlineInputHandler( message, next ) {\n    var count = 0, expectedCount;\n\n    if ( ! (message.type in {joined:1,disconnected:1,rollcall:1}) ) return next();\n\n    if ( message.type == 'joined' ) {\n      addParticipant( message.from );\n      expectedCount = message.participants;\n    }\n\n    if ( message.type == 'disconnected' ) {\n      removeParticipant( message.from );\n      expectedCount = message.participants;\n    }\n\n    if ( message.type == 'rollcall' ) {\n      select('#online-status .participants').innerHTML = '';\n      online = {};\n      for ( var i=0, participant; participant = message.participants[i]; i++ ) {\n        addParticipant( participant );\n      }\n    }\n\n    for (var email in online) count += online[email].count;\n    select('#online-status .count').innerHTML = count;\n    select('#online-status .header').innerHTML = (count == 1 ? 'person' : 'people') + ' online';\n\n    // sanity check\n    if ( message.type != 'rollcall'  && expectedCount != count )\n      chat.os.send('', {type:'rollcall'}); \n  }\n\n  function addParticipant( identity ) {\n    if ( online[identity.email] ) {\n      identity.count++;\n    } else {\n      online[identity.email] = identity;\n      identity.count = 1;\n      identity.iconId = iconId++;\n\n      var participants = select('#online-status .participants');\n      var icon = gen('div','icon',{id:'online-icon-'+identity.iconId});\n      if ( chat.os.gravatar )\n        icon.add( gen('img','img',{src:chat.os.gravatar(identity.email)}) );\n      icon.add( gen('span').text(identity.email) );\n      participants.appendChild( icon.el() );\n    }\n  }\n\n  function removeParticipant( identity ) {\n    if ( identity = online[identity.email] ) {\n      identity.count--;\n      if ( identity.count < 1 ) {\n        var icon = select('#online-icon-'+identity.iconId);\n        if ( icon )\n          icon.parentNode.removeChild( icon );\n        delete online[identity.email];\n      }\n    }\n  }\n\n  function showParticipants() {\n    var status = select('#online-status');\n    if ( status.getAttribute('class') === 'open' ) {\n      status.setAttribute('class',  '' );\n      status.style.height = status.style.width = '';\n    } else {\n      status.style.height = (document.body.offsetHeight - 40) + 'px';\n      status.style.width = (document.body.offsetWidth - 40) + 'px';\n      status.setAttribute('class', 'open' );\n    }\n  }\n\n  select('#online-status').onclick = showParticipants;\n\n  chat.os.addInputHandler( onlineInputHandler, 5 );\n  chat.os.send('', {type:'rollcall'});\n})()"}
```

## Markup
```html
<div id="online-status">
  <span class="count"></span>
  <span class="header"></span>
  <div class="participants"></div>
</div>

```

## Style
```css
#online-status {
  position: absolute;
  right: -10px;
  top: -10px;
  text-align: center;
  font-size: 23px;
  background: rgba(0, 0, 0, .45);
  border: 3px solid white;
  width: 48px;
  height: 48px;
  line-height: 48px;
  border-radius: 48px;
  z-index: 1;
  -webkit-transition-property: height, width, border-radius;
  -moz-transition-property: height, width, border-radius;
  -webkit-transition-duration: .5s;
  -moz-transition-duration: .5s;
  overflow: hidden;
}

#online-status:hover {
  background: rgba(0, 0, 0, .6);
  box-shadow: 0 0 20px #fff;
  font-weight: bold;
  cursor: pointer;
}

#online-status.open {
  border-radius: 20px;
  background: rgba(0, 0, 0, .8);
}

#online-status .header {
  display: none;
}

#online-status.open .count, #online-status.open .header {
  display: inline-block;
  font-family: georgia, times, serif;
  font-size: 20px;
  font-style: italic;
  font-weight: normal;
  margin-bottom: 20px;
}

#online-status.open .count {
  font-size: 26px;
}

#online-status .participants {
  overflow: hidden;
  overflow-y: auto;
  height: 90%;
}

#online-status .participants .icon {
  display: inline-block;
  margin: 0 10px 20px;
  overflow: hidden;
  font-family: georgia, times, serif;
  font-size: 12px;
  font-style: italic;
  font-weight: normal;
  text-align: center;
  width: 140px;
}
#online-status .participants .icon span {
  display: block;
}

#online-status .participants .icon .img {
  width: 50px;
  height: 50px;
  border: 1px solid rgba(255,255,255,.9);
}

```

## Script
```javascript
(function() {
  var online = {};
  var iconId = 0;

  function select(selector,ctx) {
    var m = selector.match(/^([\.#]?)(\S+)(\s+(.*))?$/), 
        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),
        els=(ctx||document)[meth](m[2]), el=(m[1]=='#'?els:els[0]);
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

  function onlineInputHandler( message, next ) {
    var count = 0, expectedCount;

    if ( ! (message.type in {joined:1,disconnected:1,rollcall:1}) ) return next();

    if ( message.type == 'joined' ) {
      addParticipant( message.from );
      expectedCount = message.participants;
    }

    if ( message.type == 'disconnected' ) {
      removeParticipant( message.from );
      expectedCount = message.participants;
    }

    if ( message.type == 'rollcall' ) {
      select('#online-status .participants').innerHTML = '';
      online = {};
      for ( var i=0, participant; participant = message.participants[i]; i++ ) {
        addParticipant( participant );
      }
    }

    for (var email in online) count += online[email].count;
    select('#online-status .count').innerHTML = count;
    select('#online-status .header').innerHTML = (count == 1 ? 'person' : 'people') + ' online';

    // sanity check
    if ( message.type != 'rollcall'  && expectedCount != count )
      chat.os.send('', {type:'rollcall'}); 
  }

  function addParticipant( identity ) {
    if ( online[identity.email] ) {
      identity.count++;
    } else {
      online[identity.email] = identity;
      identity.count = 1;
      identity.iconId = iconId++;

      var participants = select('#online-status .participants');
      var icon = gen('div','icon',{id:'online-icon-'+identity.iconId});
      if ( chat.os.gravatar )
        icon.add( gen('img','img',{src:chat.os.gravatar(identity.email)}) );
      icon.add( gen('span').text(identity.email) );
      participants.appendChild( icon.el() );
    }
  }

  function removeParticipant( identity ) {
    if ( identity = online[identity.email] ) {
      identity.count--;
      if ( identity.count < 1 ) {
        var icon = select('#online-icon-'+identity.iconId);
        if ( icon )
          icon.parentNode.removeChild( icon );
        delete online[identity.email];
      }
    }
  }

  function showParticipants() {
    var status = select('#online-status');
    if ( status.getAttribute('class') === 'open' ) {
      status.setAttribute('class',  '' );
      status.style.height = status.style.width = '';
    } else {
      status.style.height = (document.body.offsetHeight - 40) + 'px';
      status.style.width = (document.body.offsetWidth - 40) + 'px';
      status.setAttribute('class', 'open' );
    }
  }

  select('#online-status').onclick = showParticipants;

  chat.os.addInputHandler( onlineInputHandler, 5 );
  chat.os.send('', {type:'rollcall'});
})()
```