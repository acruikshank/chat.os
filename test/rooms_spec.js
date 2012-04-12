var expect = require('expect.js');
var db = require('../lib/db').for_testing();
var rooms = require('../lib/rooms');
var upgrades = require('../lib/rooms');

describe('When using the rooms module and', function() { 
  beforeEach(function(done) {
    db.clean(done, 'rooms');
  })

  function over(f,a,h) {
    var l=a.slice(0); (function r() { f(l.splice(0,1)[0], l.length?r:h) })(); 
  }

  describe('creating a room', function() {
    beforeEach(function(done) {
      rooms.create( {name:'test1'}, done );
    })

    it ('finds the object in the database', function(done) {
      return rooms.find('test1', db.guard(done,withResults) );
      function withResults(room) {
        expect(room).to.ok();
        expect(room.name).to.be('test1');
        done();
      }
    })
  })
})
