# right-chat

Right-chat is a more interesting way to read and create comments. Once installed it handles all
comments coming into the room. It also replays the last 100 messages so the buffer is full when
someone enters the room.  This upgrade depends on the chat.os.gravatar function from the 
_gravatar_ plugin to display icons.
## Command
```
:upgrade {"type":"upgrade","name":"right-chat","markup":"<div id=\"right-chat\">\n  <div id=\"right-chat-comments\"></div>\n  <label>Enter comments here</label>\n  <textarea id=\"right-chat-input\"></textarea>\n</div>\n","style":"#message {\n  width: 50%;\n}\n\n#responses {\n  font-size: 8px;\n  color: rgba(255,255,255,.3);\n}\n\n#right-chat {\n  position: absolute;\n  width: 33%;\n  height: 100%;\n  right: 10px;\n  top: 0;\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-orient: vertical;\n  -moz-box-orient: vertical;\n  overflow: hidden;\n}\n\n#right-chat-input {\n  display: -webkit-box;\n  display: -moz-box;\n  height: 146px;\n  position: relative;\n  margin: 0 0 10px 50px;\n  border: 1px solid rgba(127,127,127,.2);\n  background: rgba(255,255,255,.5);\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  font-family: Helvetica, Arial, san-serif;\n  font-size: 14px;\n  line-height: 20px;\n  color: #000;\n  z-index: 1;\n  padding: 10px;\n  -webkit-transition-property: background, border;\n  -moz-transition-property: opacity;\n  -webkit-transition-duration: .25s;\n  -moz-transition-duration: .25s;\n}\n\n#right-chat-input:hover, #right-chat-input:focus {\n  background: #fff;\n  border: 1px solid rgba(127,127,127,.5);\n}\n\n#right-chat > label {\n  display: block;\n  position: absolute;\n  z-index: 0;\n  bottom: 69px;\n  padding-left: 50px;\n  text-align: center;\n  width: 100%;\n  color: rgba(0, 0, 0, 0.6);\n  font-family: Helvetica,Arial,sans-serif;\n  text-shadow: 1px 1px 1px rgba(255,255, 255, 0.3);\n  font-size: 18px;\n}\n\n#right-chat-comments {\n  /*\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-orient: vertical;\n  -moz-box-orient: vertical;\n  -webkit-box-pack: end;\n  -moz-box-pack: end;\n  */\n  overflow-x: hidden;\n  overflow-y: auto;\n  -webkit-box-flex: 1;\n  -moz-box-flex: 1;\n}\n\n#right-chat .comment {\n  margin-top: 10px;\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-orient: horizontal;\n  -moz-box-orient: horizontal;\n}\n\n#right-chat .icon {\n  width: 40px;\n  height: 40px;\n  margin-right: 10px;\n  background: rgba(102,102,102,.6);\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-border-radius: 8px;\n  -moz-border-radius: 8px;\n  border: 1px solid rgba(255,255,255,.9);\n  padding: 0;\n  overflow: hidden;\n}\n\n#right-chat .icon .img {\n  width: 40px;\n  height: 40px;\n}\n\n#right-chat .comment p {\n  margin: 0;\n  display: -webkit-box;\n  display: -moz-box;\n  -webkit-box-flex: 1;\n  -moz-box-flex: 1;\n  padding: 10px;\n  border: 1px solid rgba(127,127,127,.5);\n  background: rgba(255,255,255,.8);\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  font-family: Helvetica, Arial, san-serif;\n  font-size: 14px;\n  line-height: 20px;\n  color: #000;\n}","script":"(function() {\n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n\n  // text area sends message\n  select('#right-chat-input').onkeydown = function(e) { \n    e=e||window.event; var code=e.keyCode||e.which; \n    if ( code == 13 ) {\n      chat.os.send( select('#right-chat-input').value );\n      select('#right-chat-input').value = '';\n      return false;\n    }\n    return true;\n  }\n\n  chat.os.addInputHandler(renderComment, 9);\n\n  function renderComment( message, next ) {\n    var commentContainer = select('#right-chat-comments');\n    if ( message.type !== 'comment' ) return next();\n    var icon = gen('span','icon');\n    if ( chat.os.gravatar && message.from.email )\n      icon.add( gen('img','img',{src:chat.os.gravatar(message.from.email)}) );\n    var comment = gen('div',{'class':'comment'})\n        .add( icon ).add( gen('p', 'body').text(message.body) ).el();\n    var atBottom = ( commentContainer.scrollHeight - commentContainer.offsetHeight - commentContainer.scrollTop < 30 );\n    commentContainer.appendChild( comment );\n    if ( atBottom ) \n      commentContainer.scrollTop = commentContainer.scrollHeight - commentContainer.offsetHeight;\n  }\n\n  chat.os.send( '', { type:'replay', oftype:'comment', limit:200 } );\n})()"}
```

## Markup
```html
<div id="right-chat">
  <div id="right-chat-comments"></div>
  <label>Enter comments here</label>
  <textarea id="right-chat-input"></textarea>
</div>

```

## Style
```css
#message {
  width: 50%;
}

#responses {
  font-size: 8px;
  color: rgba(255,255,255,.3);
}

#right-chat {
  position: absolute;
  width: 33%;
  height: 100%;
  right: 10px;
  top: 0;
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  overflow: hidden;
}

#right-chat-input {
  display: -webkit-box;
  display: -moz-box;
  height: 146px;
  position: relative;
  margin: 0 0 10px 50px;
  border: 1px solid rgba(127,127,127,.2);
  background: rgba(255,255,255,.5);
  -webkit-border-radius: 4px;
  -moz-border-radius: 4px;
  font-family: Helvetica, Arial, san-serif;
  font-size: 14px;
  line-height: 20px;
  color: #000;
  z-index: 1;
  padding: 10px;
  -webkit-transition-property: background, border;
  -moz-transition-property: opacity;
  -webkit-transition-duration: .25s;
  -moz-transition-duration: .25s;
}

#right-chat-input:hover, #right-chat-input:focus {
  background: #fff;
  border: 1px solid rgba(127,127,127,.5);
}

#right-chat > label {
  display: block;
  position: absolute;
  z-index: 0;
  bottom: 69px;
  padding-left: 50px;
  text-align: center;
  width: 100%;
  color: rgba(0, 0, 0, 0.6);
  font-family: Helvetica,Arial,sans-serif;
  text-shadow: 1px 1px 1px rgba(255,255, 255, 0.3);
  font-size: 18px;
}

#right-chat-comments {
  /*
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  -webkit-box-pack: end;
  -moz-box-pack: end;
  */
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-box-flex: 1;
  -moz-box-flex: 1;
}

#right-chat .comment {
  margin-top: 10px;
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-orient: horizontal;
  -moz-box-orient: horizontal;
}

#right-chat .icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  background: rgba(102,102,102,.6);
  display: -webkit-box;
  display: -moz-box;
  -webkit-border-radius: 8px;
  -moz-border-radius: 8px;
  border: 1px solid rgba(255,255,255,.9);
  padding: 0;
  overflow: hidden;
}

#right-chat .icon .img {
  width: 40px;
  height: 40px;
}

#right-chat .comment p {
  margin: 0;
  display: -webkit-box;
  display: -moz-box;
  -webkit-box-flex: 1;
  -moz-box-flex: 1;
  padding: 10px;
  border: 1px solid rgba(127,127,127,.5);
  background: rgba(255,255,255,.8);
  -webkit-border-radius: 4px;
  -moz-border-radius: 4px;
  font-family: Helvetica, Arial, san-serif;
  font-size: 14px;
  line-height: 20px;
  color: #000;
}
```

## Script
```javascript
(function() {
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

  // text area sends message
   select('#right-chat-input').onkeydown = function(e) { 
    e=e||window.event; var code=e.keyCode||e.which; 
    if ( code == 13 ) {
      chat.os.send( select('#right-chat-input').value );
      select('#right-chat-input').value = '';
      return false;
    }
    return true;
  }

  chat.os.addInputHandler(renderComment, 9);

   function renderComment( message, next ) {
    var commentContainer = select('#right-chat-comments');
    if ( message.type !== 'comment' ) return next();
    var icon = gen('span','icon');
    if ( chat.os.gravatar && message.from.email )
         icon.add( gen('img','img',{src:chat.os.gravatar(message.from.email)}) );
    var comment = gen('div',{'class':'comment'})
        .add( icon ).add( gen('p', 'body').text(message.body) ).el();
    var atBottom = ( commentContainer.scrollHeight - commentContainer.offsetHeight - commentContainer.scrollTop < 30 );
    commentContainer.appendChild( comment );
    if ( atBottom ) 
         commentContainer.scrollTop = commentContainer.scrollHeight - commentContainer.offsetHeight;
  }

  chat.os.send( '', { type:'replay', oftype:'comment', limit:200 } );
})()
```