var express = require('express');
var WebSocketServer = require('ws').Server;
var sessions = require( "cookie-sessions" );
var app = express.createServer();
var wss = new WebSocketServer({server:app, protocolVersion: 8});
var chat = require('./lib/chat').manage( wss);
var db = require('./lib/db');
var rooms = require('./lib/rooms');
var config = require('./config');
var http = require('http');
var Shred = new require('shred');
var shred = new Shred();
var querystring = require('querystring');

/*
 * Authentication
 * Room owners
 * Room administration
 *  Disable (, edit)? upgrades
 * Room invites
 * Proper message (i.e. upgrade) versioning
 */

app.configure(function(){
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
  app.use( sessions( { secret:config.session_secret, session_key : '_chatos' } ) );
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
  return res.redirect('/rooms/');
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

app.get('/google_oauth2_callback', function( req, res ) {
  var next_uri = req.query.state;
  if ( req.query.code ) {

    var request = shred.post({
      url: 'https://accounts.google.com/o/oauth2/token',
      headers:{ content_type: 'application/x-www-form-urlencoded' },
      body: querystring.encode({
        code:req.query.code,
        client_id: config.google_client_id,
        client_secret: config.google_secret,
        redirect_uri: config.google_redirect_uri,
        grant_type: 'authorization_code' }),
      on : {
        200: token_response,
        response: function(r) { console.log.apply(console, ['AUTH FAILURE',r.content.data].concat(arguments) ); } } })

    function token_response( response ) {
      shred.get({
        url:'https://www.googleapis.com/oauth2/v1/userinfo',
        query: { access_token: response.content.data.access_token },
        on : {
          200: profile_response,
          response: function(r) { console.log.apply(console, ['AUTH FAILURE',r.content.data].concat(arguments) ); } } })
    }

    function profile_response( response ) {
      req.session = req.session || {};
      for ( var item in response.content.data )
        req.session[item] = response.content.data[item];
      res.redirect( next_uri );
    }
  }
});

app.get('/google_login', function(req,res) {
  params = [['response_type','code'],
    ['client_id',config.google_client_id],
    ['redirect_uri', config.google_redirect_uri],
    ['scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'],
    ['state',(req.session||{}).preauth_destination || '/' ]]
    .map( function(a) { return a.map(encodeURIComponent).join('=') }).join('&');
  return res.redirect( 'https://accounts.google.com/o/oauth2/auth?'+params)
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