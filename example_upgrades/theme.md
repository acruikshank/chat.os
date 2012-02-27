# theme

Introduces the
<pre>
:theme class
</pre>
command that sets the class of the body object to _class_. Other upgrades may use
the body class to alter the appearance of its UI to reflect some global
event. This upgrade also specifies styles for the default UI (logo and
message) when using a 'bright' theme to be used when the background is
set to a light color.


## Command
```
:upgrade {"type":"upgrade","name":"theme","markup":"","style":".bright #logo {\n  color: black;\n}\n\n.bright #message {\n  background: rgba(0,0,0,.1);\n  color: black;\n}","script":"(function() {\n  function changeTheme( message, next ) {\n    if ( message.type != 'theme' ) return next();\n    document.body.setAttribute( 'class', message.text );\n  }\n\n  chat.os.addInputHandler( changeTheme, 5 );\n  chat.os.send( '', {type:'replay', oftype:'theme', limit:1} );\n})();"}
```

## Style
```css
.bright #logo {
  color: black;
}

.bright #message {
  background: rgba(0,0,0,.1);
  color: black;
}
```

## Script
```javascript
(function() {
  function changeTheme( message, next ) {
    if ( message.type != 'theme' ) return next();
    document.body.setAttribute( 'class', message.text );
  }

  chat.os.addInputHandler( changeTheme, 5 );
  chat.os.send( '', {type:'replay', oftype:'theme', limit:1} );
})();
```