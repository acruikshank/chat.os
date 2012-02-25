# chat.os

An experiment in collaborative user experiences.

The chat.os server provides a small set of functionality to enable real-time communication and
the ability to alter the environment via persisted client-side code. It should be capable of
producing rich collaborative spaces, but the capabilities of any of these spaces will be
determined by the level of effort invested by the participants.

## Installation and Startup

Chat.os requires Node.js, npm, and MongoDB be installed. Currently MongoDB must run on its
default port. After installing the chat.os project:

<pre>
cd chat.os
npm install
node server.js
</pre>

## Running Tests

Chat.os uses mocha.js to test server side functionality. To run the tests:

<pre>
mocha spec/*
</pre>

## Using

Due to a questionable choice websocket packages, chat.os only works with browsers that conform to 
the most recent draft of the WebSocket spec (I think this is Chrome and FireFox and not Safari).
Future work might switch this to socket.io to open it to other browsers.

To begin, go to http://[host]:8500/ and enter your email and nickname. On the next page, choose
an existing room or create a new one. Once it a room, you will be chatting with everyone else
currently in that room. If the room is new, there will only be a single text field at the top of
page where you can enter comments and commands.

### Syntax

Typing anything into the input will create a comment that will be broadcast to others on the page.
You may enter commands by prepending the first word by a colon like:
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
script is the JavaScript to inject. All three of these should be string escaped.  When the upgrade
is added to the page the application will to its best to replace and existing upgrade with the same
name. 

If the top level elements in the markup have an id, any existing elements matching that id will be
removed before the new elements are added (so refreshing the upgrade won't append redundant markup).
It's good practice to prepend the name of the upgrade to every id in the markup.

Any CSS for a previous upgrade with the same name will be replaced by the new upgrade. Thats true for
the JS as well, but special care needs to be taken to avoid global effects that can't be undone.

Upgrades are tied to a room. All uploads for a room will be added whenever anyone enters a room.
Saveing an upgrade will replace an existing upgrade with the same name and broadcast the new 
version (there is currently no versioning).

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
:replay { type:[type], since:[time], limit:[count] }
</pre>
All of the search criteria are optional. 

Replay messages are useful to initialize upgrades after startup. For example, a poll upgrade may
replay all vote messages to display the curren tally after startup.

### Request

The request message runs an http request from the server and stores and broadcasts the request name
as a new message.
<pre>
:request {name:[name], url:[url], [request options], responseType:[type], responseName:[name], schedule:[schedule]}
</pre>
_request options_ are all the options from Node.js request object including method, headers, etc. If a URL is
specified, it will overwrite these parameter. responseType is the type of the response message and responseName is
the name it will be saved under if you would like to avoid saving a new response everytime the request is made.
The _schedule_ is a 6 option cron specification for when the request should be made. There's a bit more to it, but
that's all I'm going to document for now.