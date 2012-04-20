var events = require('events');
var messages = require("./messages")
var rooms = require("./rooms")
var requests = require("./requests")
var scheduler = require("./scheduler")
var connectionNumber = 0;

var emitter = module.exports.events = new events.EventEmitter();

module.exports.manage = function( socketServer ) {
  var connections = {};
  var chatrooms = {};

  var messageHandlers = { 
    'import'  : importUpgrade, 
    remove    : removeUpgrade, 
    replay    : replay,
    request   : request
  }

  // listen for scheduled events
  scheduler.on('scheduled message', handleScheduled);

  socketServer.on('connection', function(ws) {
    var connection = Connection(ws);

    ws.on('message', function(message) {
      try {
        message = JSON.parse(message);
      } catch (error) {
        console.log("WS Message Parse Error", error);
        return;
      }

      if ( ! message.type ) return;

      if ( message.type == 'identify' )
        return identify(connection, message);

      if ( message.type == 'reconnect' )
        return reconnect(connection, message);

      if ( ! connection.identity ) return;

      if ( message.schedule && message.name )
        return scheduleMessage(connection, message);

      return handleMessage( connection, message );
    })

    ws.on('disconnect', function() {
      delete connections[connection.id];
      if ( connection.room && chatrooms[connection.room] ) {
        var room = chatrooms[connection.room], index = room.indexOf(connection);
        if ( ~index ) room.splice(index,1);
      }
      handleMessage( connection, {type:'disconnected'})
    })

    ws.on('error', function(err) {
      console.log('ERROR', err)
    })
  });

  function handleMessage( connection, message ) {
    message.from = connection.identity;
    message.timestamp = new Date().getTime();
    message.room = connection.room;

    if ( messageHandlers[message.type] )
      return messageHandlers[message.type](connection,message,handled);
    return defaultHandler( connection, message, handled );
  }

  function scheduleMessage( connection, message ) {
    message.from = connection.identity;
    message.timestamp = new Date().getTime();
    message.room = connection.room;

    scheduler.add( message );
    return messages.save( message, handled );
  }

  function handleScheduled( message ) {
    if ( ! chatrooms[message.room] ) return;
    var connection = {room:message.room, identity:message.identity};
    return handleMessage( connection, message );
  }

  function attachIdentification( connection, message ) {
    connection.identify( message.identity, message.room );
    connections[connection.id] = connection;
    (chatrooms[message.room] = chatrooms[message.room] || []).push(connection);
  }

  function identify( connection, message ) {
    attachIdentification( connection, message );
    handleMessage( connection, {type:'joined'} );
    return rooms.find( message.room, withRoom );

    function withRoom( err, room ) {
      if ( err || ! room ) return handled( err ? err : new Error("room "+message.room+" doesn't exist"));
      return messages.find( {room:message.room, type:'upgrade'}, withUpgrades );
    }

    function withUpgrades( err, upgrades ) {
      for ( var i=0, upgrade; upgrade = upgrades[i]; i++ )
        connection.send( upgrade );
      handled();
    }
  }

  function replay( connection, message ) {
    var crit = {room:connection.room};
    if ( message.type ) crit.type = message.oftype;
    if ( message.since ) crit.timestamp = {$gt:message.since};
    if ( message.limit ) crit.limit = message.limit;
    messages.stream( crit, respond, handled );

    function respond(err, message) {
      if ( err ) return console.log( "replay error", err );
      message.replay = true;
      connection.send( message );
    }
  }

  function request( connection, message ) {
    requests.request( message, handleResponse );

    function handleResponse( err, body ) {
      var response = { 
        type : message.responseType || 'response',
        error : err,
        body : body,
      }
      if ( message.responseName ) response.name = message.responseName;
      handleMessage( connection, response );
    }
  }

  function reconnect( connection, message ) {
    attachIdentification( connection, message );
    handleMessage( connection, {type:'joined'} );
  }

  function broadcast( connection, message ) {
    if ( connection.room && chatrooms[connection.room] ) {
      for ( var i=0, other, r=chatrooms[connection.room]; other=r[i]; i++ )
        other.send( message );
    }
  }

  function handled(err) {
    emitter.emit('handled', err);
  }

  function defaultHandler( connection, message, done ) {
    broadcast(connection, message);
    return messages.save( message, done );
  }

  function importUpgrade( connection, message, done ) {
    var upgradeSpec = message.text.split('::'), room = upgradeSpec[0], upgrade = upgradeSpec[1];
    return messages.find({room:room, name:upgrade}, withUpgrade);
    function withUpgrade( err, upgradeResults ) {
      var upgrade = upgradeResults[0];
      if ( err ) return done(err);
      if ( ! upgrade ) return done(new Error('could not find upgrade: ' + message.text));
      upgrade.room = connection.room;
      delete upgrade._id;
      broadcast(connection, upgrade);
      messages.save( upgrade, done );
    }
  }

  function removeUpgrade( connection, message, done ) {
    return messages.remove( {room:connection.room, type:'upgrade', name:message.text}, andReset );
    function andReset( err ) {
      if ( err ) return done(err);
      broadcast(connection, {type:'reset'});
      done();
    }
  }
}

function Connection(socket) {
  var id = connectionNumber++;
  return {
    send: function(o) { socket.emit('data',o); },
    identify: function(identity, room) { 
      this.identity = identity; 
      this.room = room;
    },
    identity: null,
    room: null,
    id: id
  }
}
