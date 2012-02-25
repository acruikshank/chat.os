var cron = require('cron')
var emitter = new (require('events').EventEmitter)();
var db = require('./db');
var messages = require('./messages');

var jobs = {}

function delegate(o,method) { return function() { return o[method].apply(o,arguments); } }
['addListener','on','once','removeListener'].forEach(function(m) { module.exports[m] = delegate(emitter,m); })

function messageKey( message ) {
  return message.room + '&&' + message.name;
}

module.exports.add = function( message ) {
  var key = messageKey(message);
  var job;
  
  if ( jobs[key] ) {
    jobs[key].stop();
    delete jobs[key];
  }
  
  if ( message.active !== false )
	   job = jobs[key] = new cron.CronJob( message.schedule, respond );

  function respond( ) {
    emitter.emit('scheduled message', message);
  }
}

module.exports.for_testing = function() {
  module.exports.add = function(message) { jobs[messageKey(message)] = message; };
  module.exports.contains_scheduled = function(room,name) { return !!jobs[room+'&&'+name]; }
  module.exports.simulate_scheduled = function(message) { emitter.emit('scheduled message', message) }
  return module.exports;
}

// load all active scheduled messages
return messages.stream( {schedule:{$exists:true}, active:{$ne:false}}, schedule );
function schedule( err, message ) {
  if ( err ) return console.log(err);
  module.exports.add( message );
}
