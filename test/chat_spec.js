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

function ofType(a, type) { return a.filter(function(m) { return m.type==type; }) }
function last(a, type) { var f=(type ? ofType(a,type) : a); return f[f.length-1]; }
function waitToBeCalled(times) {
  var count = 0;
  return { timesThenCall: function(f) { 
    return function() { if (++count == times) f(); } 
  } }
}

describe('Chat', function(){
  var socketA, socketB, socketC, socketD, socketE, onHandled, server;

  before( function() {
    chat.events.addListener('handled', function(err) {
      if ( err ) throw err;
      if ( onHandled ) onHandled();
    })
    server = sockets.MockServer();
    chat.manage(server);
  })

	beforeEach( function(done) {
    socketA = server.connect({email:'a@example.com', nickname:'A'});
    socketB = server.connect({email:'b@example.com', nickname:'B'});
    socketC = server.connect({email:'c@example.com', nickname:'C'});
    socketD = server.connect({email:'d@example.com', nickname:'D'});
    socketE = server.connect({email:'e@example.com', nickname:'E'});

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
          {type:'non-comment',room:'main',body:'not a comment', timestamp:time-29500},
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
      // expect to have handled called twice for each connection
      onHandled = waitToBeCalled( 10 ).timesThenCall( done )

      socketA.message({type:'identify', room:'main' });
      socketB.message({type:'identify', room:'main' });
      socketC.message({type:'identify', room:'main' });
      socketD.message({type:'identify', room:'other' });
      socketE.message({type:'identify', room:'other' });
    })

    afterEach( function( done ) {
      onHandled = waitToBeCalled( 5 ).timesThenCall( done )
      
      socketA.disconnect();
      socketB.disconnect();
      socketC.disconnect();
      socketD.disconnect();
      socketE.disconnect();
    } )

    it("sends a 'joined' message to the room", function() {
      expect( last(socketA.sent, 'joined' ) ).to.be.ok();
      expect( last(socketA.sent, 'joined' ).from.email ).to.match( /c\@example\.com/ );

      expect( last(socketB.sent, 'joined' ) ).to.be.ok();
      expect( last(socketB.sent, 'joined' ).from.email ).to.match( /c\@example\.com/ );

      expect( last(socketC.sent, 'joined' ) ).to.be.ok();
      expect( last(socketC.sent, 'joined' ).from.email ).to.match( /c\@example\.com/ );

      expect( last(socketD.sent, 'joined' ) ).to.be.ok();
      expect( last(socketD.sent, 'joined' ).from.email ).to.match( /e\@example\.com/ );
    })

    it('sends existing upgrades for room', function() {
      expect( last(socketA.sent, 'upgrade' ) ).to.be.ok();
      expect( last(socketA.sent, 'upgrade').script ).to.match( /console.*"testing"/ );

      expect( last(socketB.sent, 'upgrade' ) ).to.be.ok();
      expect( last(socketB.sent, 'upgrade').script ).to.match( /console.*"testing"/ );

      expect( last(socketC.sent, 'upgrade' ) ).to.be.ok();
      expect( last(socketC.sent, 'upgrade').script ).to.match( /console.*"testing"/ );

      expect( last(socketD.sent, 'upgrade') ).to.be(undefined);
    })
    
    describe('when reconnecting', function() {
      beforeEach(function(done) {
        onHandled = waitToBeCalled( 2 ).timesThenCall( done )  
        socketA.disconnect();
        socketA.message({type:'reconnect', identity:{email:'a@example.com', nickname:'A'}, room:'main'});
      })

      it("sends a 'joined' message to the room", function() {
        expect( last(socketA.sent, 'joined' ) ).to.be.ok();
        expect( last(socketA.sent, 'joined' ).from.email ).to.match( /a\@example\.com/ );

        expect( last(socketB.sent, 'joined' ) ).to.be.ok();
        expect( last(socketB.sent, 'joined' ).from.email ).to.match( /a\@example\.com/ );

        expect( last(socketC.sent, 'joined' ) ).to.be.ok();
        expect( last(socketC.sent, 'joined' ).from.email ).to.match( /a\@example\.com/ );

        expect( last(socketD.sent, 'joined' ) ).to.be.ok();
        expect( last(socketD.sent, 'joined' ).from.email ).to.match( /e\@example\.com/ );
      })

      it('does not send existing upgrades', function() {
        expect( ofType(socketA.sent,'upgrade').length ).to.be( 1 );
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
        expect( last(socketD.sent,'comment') ).to.be(undefined);
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

    describe('when sending a transient message', function() {
      beforeEach( function(done) {
        onHandled = done;
        socketA.message({type:'typing-start', persist:false})
      })

      it('echoes the message to all participants', function() {
        expect( last(socketA.sent).type ).to.be( 'typing-start' );
        expect( last(socketB.sent).type ).to.be( 'typing-start' );
        expect( last(socketC.sent).type ).to.be( 'typing-start' );
      })

      it('does NOT save the message', function(done) {
        return messages.find({room:'main', type:'typing-start'}, withResults);
        function withResults( err, results ) {
          if ( err ) throw err;
          expect( last(results,'typing-start') ).to.be(undefined);
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
        expect( ofType(socketA.sent,'comment').length ).to.be(3);
        expect( ofType(socketA.sent,'comment')[0].body ).to.match(/modern comment/);
        expect( ofType(socketA.sent,'comment')[1].body ).to.match(/as an upgrade/);
        expect( ofType(socketA.sent,'comment')[2].body ).to.match(/as another upgrade/);
      });

      it ('does not send the messages to other users', function() {
        expect( ofType(socketB.sent,'comment') ).to.be.empty();
        expect( ofType(socketC.sent,'comment') ).to.be.empty();
      });
    })

    describe('and sending a replay message with a limit', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'replay', oftype:'comment', limit:4});
      });

      it ('sends the requested messages from the correct room in the correct order to the user', function() {
        expect( ofType(socketA.sent,'comment').length ).to.be(4);
        expect( ofType(socketA.sent,'comment')[0].body ).to.match(/early message 2/);
        expect( ofType(socketA.sent,'comment')[1].body ).to.match(/modern comment/);
        expect( ofType(socketA.sent,'comment')[2].body ).to.match(/as an upgrade/);
        expect( ofType(socketA.sent,'comment')[3].body ).to.match(/as another upgrade/);
      });

      it ('does not send the messages to other users', function() {
        expect( ofType(socketB.sent,'comment') ).to.be.empty();
        expect( ofType(socketC.sent,'comment') ).to.be.empty();
      });
    })

    describe('and sending a replay message with multiple types', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'replay', oftype:['comment','non-comment'], limit:5});
      });

      it ('sends the requested messages from the correct room in the correct order to the user', function() {
        expect( ofType(socketA.sent,'comment').length ).to.be(4);
        expect( ofType(socketA.sent,'comment')[0].body ).to.match(/early message 2/);
        expect( ofType(socketA.sent,'comment')[1].body ).to.match(/modern comment/);
        expect( ofType(socketA.sent,'comment')[2].body ).to.match(/as an upgrade/);
        expect( ofType(socketA.sent,'comment')[3].body ).to.match(/as another upgrade/);
        expect( ofType(socketA.sent,'non-comment').length ).to.be(1);
      });

      it ('does not send the messages to other users', function() {
        expect( ofType(socketB.sent,'comment') ).to.be.empty();
        expect( ofType(socketC.sent,'comment') ).to.be.empty();
      });
    })

    describe('and sending a rollcall message', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.message({type:'rollcall'});
      })

      it ('sends a response only to the sender', function() {
        expect( ofType(socketA.sent,'rollcall').length ).to.be(1);
        expect( ofType(socketB.sent,'rollcall') ).to.be.empty();
        expect( ofType(socketD.sent,'rollcall') ).to.be.empty();
      })

      it ('sends a the identity of all current participants in the room', function() {
        var participants = ofType(socketA.sent,'rollcall')[0].participants;
        participants.withEmail = function(e) { return this.filter(function(p) { return p.email == e;}); }
        expect( participants.length ).to.be(3);
        expect( participants.withEmail('a@example.com').length ).to.be(1);
        expect( participants.withEmail('b@example.com').length ).to.be(1);
        expect( participants.withEmail('b@example.com').length ).to.be(1);
      })
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
          onHandled = null;
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

    describe('and then disconnecting', function() {
      beforeEach(function(done) {
        onHandled = done;
        socketA.disconnect();
      });

      it ('broadcasts a disconnect message to rest of room', function() {
        expect( last(socketA.sent, 'disconnected' ) ).to.be(undefined);

        expect( last(socketB.sent, 'disconnected' ) ).to.be.ok();
        expect( last(socketB.sent, 'disconnected' ).from.email ).to.match( /a\@example\.com/ );

        expect( last(socketC.sent, 'disconnected' ) ).to.be.ok();
        expect( last(socketC.sent, 'disconnected' ).from.email ).to.match( /a\@example\.com/ );

        expect( last(socketD.sent, 'disconnected' ) ).to.be(undefined);
      });
    });
  })

})
