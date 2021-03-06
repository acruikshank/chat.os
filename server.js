var config = require('./config');
var express = require('express');
var sessions = require( "cookie-sessions" );
var app = express.createServer();
var io = require('socket.io').listen(app, {log:false});
var chat = require('./lib/chat').manage(io.sockets);
var db = require('./lib/db');
var rooms = require('./lib/rooms');
var http = require('http');
var Shred = new require('shred');
var shred = new Shred();
var querystring = require('querystring');
var utils = require('connect').utils;


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
  app.use( sessions( { secret:config.session_secret, session_key : '_chatos', timeout: 24*3600000 } ) );
  app.set('view engine','jade');
  app.set('view options',{layout:false});
  app.use( express.bodyParser() );
  app.use(express.static(__dirname+'/public'));
});

// tie socket authentication and identity to session
io.set('authorization', function( handshake, callback ) {
  if ( ! handshake.headers.cookie )
    return callback('Not logged in', false);
  
  var cookies = utils.parseCookie(handshake.headers.cookie);
  if ( ! cookies['_chatos'] )
    return callback('Not logged in', false);

  handshake.identity = sessions.deserialize( config.session_secret, 24*3600000, cookies['_chatos'])
  if ( ! handshake.identity || ! handshake.identity.email )
    return callback('Not logged in', false);

  return callback( null, true );
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
  res.render('chat', {identity:{email:req.session.email, name:req.session.name, picture:req.session.picture}, room:req.room });
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
        response: function(r) { console.log.apply(console, ['TOKEN AUTH FAILURE',r.content.data].concat(arguments) ); } } })

    function token_response( response ) {
      shred.get({
        url:'https://www.googleapis.com/oauth2/v1/userinfo',
        query: { access_token: response.content.data.access_token },
        on : {
          200: profile_response,
          response: function(r) { console.log.apply(console, ['ACCOUNT AUTH FAILURE',r.content.data].concat(arguments) ); } } })
    }

    function profile_response( response ) {
      req.session = req.session || {};

      req.session.name = response.content.data.name;
      req.session.email = response.content.data.email;
      req.session.picture = response.content.data.picture;
      res.redirect( next_uri );
    }
  }
});

app.get('/google_login', function(req,res) {
  params = [['response_type','code'],
    ['client_id',config.google_client_id],
    ['redirect_uri', config.google_redirect_uri],
    ['approval_prompt','force'],
    ['scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'],
    ['state',(req.session||{}).preauth_destination || '/' ]]
    .map( function(a) { return a.map(encodeURIComponent).join('=') }).join('&');
  return res.redirect( 'https://accounts.google.com/o/oauth2/auth?'+params)
});

app.listen( config.port );

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
