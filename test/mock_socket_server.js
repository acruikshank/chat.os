var events = require('events')

function bind(o,prop) { return function() { o[prop].apply(o, Array.prototype.slice.call(arguments,0) )}; }

module.exports.MockServer = function() { 
	var sockets = [];
	var emitter = new events.EventEmitter();

	return {
		connect : function() {
			var socket = MockSocket();
			sockets.push( socket );
			emitter.emit('connection', socket);
			return socket;
		},
		on : bind(emitter,'on'),
		emit : bind(emitter,'emit')		
	}
}

function MockSocket() {
	var emitter = new events.EventEmitter(),
			out = {},
			sent = out.sent = [];

	// mixin events
	for ( var p in emitter ) out[p] = bind(emitter,p);

	// add 'send' to capture all messages sent to client
  out.send = function(data) { sent.push(JSON.parse(data)); }
  out.message = function(data) { this.emit('message', JSON.stringify(data)); }

	return out;
}