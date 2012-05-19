var cron = require('cron')
var dateformat = require('dateformat');
var emitter = new (require('events').EventEmitter)();
var db = require('./db');
var messages = require('./messages');

var jobs = {}
var current_time = function() { return new Date(); }

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
  
  if ( message.active !== false ) {
	  job = jobs[key] = new cron.CronJob( message.schedule, respond, null, true );
  }

  function respond( ) { sendMessage( message ); }
}

function sendMessage( message ) {
  emitter.emit('scheduled message', interpolated(message) );
}

function interpolated( o ) {
  if ( Array.isArray(o) )
    return o.map( interpolated );

  if ( typeof o == 'object' ) {
    var new_o = {};
    for ( var k in o ) if ( o.hasOwnProperty(k) ) new_o[k] = interpolated(o[k]);
    return new_o;
  }

  if ( typeof o == 'string' ) {
    try {
      o = o.replace( /\%d\{(.*?)((--|\+\+)(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+))?\}/g, 
            function(m,format,a,sign,years,months,days,hours,minutes,seconds) {
        var time = current_time(), s = sign ==='--' ? -1 : 1;
        console.log(sign,s,years,months,days,hours,minutes,seconds);
        var adjusted = !sign ? time : new Date(
          time.getFullYear() + s * (years|0),
          time.getMonth() + s * (months|0),
          time.getDate() + s * (days|0),
          time.getHours() + s * (hours|0),
          time.getMinutes() + s * (minutes|0),
          time.getSeconds() + s * (seconds|0) );
        return dateformat(adjusted,format);
      } );
    } catch (e) { }
  }

  return o;
}

module.exports.for_testing = function() {
  module.exports.add = function(message) { jobs[messageKey(message)] = message; };
  module.exports.contains_scheduled = function(room,name) { return !!jobs[room+'&&'+name]; }
  module.exports.simulate_scheduled = function(message, at_time) { 
    current_time = function() { return at_time || new Date(); }
    sendMessage( message ); 
  }
  return module.exports;
}

// load all active scheduled messages
return messages.stream( {schedule:{$exists:true}, active:{$ne:false}}, schedule );
function schedule( err, message ) {
  if ( err ) return console.log(err);
  module.exports.add( message );
}
