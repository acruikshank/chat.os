# github

Run a request to check github commits on a public repository every 3 minutes.
This upgrade requires the _events_ upgrade or something that provides a chat.os.event(date,type,text) function to
display the results. It introduces the follow command:
<pre>
:github-follow [user]/[repo]
</pre>
where _user_ is a github user account, and _repo_ is a public
repository. Calling github-follow more than once will cause this upgrade
to stop following the previous repo.


## Command
```
:upgrade {"type":"upgrade","name":"github","markup":"","style":"#events .github .icon {\n  background: #fff url(http://dl.dropbox.com/u/49528799/Octocat.png) 50% 50%;\n  background-size: 30px 30px;\n}","script":"(function() {\n  var githubRequest;\n  var lastCommitTime;\n\n  chat.os.addInputHandler(githubHandler, 9);\n  chat.os.addOutputHandler(githubFollowHandler);\n  chat.os.send( '', { type:'replay', oftype:'github-response', limit:1 } );\n  chat.os.send( '', { type:'replay', oftype:'github-request', limit:1 } );\n\n  function githubHandler( message, next ) {\n    if ( message.type == 'github-request' ) return githubRequest = message;\n    if ( message.type !== 'github-response' ) return next();\n\n    if ( message.error )\n      return console.error( message.error )\n\n    var response = JSON.parse(message.body), time;\n    for ( var i=response.length-1, result; result = response[i]; i-- ) {\n      time = new Date(result.commit.committer.date);\n      if ( ! lastCommitTime || time.getTime() > lastCommitTime.getTime() ) {\n        chat.os.event( time, 'github', '@'+result.committer.login+': '+result.commit.message.substring(0,140) );\n        lastCommitTime = time;\n      }\n    }\n  }\n\n  function githubFollowHandler( ctx, next ) {\n    if ( ! ctx.message || ctx.message.type != 'github-follow' ) return next();\n\n    if ( githubRequest && githubRequest.following == ctx.message.text ) return;\n\n    githubRequest = githubRequest || { type:'github-request', name:'github-request', following:ctx.message.text }\n    chat.os.send( '', { \n        type:'request', \n        name:'github-request', \n        url: 'https://api.github.com/repos/'+ctx.message.text+'/commits?per_page=100',\n        responseType: 'github-response',\n        responseName: 'github-response',\n        schedule:'23 */3 * * * *' } );\n    chat.os.send( '', githubRequest );\n  }\n})()"}
```

## Style
```css
#events .github .icon {
  background: #fff url(http://dl.dropbox.com/u/49528799/Octocat.png) 50% 50%;
  background-size: 30px 30px;
}
```

## Script
```javascript
(function() {
  var githubRequest;
  var lastCommitTime;

  chat.os.addInputHandler(githubHandler, 9);
  chat.os.addOutputHandler(githubFollowHandler);
  chat.os.send( '', { type:'replay', oftype:'github-response', limit:1 } );
  chat.os.send( '', { type:'replay', oftype:'github-request', limit:1 } );

  function githubHandler( message, next ) {
    if ( message.type == 'github-request' ) return githubRequest = message;
    if ( message.type !== 'github-response' ) return next();

    if ( message.error )
      return console.error( message.error )

    var response = JSON.parse(message.body), time;
    for ( var i=response.length-1, result; result = response[i]; i-- ) {
      time = new Date(result.commit.committer.date);
      if ( ! lastCommitTime || time.getTime() > lastCommitTime.getTime() ) {
        chat.os.event( time, 'github', '@'+result.committer.login+': '+result.commit.message.substring(0,140) );
        lastCommitTime = time;
      }
    }
  }

  function githubFollowHandler( ctx, next ) {
    if ( ! ctx.message || ctx.message.type != 'github-follow' ) return next();

    if ( githubRequest && githubRequest.following == ctx.message.text ) return;

    githubRequest = githubRequest || { type:'github-request', name:'github-request', following:ctx.message.text }
    chat.os.send( '', { 
        type:'request', 
        name:'github-request', 
        url: 'https://api.github.com/repos/'+ctx.message.text+'/commits?per_page=100',
        responseType: 'github-response',
        responseName: 'github-response',
        schedule:'23 */3 * * * *' } );
    chat.os.send( '', githubRequest );
  }
})()
```