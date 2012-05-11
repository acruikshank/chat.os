# chat.os

An experiment in collaborative user experiences.

The chat.os server provides a small set of functionality to enable real-time communication and
the ability to alter the environment via persisted client-side code. It should be capable of
producing rich collaborative spaces, but the capabilities of any of these spaces will be
determined by the level of effort invested by the participants.

## Installation

Chat.os requires Node.js, npm, and MongoDB be installed. Currently MongoDB must run on its
default port. After installing the chat.os project:

<pre>
cd chat.os
npm install
</pre>

## Configuration

Chat.os relies on Google accounts for authentication (more options coming soon). To create an
instance of the server, you must create a google project using the
[project console](https://code.google.com/apis/console/b/0/). Next copy the config_example.js file
in the root of the project to config.js and edit it. Choose a randomish string for the session secret
and set the authentication parameters provided from the google project console. Once the configuration
is in place, you're ready to run the server:

<pre>
node server.js
</pre>

## Running Tests

Chat.os uses mocha.js to test server side functionality. To run the tests:

<pre>
mocha
</pre>

## Using

To begin, go to the home page on the server (i.e. http://localhost:8500/), click the link to
log in through google accounts, and follow the instructions from there. Once you've been
authenticated and authorized the application, you will land on the rooms page where you can create
an existing room or create a new one. Once in a room, you will be chatting with everyone else
currently in that room. If the room is new, there will only be a single text field at the top of
page where you can enter comments and commands.

### Syntax

Typing anything into the input will create a comment that will be broadcast to others in the room.
You may enter commands by prepending the first word with a colon like:
<pre>
:move into the red room
</pre>
In this case, the command _type_ will be 'move' and it's body will be 'into the red room'. To
send structured data, enter a JSON object literal after the type. For example:
<pre>
:flash {delay:500, repeat:20, text:'boo'}
</pre>

There are a few typed commands that will be important for upgrading a room, and room upgrades will
provide addional commands to communicate and alter the space.

## Special Commands

### Upgrade

The upgrade command is probably the most important command.  It allows you to inject HTML, CSS, and
script into the room. It's syntax is:
<pre>
:upgrade { name:[name], markup:[html], style:[css], script:[js] }
</pre>
Where name is the name of the upgrade, markup is the HTML to inject, style is the CSS to inject, and 
script is the Javascript to inject. All three of these should be string escaped.  When the upgrade
is added to the page the application will do its best to replace and existing upgrade with the same
name. 

If the top level elements in the markup have an id, any existing elements matching that id will be
removed before the new elements are added (so refreshing the upgrade won't append redundant markup).
It's good practice to prepend the name of the upgrade to every id in the markup.

Any CSS for a previous upgrade with the same name will be replaced by the new upgrade. Thats true for
the JS as well, but special care needs to be taken to avoid global effects that can't be undone.

Upgrades are tied to a room. All upgrades to a room will be added whenever anyone enters the room.
Saving an upgrade will replace an existing upgrade with the same name and then broadcast the new 
version (there is currently no concept of versioning).

### Import

The import command pulls an upgrade from another room into the current room.
<pre>
:import [room]::[upgrade]
</pre>
Where _room_ is the name of the room and _upgrade_ is the name of the upgrade. The incoming upgrade
will have the same name and will overwrite an upgrade with the same name in the current room.

### Remove

Remove an upgrade.
<pre>
:remove [upgrade]
</pre>
Where _upgrade_ is the name of the upgrade. Removed upgrades cannot be retrieved. Removing an
upgrade forces a page refresh for everyone in the room.

### Reset

Force a page refresh for all room participants
<pre>
:reset
</pre>

### Replay

The replay command searches the current room for messages previously sent to the room and resends
them only to the current user (i.e. the messages are not broadcast).
<pre>
:replay { oftype:[type], since:[time], limit:[count] }
</pre>
All of the search criteria are optional. Type may be a single string or an array of types.

Replay messages are useful to initialize upgrades after startup. For example, a poll upgrade may
replay all vote messages to display the current tally after startup.

### Rollcall

The rollcall command requests a list of all the room participants with active connections. A
rollcall response will be sent that contains the identities of all people in the room.
<pre>
:rollcall {}
</pre>
responds with:
<pre>
{type:'rollcall', participants:[...]}
</pre>

### Request

The request message runs an http request from the server and stores and broadcasts the request name
as a new message.
<pre>
:request {name:[name], url:[url], [request options], responseType:[type], 
          responseName:[name], schedule:[schedule]}
</pre>
_request options_ are all the options from Node.js request object including method, headers, etc. 
If a URL is specified, it will overwrite these parameters. responseType is the type of the
response message and responseName is the name it will be saved under if you would like to avoid
saving a new response everytime the request is made. The _schedule_ is a 6 option cron specification
for when the request should be made. There's a bit more to it, but that's all I'm going to document
for now.

## Writing Upgrades

The chat.os server provides very little functionality out-of-the-box. The goal is to build up rich
interfaces by incrementally adding upgrades that deliver the missing functionality. Several
upgrades have been documented in [/example_upgrades](/acruikshank/chat.os/tree/master/example_upgrades)
for reference.

There a few functions in the chat.os namespace make upgrade programming possible, and a few more
are available to keep the environment sane when upgrades are reloaded.

### send

```javascript
chat.os.send( text, message )
```

This method lets an upgrade send a message to the server as if it were submitted from the message
input. If _text_ is specified, the text will be added as the 'text' field of the context and the
body of a comment if no message is provided. The contents of message may be explicitly specified
by passing an object as the message parameter.

All messags will be saved to the room by default. If you would like to broadcast a message to the
room that should not be saved (say, information about what a user is doing right now or individual
game events), add `persist:false` to the message.

### addInputHandler

```javascript
chat.os.addInputHandler( handler, priority )

function handler( message, next ) {
  if ( message.type != 'my-type' )
    return next();

  // do something with message and possibly call next()
}
```

An input handler receives a message coming from the server to the client and either modifies it
or handles it. All messages are passed through each input handler, and the handler decides if
it should act or not. Message processing will go through each input handler sequentially, and
continue only if the handler calls the provided `next` function. If the message is the wrong type
for the hander, it should call the `next` function and exit immediately. If the handler modifies or
reads a message it expects to be handled elsewhere, it should always call the `next` function.
Otherwise is should act on the message an return without calling `next` to prevent another handler
(including the default handler) from acting on the message.

The _priority_ parameter is optional and provides some order to the input chain even though
multiple handlers may act on a message without being aware of each other. The higher the number
the later the handler will be called, so you should specify a low number (say < 5) for handlers
that act on the message but don't handle it, and a high number (say 5 > n >= 10) for handlers
that handle the message (i.e. that do not call `next`). The default priority is 5.

### addOutputHandler

```javascript
chat.os.addOutputHandler( handler, priority )

function handler( context, next ) {
  if ( ! context.message || ! context.message.type != 'my-type' )
    return next();

  // do something with message and possibly call next()
}
```
Output handlers process messages before they leave the client for the server. They may be
used to alter the message, or they may be used to implement new commands that only affect
the current instance of the room. Like input handlers, output handlers must call `next`
if the message is the wrong type or the handler wants the message to continue on to the server.
The _priority_ parameter also works as it does for input handlers.

The context object contains a 'text' and a 'message' property that correspond to the
parameters supplied to the `send` function. At startup, an outputHandler will be added
at priority 1 that will convert text parameters in the form `:[type] [text]` or `:[type] [JSON]`
into a new message object. In the first case the message will be `{type:[type], text:[text]}`
and in the second case, the message will simply be the JSON object with its type set to `[type]`.

### replaceSafe

```javascript
var safeHandler = chat.os.replaceSafe( name, f )
if ( saveHandler )
  element.bind( 'event', safeHandler );
```

The replaceSafe function can be used to create event handlers that can be attached to the
global DOM (the DOM outside that owned by the upgrade) and yet be easily replaced when the
upgrade is reloaded. This is necessary because most strategies for permitting multiple 
upgrades to listen to the same event do not make it easy to unload the event handler without 
having access to the instance of the function.

To use this function, pass in a name that uniquely identifies this handler (the name should
be prepended with the upgrade name) and the handler. If replaceSafe has not seen the name
before, it will return a wrapper function that behaves just like f. The upgrade should use
this function as the eventHandler. If the replaceSafe function has already
been called with this name it will return null. This indicates the function has been called
before and the wrapper function is still listening for the event. The wrapper will now use
the new function to process the event. If replaceSafe returns null, the upgrade should 
continue without binding anything to the event.

### timing methods

```javascript
chat.os.setInterval( upgrade, name, f, ms )
chat.os.setTimeout( upgrade, name, f, ms )
chat.os.requestAnimationFrame( upgrade, name, f )
```

These methods work just like their native counterparts. The only advantage to calling these
is that the chat.os bootstrap code will be sure to clear all timing functions associated
with an upgrade before the upgrade is replaced. The _upgrade_ parameter must be the name
of the upgrade, and the _name_ parameter distinguishes functions within an upgrade.

### properties 

```javascript
chat.os.identity = {};
chat.os.room = 'name';
chat.os.upgrades = {};
```

The current user's identity (an object containing nickname, email, etc.), the name of the room, and a
object containing all upgrades keyed by name are made availble for all upgrades to use.

