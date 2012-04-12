var expect = require('expect.js');
var db = require('../lib/db').for_testing();
var upgrades = require('../lib/messages');

function last(a) { return a[a.length-1]; }

describe('When using the messages module', function() { 
  beforeEach(function(done) {
    db.clean(done, 'messages');
  })

  describe ('When inserting an object', function() {
    beforeEach(function(done) {
      upgrades.save( {type:'upgrade', room:'main', script:'console.log("hi")', timestamp:new Date().getTime()}, done );
    })

    it ('finds the object in the database', function(done) {
      return upgrades.find({room:'main', type:'upgrade'},withResults);
      function withResults(err, results) {
        if ( err ) throw err;
        expect(results.length).to.be(1);
        expect(results[0].script).to.match(/console/)
        done();
      }
    })
  })
})
