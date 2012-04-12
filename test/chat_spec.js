var db = require('../lib/db').for_testing();
var scheduler = require('../lib/scheduler').for_testing();
var messages = require('../lib/messages');
var rooms = require('../lib/rooms');
var sockets = require('./mock_socket_server');
var chat = require('../lib/chat');
var expect = require('expect.js');

// stub out requests
var requestResponder = function(o) { return JSON.stringify(o); }
require('../lib/requests').for_testing( function(o) { return requestResponder(o); } );

function last(a) { return a[a.length-1]; }

describe('Chat', function(){
  var socketA, socketB, socketC, socketD, socketE, onHandled, server;

  function sequenceHandled() {
    var functions = Array.prototype.slice.call(arguments,0), 
        index=0;
    function next() {
      if ( ! functions[index+1] ) return functions[index]();
      onHandled = next;
      functions[index++]();
    }
    next();
  }

  before( function() {
    chat.events.addListener('handled', function(err) {
      if ( err ) throw err;
      var action = onHandled;
      onHandled = null;
      if ( action ) action();
    })
    server = sockets.MockServer();
    chat.manage(server);
  })

	beforeEach( function(done) {
    socketA = server.connect();
    socketB = server.connect();
    socketC = server.connect();
    socketD = server.connect();
    socketE = server.connect();

    return db.clean(addMessages, 'rooms', 'messages');
    function addMessages() {
      var time = new Date().getTime();
      var fixture = [ 
                      {type:'comment',room:'main',body:'early message', timestamp:time-100000},
                      {type:'comment',room:'main',body:'early message 2', timestamp:time-80000},
                      {type:'comment',room:'main',body:'do not load me as an upgrade', timestamp:time-20000},
                      {type:'upgrade', room:'main', name:'upgrade1', script:'console.log("testing");', timestamp:time-15000},
                      {type:'comment',room:'main',body:'do not load me as another upgrade', timestamp:time-10000},
                      {type:'comment',room:'other',body:'comment in other room', timestamp:time-5000},
                      {type:'comment',room:'main',body:'modern comment', timestamp:time-30000},
                    ];
      (function upgradeFixtures() {
        messages.save( fixture.splice(0,1)[0], fixture.length ? upgradeFixtures : addRooms );
      })();
    }
    function addRooms() {
      var fixture = [ {name:'main'}, 
                      {name:'other'} ];
      (function roomFixtures() {
        rooms.create( fixture.splice(0,1)[0], fixture.length ? roomFixtures : done );
      })();
    }
	})

  describe('when sending an invalid message', function() {
  	beforeEach( function() {
    	socketA.message('This is only a test')
  	})

    it('the message is ignored', function() {
    	expect( socketA.sent ).to.be.empty();
    })
  })

  describe('when sending a message prior to identification', function() {
    beforeEach( function() {
      socketA.message({type:'comment', body:'This is only a test'})
    })

    it('the message is ignored', function() {
      expect( socketA.sent ).to.be.empty();
      expect( socketB.sent ).to.be.empty();
      expect( socketC.sent ).to.be.empty();
    })
  })

  describe('after identifying', function() {
    beforeEach(function(done) {
      sequenceHandled(
        function ida() { 
          socketA.message({type:'identify', identity:{email:'a@example.com', nickname:'A'}, room:'main' });
        }, function idb() {
          socketB.message({type:'identify', identity:{email:'b@example.com', nickname:'B'}, room:'main' });
        }, function idc() {
          socketC.message({type:'identify', identity:{email:'c@example.com', nickname:'C'}, room:'main' });
        }, function idd() {
          socketD.message({type:'identify', identity:{email:'d@example.com', nickname:'D'}, room:'other' });
        }, function ide() {
          socketE.message({type:'identify', identity:{email:'e@example.com', nickname:'E'}, room:'other' });
        }, done );        
    })

    it('sends existing upgrades for room', function() {
      expect( last(socketA.sent).type ).to.be( 'upgrade' );
      expect( last(socketA.sent).script ).to.match( /console.*"testing"/ );

      expect( last(socketB.sent).type ).to.be( 'upgrade' );
      expect( last(socketB.sent).script ).to.match( /console.*"testing"/ );

      expect( last(socketC.sent).type ).to.be( 'upgrade' );
      expect( last(socketC.sent).script ).to.match( /console.*"testing"/ );

      expect( socketD.sent ).to.be.empty();
    })
    
    describe('when reconnecting', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'reconnect', identity:{email:'a@example.com', nickname:'A'}, room:'main'});
      })

      it('does not send existing upgrades', function() {
        expect(socketA.sent.length).to.be( 1 );
      })
    })

    describe('when sending a valid message', function() {
      beforeEach( function(done) {
        onHandled = done;
        socketA.message({type:'comment', body:'This is only a test'})
      })

      it('echoes the message to all participants', function() {
        expect( last(socketA.sent).type ).to.be( 'comment' );
        expect( last(socketA.sent).body ).to.be( 'This is only a test' );

        expect( last(socketB.sent).type ).to.be( 'comment' );
        expect( last(socketB.sent).body ).to.be( 'This is only a test' );

        expect( last(socketC.sent).type ).to.be( 'comment' );
        expect( last(socketC.sent).body ).to.be( 'This is only a test' );
      })

      it('does not echo message outside of room', function() {
        expect( socketD.sent ).to.be.empty();
      })

      it('adds a from to the message', function() {
        expect( last(socketC.sent).from.email ).to.be( 'a@example.com' );
      })

      it('adds a timestamp to the message', function() {
        expect( last(socketC.sent).timestamp ).to.be.greaterThan( 1000 );
      })

      it('adds the room to the message', function() {
        expect( last(socketC.sent).room ).to.be( 'main' );
      })

      it('saves the message', function(done) {
        return messages.find({room:'main', type:'comment'}, withResults);
        function withResults( err, results ) {
          if ( err ) throw err;
          expect( last(results).body ).to.be('This is only a test');
          done();
        }

      })
    })

    describe('and sending a replay message', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'replay', oftype:'comment', since:(new Date().getTime() - 40000)});
      });

      it ('sends the requested messages from the correct room in the correct order to the user', function() {
        expect( socketA.sent.length ).to.be(4);
        expect( socketA.sent[1].body ).to.match(/modern comment/);
        expect( socketA.sent[2].body ).to.match(/as an upgrade/);
        expect( socketA.sent[3].body ).to.match(/as another upgrade/);
      });

      it ('does not send the messages to other users', function() {
        expect( socketB.sent.length ).to.be(1);
        expect( socketC.sent.length ).to.be(1);
      });
    })

    describe('and sending a replay message with a limit', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'replay', oftype:'comment', limit:4});
      });

      it ('sends the requested messages from the correct room in the correct order to the user', function() {
        expect( socketA.sent.length ).to.be(5);
        expect( socketA.sent[1].body ).to.match(/early message 2/);
        expect( socketA.sent[2].body ).to.match(/modern comment/);
        expect( socketA.sent[3].body ).to.match(/as an upgrade/);
        expect( socketA.sent[4].body ).to.match(/as another upgrade/);
      });

      it ('does not send the messages to other users', function() {
        expect( socketB.sent.length ).to.be(1);
        expect( socketC.sent.length ).to.be(1);
      });
    })

    describe('and sending a request message', function() {
      beforeEach(function(done) {
        onHandled = done;
        requestResponder = function() { return "Test Request Response"; }
        socketA.message({type:'request',url:'http://somewhere.nonexistant', responseType:'requestTest'});
      })

      it ('does not save the request', function() {
        return messages.find({room:'main', type:'request'}, withResults);
        function withResults(err, results) {
          expect(err).to.be(null);
          expect(results.length).to.be(0);
        }
      })

      it ('broadcasts the response', function() {
        expect( last(socketA.sent).type ).to.be( 'requestTest' );
        expect( last(socketA.sent).body ).to.be( 'Test Request Response' );

        expect( last(socketC.sent).type ).to.be( 'requestTest' );
        expect( last(socketC.sent).body ).to.be( 'Test Request Response' );
      })

      it ('saves the response', function() {
        return messages.find({room:'main', type:'requestTest'}, withResults);
        function withResults(err, results) {
          expect(err).to.be(null);
          expect(results.length).to.be.greaterThan(0);
          expect(last(results).body).to.be('Test Request Response');
        }
      })
    })

    describe('and sending a scheduled message', function() {
      beforeEach(function(done) {
        onHandled = done;
        requestResponder = function() { return "Test Request Response"; }
        socketA.message({type:'comment', body:'Happy New Year', name:'new-years', schedule:'0 0 0 0 0 0'});
      })

      it ('saves the message', function() {
        return messages.find({room:'main', name:'new-years'}, withResults);
        function withResults(err, results) {
          expect(err).to.be(null);
          expect(results.length).to.be(1);
          expect(results[0].body).to.be('Happy New Year');
        }
      })

      it ('does not broadcasts the response', function() {
        var top = last(socketA.sent) || {type:'not-a-scheduled-message'};
        expect( top ).to.not.be( 'new-years' );
      })

      it ('schedules the response broadcast', function() {
        expect(scheduler.contains_scheduled('main','new-years')).to.be(true);
      })

      describe('then when scheduled message is fired', function() {
        beforeEach(function() {
          scheduler.simulate_scheduled({type:'comment', room:'main', body:'Happy New Year', name:'new-years2', schedule:'0 0 0 0 0 0'});
        });

        it ('broadcasts scheduled messsage', function() {
          expect( last(socketA.sent).type ).to.be( 'comment' );
          expect( last(socketA.sent).body ).to.be( 'Happy New Year' );

          expect( last(socketC.sent).type ).to.be( 'comment' );
          expect( last(socketC.sent).body ).to.be( 'Happy New Year' );
        })
      })
    })


    describe('and sending an upgrade message', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'upgrade', name:'testvar', script:'var a="test";'});
      })

      it ('saves the upgrade', function() {
        return messages.find({room:'main', type:'upgrade'}, withResults);
        function withResults(err, results) {
          expect(err).to.be(null);
          expect(results.length).to.be.greaterThan(0);
          expect(last(results).script).to.match(/var a/)
        }      
      });

      it ('broadcasts the upgrade to room', function() {
        expect( last(socketA.sent).type ).to.be( 'upgrade' );
        expect( last(socketA.sent).script ).to.match(/var a/);

        expect( last(socketC.sent).type ).to.be( 'upgrade' );
        expect( last(socketC.sent).script ).to.match(/var a/);
      });

      it ('adds the upgrade to the room', function(done) {
        return messages.find({room:'main', type:'upgrade'}, withResults);
        function withResults( err, results ) {
          if ( err ) throw err;
          expect( last(results).name ).to.be('testvar');
          done();
        }
      })

      describe('and updating the upgrade', function() {
        beforeEach(function(done) {
          onHandled = done;
          socketA.message({type:'upgrade', name:'testvar', script:'var a="another";'});
        })

        it ('updates the upgrade', function() {
          return messages.find({room:'main', type:'upgrade'},withResults);
          function withResults(err, results) {
            expect(err).to.be(null);
            expect(results.filter(function(r){return r.name=='testvar';}).length).to.be(1);
            expect(last(results).script).to.match(/var a="another"/)
          }                
        })

        it ('does not add the upgrade twice', function(done) {
          return messages.find({room:'main', type:'upgrade'}, withResults);
          function withResults( err, results ) {
            if ( err ) throw err;
            expect( results.filter(function(u){return u.name=='testvar';}).length ).to.be(1);
            done();
          }          
        })
      })
    })

    describe('and importing an upgrade', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketD.message({type:'import', text:'main::upgrade1'});
      })

      it ('broadcasts the upgrade to room', function() {
        expect( last(socketD.sent).type ).to.be( 'upgrade' );
        expect( last(socketD.sent).name ).to.be( 'upgrade1' );
        expect( last(socketD.sent).script ).to.match(/console.log/);

        expect( last(socketE.sent).type ).to.be( 'upgrade' );
        expect( last(socketE.sent).name ).to.be( 'upgrade1' );
        expect( last(socketE.sent).script ).to.match(/console.log/);
      });

      it ('adds the upgrade to the room', function(done) {
        return messages.find({room:'other',name:'upgrade1'}, withResults);
        function withResults( err, upgrades ) {
          if ( err ) throw err;
          expect( upgrades.length ).to.be(1);
          expect( last(upgrades).room ).to.be('other');
          expect( last(upgrades).name ).to.be('upgrade1');
          expect( last(upgrades).script ).to.match(/console.log/);
          done();
        }
      })
    })

    describe('and then removing the upgrade', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'remove', text:'upgrade1'});
      })

      it ('broadcasts a reset to room', function() {
        expect( last(socketA.sent).type ).to.be( 'reset' );
        expect( last(socketB.sent).type ).to.be( 'reset' );
        expect( last(socketC.sent).type ).to.be( 'reset' );
      });

      it ('removes the upgrade from the room', function(done) {
        return messages.find({room:'main',type:'upgrade',name:'upgrade1'}, withResults);
        function withResults( err, results ) {
          if ( err ) throw err;
          expect( results ).to.be.empty();
          return done();
        }
      })
    })
  })

})
