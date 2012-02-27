# twitter

Run a request to check twitter every 5 minutes for updates tweets and mentions for some number of twitter handlers.
This upgrade requires the _events_ upgrade or something that provides a chat.os.event(date,type,text) function to
display the results. It introduces the following command:
<pre>
:follow handle
:unfollow handle
</pre>
where _handle_ is someone's twitter handle (minus the '@'). Executing the follow command will add the handle to the
list of handles already being followed, and unfollow will remove it.

## Command
```
:upgrade {"type":"upgrade","name":"twitter","markup":"","style":"#events .twitter .icon {\n  background: #666 url(http://a2.twimg.com/a/1329497727/images/logos/twitter_newbird_boxed_blueonwhite.png) 50% 50%;\n  background-size: 30px 30px;\n}","script":"(function() {\n  function select(selector,ctx) {\n    var m = selector.match(/^([\\.#]?)(\\S+)(\\s+(.*))?$/), \n        meth='getElement' + ({'.':'sByClassName','#':'ById'}[m[1]] || 'sByTagName'),\n        els=(ctx||document)[meth](m[2]), el=(m[1]=='#'?els:els[0]);\n    return m[4] ? select(m[4], el) : el;\n  }\n\n  function gen( name, clss, atts ) {\n    var el = document.createElement(name), out={};\n    if ( typeof clss == 'object' ) atts=clss, clss=null;\n    for (var att in atts) el.setAttribute(att,atts[att]);\n    if ( clss ) el.setAttribute('class', clss);\n    out.add = function(node) { return el.appendChild( node.el ? node.el() : node ), out; };\n    out.text = function(txt) { return el.appendChild( document.createTextNode(txt) ), out };\n    out.el = function() { return el; };\n    return out;\n  }\n\n  var twitterRequest;\n  var latestTwitterId;\n\n  chat.os.addInputHandler(twitterHandler, 9);\n  chat.os.addOutputHandler(followHandler);\n  chat.os.send( '', { type:'replay', oftype:'twitter-request', limit:1 } );\n  chat.os.send( '', { type:'replay', oftype:'twitter-response', limit:1 } );\n\n  function twitterHandler( message, next ) {\n    if ( message.type == 'twitter-request' ) return twitterRequest = message;\n    if ( message.type !== 'twitter-response' ) return next();\n\n    if ( message.error )\n      return console.error( message.error )\n\n    var response = JSON.parse(message.body);\n    for ( var i=response.results.length-1, result; result = response.results[i]; i-- ) {\n      if ( ! latestTwitterId || result.id > latestTwitterId ) {\n        chat.os.event( new Date(result.created_at), 'twitter', '@'+result.from_user+': '+result.text );\n      }\n    }\n    latestTwitterId = response.max_id;\n  }\n\n  function followHandler( ctx, next ) {\n    if ( ! ctx.message ) return next();\n    if ( ctx.message.type == 'follow' ) return follow( ctx, next );\n    if ( ctx.message.type == 'unfollow' ) return unfollow( ctx, next );    \n    return next();\n  }\n\n  function follow( ctx, next ) {   \n    if ( twitterRequest && ~twitterRequest.following.indexOf(ctx.message.text) ) return;\n\n    twitterRequest = twitterRequest || { type:'twitter-request', name:'twitter-request', following:[] }\n    twitterRequest.following.push(ctx.message.text);\n    sendRequest();\n  }\n\n  function unfollow( ctx, next ) {\n    if ( ! twitterRequest || !~twitterRequest.following.indexOf(ctx.message.text) ) return;\n    twitterRequest.following = twitterRequest.following.filter(function(h) { return h != ctx.message.text });\n    sendRequest();\n  }\n\n  function sendRequest() {\n    var query = encodeURIComponent(twitterRequest.following.map(function(f) {return '@'+f+' OR from:'+f;}).join(' OR '));\n\n    chat.os.send( '', { \n        type:'request', \n        name:'twitter-request', \n        url: 'http://search.twitter.com/search.json?q='+query+'&rpp=100',\n        responseType: 'twitter-response',\n        responseName: 'twitter-response',\n        schedule:'23 */3 * * * *' } );\n    chat.os.send( '', twitterRequest );\n  }\n})()"}
```

## Style
```css
#events .twitter .icon {
  background: #666 url(http://a2.twimg.com/a/1329497727/images/logos/twitter_newbird_boxed_blueonwhite.png) 50% 50%;
  background-size: 30px 30px;
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

  var twitterRequest;
  var latestTwitterId;

  chat.os.addInputHandler(twitterHandler, 9);
  chat.os.addOutputHandler(followHandler);
  chat.os.send( '', { type:'replay', oftype:'twitter-request', limit:1 } );
  chat.os.send( '', { type:'replay', oftype:'twitter-response', limit:1 } );

  function twitterHandler( message, next ) {
    if ( message.type == 'twitter-request' ) return twitterRequest = message;
    if ( message.type !== 'twitter-response' ) return next();

    if ( message.error )
      return console.error( message.error )

    var response = JSON.parse(message.body);
    for ( var i=response.results.length-1, result; result = response.results[i]; i-- ) {
      if ( ! latestTwitterId || result.id > latestTwitterId ) {
        chat.os.event( new Date(result.created_at), 'twitter', '@'+result.from_user+': '+result.text );
      }
    }
    latestTwitterId = response.max_id;
  }

  function followHandler( ctx, next ) {
    if ( ! ctx.message ) return next();
    if ( ctx.message.type == 'follow' ) return follow( ctx, next );
    if ( ctx.message.type == 'unfollow' ) return unfollow( ctx, next );    
    return next();
  }

  function follow( ctx, next ) {   
    if ( twitterRequest && ~twitterRequest.following.indexOf(ctx.message.text) ) return;

    twitterRequest = twitterRequest || { type:'twitter-request', name:'twitter-request', following:[] }
    twitterRequest.following.push(ctx.message.text);
    sendRequest();
  }

  function unfollow( ctx, next ) {
    if ( ! twitterRequest || !~twitterRequest.following.indexOf(ctx.message.text) ) return;
    twitterRequest.following = twitterRequest.following.filter(function(h) { return h != ctx.message.text });
    sendRequest();
  }

  function sendRequest() {
    var query = encodeURIComponent(twitterRequest.following.map(function(f) {return '@'+f+' OR from:'+f;}).join(' OR '));

    chat.os.send( '', { 
        type:'request', 
        name:'twitter-request', 
        url: 'http://search.twitter.com/search.json?q='+query+'&rpp=100',
        responseType: 'twitter-response',
        responseName: 'twitter-response',
        schedule:'23 */3 * * * *' } );
    chat.os.send( '', twitterRequest );
  }
})()
```