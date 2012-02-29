# presentation
Introduces the `:present {}` command that creates a presentation when
supplied with an object in the following format:
```javascript
{
  "slides": [
    {
      "title" : "slide 1 title",
      "points" : ["point1", "point2", "..."]
    },
    {
      "title" : "slide 2 title",
      "points" : ["point1", "point2", "..."]
    }
  ]
}
   

This upgrade requires the _panes_ upgrade.


## Command
```
:upgrade {"type":"upgrade","name":"presentation","markup":"","style":"ul.slide {\n  list-style: none;\n  background: rgba(0, 0, 0, .5);\n  height: 75%;\n  margin: 20px;\n  border-radius: 20px;\n  padding: 20px 40px;\n}\n\nul.slide caption {\n  text-align: center;\n  width: 100%;\n  display: block;\n  font-family: Hoefler Text, Georgia, serif;\n  font-size: 30px;\n  margin-bottom: 50px;\n}\n\nul.slide li {\n  font-size: 22px;\n  margin: 0 0 26px;\n  font-family: Hoefler Text, georgia;\n  font-style: inherit;\n  margin: 0 0 26px;\n  padding: 0;\n  -webkit-transition: opacity .75 linear;\n}\n\nul.slide li.hidden {\n  opacity: 0;\n}\n\n.pane-body input.key-trap {\n  display: block;\n  position: absolute;\n  top: 0px;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  padding: 0;\n  maring: 0;\n  border: none;\n  opacity: 0;\n  cursor: default;\n}","script":"(function() {\n  var slides = [];\n  var currentSlide = 0;\n\n  chat.os.addInputHandler( handleCommands, 5 );\n  \n  function handleCommands( message, next ) {\n    if ( ! message.type ) return next()\n    if ( message.type == 'present' ) return createPresentation(message);\n    if ( message.type == 'next-presentation-point' ) return nextPoint(message);\n    return next();\n  }\n\n  function createPresentation( message ) {\n    for ( var i=0,slide; slide=slides[i]; i++ ) chat.os.closePane(slide.id);\n    slides = [];\n    for ( var i=0, slide; slide = message.slides[i]; i++ ) {\n      var id = 'presentation-slide-' + slides.length;\n      chat.os.pane( id, slide.title, slideGenerator(slide, message.slides.length) );\n    }\n  }\n\n  function slideGenerator( slide, count ) {\n    return function( id, type, element ) {\n      if ( type == 'open' ) {\n        var list = gen('ul','slide', {id:id})\n          .add( gen('caption').text(slide.title) );\n        for ( var i=0,point; point = slide.points[i]; i++ )\n          list.add( gen('li','point-'+i+' hidden').text(point) )\n        element.appendChild( list.el() );\n        var input = gen('input','key-trap');\n        element.appendChild(input.el());\n        input.el().onkeydown = genKeyHandler(id);\n        input.el().onclick = function() { return true; }\n        slides.push( {id:id, points:slide.points, index:-1} );\n        if ( slides.length == count ) setTimeout( function() {\n            currentSlide = 0;\n            chat.os.send('', {type:'select-pane', paneId:slides[0]} );\n          }, 30 );\n      }\n    }\n  }\n\n  function genKeyHandler(id) {\n    return function keyHandler(e) { \n      e=e||window.event; var code=e.keyCode||e.which;\n    \n      // left 37, right 39\n      if ( code == 37 && currentSlide > 0 ) // left\n        return chat.os.send('', {type:'select-pane', paneId:slides[--currentSlide].id});\n      if ( code == 39 && currentSlide < slides.length - 1  ) // right\n        return chat.os.send('', {type:'select-pane', paneId:slides[++currentSlide].id});\n      if ( code == 40 ) // down\n        return chat.os.send('', {type:'next-presentation-point', id:id, direction:1} ), false;\n      if ( code == 38 ) // up\n        return chat.os.send('', {type:'next-presentation-point', id:id, direction:-1} ), false;\n      return true;\n    }\n  }\n\n  function nextPoint( message ) {\n    var active = slides[currentSlide], el, elClass;\n    var next = active.index + message.direction;\n    if ( next < -1 || next >= active.points.length ) return;\n    if ( message.direction < 0 ) {\n      el = select('#'+slides[currentSlide].id+' .point-'+active.index);\n      elClass = el.getAttribute('class');\n      el.setAttribute( 'class', elClass + ' hidden' );\n    } else {\n      el = select('#'+slides[currentSlide].id+' .point-'+next);\n      elClass = el.getAttribute('class');\n      elClass = elClass.replace(/ hidden/g,'');\n      el.setAttribute( 'class', elClass );\n    }\n    active.index = next;\n  }\n  \n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n})()"}
```

## Style
```css
ul.slide {
  list-style: none;
  background: rgba(0, 0, 0, .5);
  height: 75%;
  margin: 20px;
  border-radius: 20px;
  padding: 20px 40px;
}

ul.slide caption {
  text-align: center;
  width: 100%;
  display: block;
  font-family: Hoefler Text, Georgia, serif;
  font-size: 30px;
  margin-bottom: 50px;
}

ul.slide li {
  font-size: 22px;
  margin: 0 0 26px;
  font-family: Hoefler Text, georgia;
  font-style: inherit;
  margin: 0 0 26px;
  padding: 0;
  -webkit-transition: opacity .75 linear;
}

ul.slide li.hidden {
  opacity: 0;
}

.pane-body input.key-trap {
  display: block;
  position: absolute;
  top: 0px;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  maring: 0;
  border: none;
  opacity: 0;
  cursor: default;
}
```

## Script
```javascript
(function() {
  var slides = [];
  var currentSlide = 0;

  chat.os.addInputHandler( handleCommands, 5 );
  
  function handleCommands( message, next ) {
    if ( ! message.type ) return next()
    if ( message.type == 'present' ) return createPresentation(message);
    if ( message.type == 'next-presentation-point' ) return nextPoint(message);
    return next();
  }

  function createPresentation( message ) {
    for ( var i=0,slide; slide=slides[i]; i++ ) chat.os.closePane(slide.id);
    slides = [];
    for ( var i=0, slide; slide = message.slides[i]; i++ ) {
      var id = 'presentation-slide-' + slides.length;
      chat.os.pane( id, slide.title, slideGenerator(slide, message.slides.length) );
    }
  }

  function slideGenerator( slide, count ) {
    return function( id, type, element ) {
      if ( type == 'open' ) {
        var list = gen('ul','slide', {id:id})
          .add( gen('caption').text(slide.title) );
        for ( var i=0,point; point = slide.points[i]; i++ )
          list.add( gen('li','point-'+i+' hidden').text(point) )
        element.appendChild( list.el() );
        var input = gen('input','key-trap');
        element.appendChild(input.el());
        input.el().onkeydown = genKeyHandler(id);
        input.el().onclick = function() { return true; }
        slides.push( {id:id, points:slide.points, index:-1} );
        if ( slides.length == count ) setTimeout( function() {
            currentSlide = 0;
            chat.os.send('', {type:'select-pane', paneId:slides[0]} );
          }, 30 );
      }
    }
  }

  function genKeyHandler(id) {
    return function keyHandler(e) { 
      e=e||window.event; var code=e.keyCode||e.which;
    
      // left 37, right 39
      if ( code == 37 && currentSlide > 0 ) // left
        return chat.os.send('', {type:'select-pane', paneId:slides[--currentSlide].id});
      if ( code == 39 && currentSlide < slides.length - 1  ) // right
        return chat.os.send('', {type:'select-pane', paneId:slides[++currentSlide].id});
      if ( code == 40 ) // down
        return chat.os.send('', {type:'next-presentation-point', id:id, direction:1} ), false;
      if ( code == 38 ) // up
        return chat.os.send('', {type:'next-presentation-point', id:id, direction:-1} ), false;
      return true;
    }
  }

  function nextPoint( message ) {
    var active = slides[currentSlide], el, elClass;
    var next = active.index + message.direction;
    if ( next < -1 || next >= active.points.length ) return;
    if ( message.direction < 0 ) {
      el = select('#'+slides[currentSlide].id+' .point-'+active.index);
      elClass = el.getAttribute('class');
      el.setAttribute( 'class', elClass + ' hidden' );
    } else {
      el = select('#'+slides[currentSlide].id+' .point-'+next);
      elClass = el.getAttribute('class');
      elClass = elClass.replace(/ hidden/g,'');
      el.setAttribute( 'class', elClass );
    }
    active.index = next;
  }
  
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
})()
```