var express = require('express');
var WebSocketServer = require('ws').Server;
var sessions = require( "cookie-sessions" );
var app = express.createServer();
var wss = new WebSocketServer({server:app, protocolVersion: 8});
var chat = require('./lib/chat').manage( wss);
var db = require('./lib/db');
var rooms = require('./lib/rooms');

/*
* Authentication
* broadcast to room
* send and execute js patch in room.
* html and css patches
* persistence
* authentication
* voting
*/

app.configure(function(){
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
  app.use( sessions( { secret: "notverysecretisit?", session_key : '_chatos' } ) );
  app.set('view engine','jade');
  app.set('view options',{layout:false});
  app.use( express.bodyParser() );
  app.use(express.static(__dirname+'/public'));
});

app.post('/login', function( req, res ) {
  (req.session = req.session || {}).email = req.body.email;
  req.session.nickname = req.body.nickname;

  var destination = req.session.preauth_destination;
  delete req.session.preauth_destination;
  return res.redirect( destination || '/' );
});

app.get('/logout', function( req, res ) {
  if ( req.session )
    delete req.session.email;
    delete req.session.nickname;
  res.redirect('/');
});

app.get('/', authenticate, function( req, res, next ) {
  res.redirect('/rooms/');
});

app.get('/rooms/', authenticate, function( req, res, next ) {
  return rooms.all({}, db.guard(next, renderRooms) );
  function renderRooms( rooms ) {
    res.render('new_room', {rooms:rooms});
  }
});

app.post('/rooms/new', authenticate, function( req, res, next ) {
  return rooms.create( {name:req.body.name}, db.guard(next,andRespond) );
  function andRespond() {
    res.redirect('/rooms/'+ encodeURIComponent(req.body.name) );
  }
});

app.get('/rooms/:room', authenticate, with_room, function( req, res, next ) {
  res.render('chat', {identity:{email:req.session.email, nickname:req.session.nickname}, room:req.room });
});

app.listen( 8500 );

function authenticate( req, res, next ) {
  if ( ! req.session || ! req.session.email ) {
    req.session = { preauth_destination : req.url };
    return res.render('login');
  }
  return next();
}

function with_room( req, res, next ) {
  return rooms.find( req.params.room, db.guard(next,attachRoom) );
  function attachRoom( room ) {
    if ( ! room ) return res.send(404);

    req.room = room;
    next();
  }
}