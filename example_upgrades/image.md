# image

Implements the _image_ command.
<pre>
:image url
</pre>
This upgrade requires the _panes_ upgrade. When a user enters the image command,
all participants will open a new pane that contains the image.

## Command
```
:upgrade {"type":"upgrade","name":"image","markup":"","style":".image-pane-body img {\n  display: block;\n  width: 80%;\n  margin: 10px auto;\n}","script":"(function() {\n  function hash(str) { \n    for (var i=0,h=0,l=str.length; i<l; i++) h = (((h<<5)-h)+str.charCodeAt(i))|0; \n    return Math.abs(h); \n  }\n\n  chat.os.addInputHandler( renderImage, 5 );\n  \n  function renderImage( message, next ) {\n    if ( message.type != 'image' ) return next();\n    return chat.os.pane( 'image-'+hash(message.text), message.text, render );\n    \n    function render( id, type, div ) {\n      if ( type != 'open' ) return;\n      console.log( arguments );\n      var img = document.createElement('img');\n      img.setAttribute('src', message.text);\n      div.setAttribute('class','image-pane-body');\n      div.appendChild( img );\n    }\n  }\n})();"}
```

## Style
```css
.image-pane-body img {
  display: block;
  width: 80%;
  margin: 10px auto;
}
```

## Script
```javascript
(function() {
  function hash(str) { 
    for (var i=0,h=0,l=str.length; i<l; i++) h = (((h<<5)-h)+str.charCodeAt(i))|0; 
    return Math.abs(h); 
  }

  chat.os.addInputHandler( renderImage, 5 );
  
  function renderImage( message, next ) {
    if ( message.type != 'image' ) return next();
    return chat.os.pane( 'image-'+hash(message.text), message.text, render );
    
    function render( id, type, div ) {
      if ( type != 'open' ) return;
      console.log( arguments );
      var img = document.createElement('img');
      img.setAttribute('src', message.text);
      div.setAttribute('class','image-pane-body');
      div.appendChild( img );
    }
  }
})();
```