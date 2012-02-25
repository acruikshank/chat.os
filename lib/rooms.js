var db = require('./db');

var rooms = db.collection_functor('rooms');

module.exports.create = function( room, cb ) {
  return rooms( db.guard(cb,save) );

  function save( room_collection ) {
    room_collection.insert( room, cb );
  }
}

var find = module.exports.find = function( name, cb ) {
  return rooms( db.guard(cb,find) );

  function find( room_collection ) {
    room_collection.findOne( {name:name}, cb );
  }  
}

var all = module.exports.all = function( criteria, cb ) {
  return rooms( db.guard(cb,find) );

  function find( room_collection ) {
    room_collection.find( criteria ).toArray(cb);
  }
}