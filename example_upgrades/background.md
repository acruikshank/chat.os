# background

This upgrade creates the background command
```
:background style
```
where _style_ is the value of a css background property to be applied to the document's body elment. For example:
```
:background #fe3
:background url('http://my_pics.example.com/something_dark_and_textured.png');
```

The background upgrade loads the last background command when it is install so the background should always stay
synchronized.

## Command
```
:upgrade {"type":"upgrade","name":"background","markup":"","style":"","script":"(function() {\n  console.log(\"background v1.0\");  \n  chat.os.addInputHandler( backgroundInputHandler, 5);\n\n  function backgroundInputHandler( message, next ) {\n    if ( message.type !== 'background' ) return next();\n    document.body.style.background = message.text;\n  }\n\n  chat.os.send( '', {type:'replay', oftype:'background', limit:1} );\n})();"}
```

## Script
```javascript
(function() {
  console.log("background v1.0");  
  chat.os.addInputHandler( backgroundInputHandler, 5);

  function backgroundInputHandler( message, next ) {
    if ( message.type !== 'background' ) return next();
    document.body.style.background = message.text;
  }

  chat.os.send( '', {type:'replay', oftype:'background', limit:1} );
})();
```