var mongodb = require('mongodb');

var connection;
var db;
var initializers = [];

var guard = module.exports.guard = function guard(errback,cb) {
  return function( err, data ) {
    if ( err ) return errback(err);
    cb(data);
  }
}

var connect = module.exports.connect = function connect(cb) {
  var initializing = false;

  if ( ! connection ) 
    connection = new mongodb.Db('chatos', new mongodb.Server("127.0.0.1", 27017, {auto_reconnect: true}), {})
  
  if ( db ) return ensureInitialized();
  
  connection.open(function(error, db_) {
    db = db_;
    return ensureInitialized();
  });

  function ensureInitialized( err ) {
    if ( err ) return cb( err );
    if ( initializing || ! initializers[0] ) return cb( null, db );

    initializing = true;
    initializers.splice(0,1)[0]( function(err) { 
      initializing = false; 
      ensureInitialized(err); 
    });
  }
}


module.exports.add_initializer = function( initializer /* (cb(err)) */ ) {
  initializers.push( initializer );
}

module.exports.collection_functor = function( collection ) {
  return function( cb ) {
    connect(function(err, db) {
      if ( err ) return cb(err);
      db.collection(collection, cb);
    });
  }
}

module.exports.for_testing = function() {
  connection = new mongodb.Db('chatos_test', new mongodb.Server("127.0.0.1", 27017, {auto_reconnect: false}), {});

  module.exports.clean = function(cb, collection1, collection2, etc ) {
    return (function clearAll( collections ) {
      if ( ! collections.length ) return cb();

      var collection = collections[0];
      return connect( guard(cb, withDb) );

      function withDb( db ) {
        return db.collection( collection, guard(cb, clear) );
      }

      function clear( collection ) {
        return collection.remove( guard(cb,repeat) );
      }

      function repeat() {
        return clearAll( collections.slice(1) );
      }
    })( Array.prototype.slice.call( arguments, 1 ) );

  }

  return module.exports;
} 