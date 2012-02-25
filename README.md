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

