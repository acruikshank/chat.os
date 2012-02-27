var db = require('./db');

var messages = db.collection_functor('messages');

// generate indexes if necessary
db.add_initializer( function addMessagesIndex( done ) {
  var collection;
  return messages( db.guard(done, addTypeIndex) );
  function addTypeIndex( messagesCollection ) {
    (collection = messagesCollection).ensureIndex({room:1, type:1}, db.guard(done,addTimeIndex));
  }
  function addTimeIndex() {
    collection.ensureIndex({timestamp:-1}, done);
  }
} );

module.exports.save = function( message, cb ) {
  return messages( db.guard(cb,save) );

  function save( message_collection ) {
    if ( message.name )
      message_collection.update( {room:message.room, type:message.type, name:message.name}, message, {upsert:true}, cb );
    else
      message_collection.save( message, cb );
}

module.exports.find = function( conditions, cb ) {
  return messages( db.guard(cb,withCollection) );

  function withCollection( message_collection ) {
    message_collection.find(conditions).sort({timestamp:1}).toArray(cb);
  }
}

module.exports.stream = function( conditions, cb, endCB ) {
  var cursor, message_collection, limit = conditions.limit;
  delete conditions.limit;

  return messages( db.guard(cb,withCollection) );

  function withCollection( mc ) {
    message_collection = mc;
    if ( limit ) return message_collection.find(conditions).count( db.guard(cb,withCount) );
    withSkip(0);
  }
  function withCount( count ) { withSkip( Math.max(count - limit,0) ); }
  function withSkip( skip ) {
    cursor = message_collection.find(conditions).sort({timestamp:1});
    if ( skip ) cursor.skip(skip);
    if ( limit ) cursor.limit(limit);
    cursor.nextObject( next );
  }
  function next( err, message ) {
    if ( ! err && ! message ) return endCB ? endCB() : null;
    cb( err, message );
    cursor.nextObject( next );
  }
}

module.exports.remove = function( conditions, cb ) {
  return messages( db.guard(cb,remove) );

  function remove( message_collection ) {
    message_collection.remove(conditions,cb);
  }
}
