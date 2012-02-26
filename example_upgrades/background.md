# background

## Command
```
:upgrade {"type":"upgrade","name":"background","markup":"","style":"","script":"(function() {\n  console.log(\"background v1.0\");  \n  chat.os.addInputHandler( backgroundInputHandler, 5);\n\n  function backgroundInputHandler( message, next ) {\n    if ( message.type !== 'background' ) return next();\n    document.body.style.background = message.text;\n  }\n\n  chat.os.send( '', {type:'replay', oftype:'background', limit:1} );\n})();"}
```

## Markup
```html

```

## Style
```css

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