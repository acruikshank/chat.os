var fs = require('fs');
var path = require('path');
var messages = require("../lib/messages");

var upgrades, docstubs;

var stubsDir = process.argv[process.argv.length-2];
var room = process.argv[process.argv.length-1];

messages.find({type:'upgrade',room:room}, withUpgrades);

function withUpgrades( err, _upgrades ) {
  upgrades = _upgrades;
  fs.readdir(stubsDir, withDocstubs);
}

function withDocstubs( err, _docstubs ) {
  docstubs = _docstubs;
  readDoc();
}

function readDoc() {
  if ( ! docstubs.length )
    return process.exit();
  fs.readFile( path.join(stubsDir,docstubs[0]), 'utf-8', writeDoc );
}

function writeDoc( err, file ) {
  if ( err ) {
    console.error(err);
    process.exit();
  }

  var upgrade = upgrades.filter(function(u) { return u.name==docstubs[0].match(/^(.*)\.md/)[1] })[0];

  if ( ! upgrade ) return next();

  var clean = {};
  for ( var key in upgrade ) 
    if ( ! (key in {_id:1,upgrade:1,from:1,timestamp:1,room:1}) ) clean[key] = upgrade[key];

  var source = [
    "## Command",
    "```",
    ':upgrade ' + JSON.stringify(clean),
    "```" ];
  if ( clean.markup ) source = source.concat( [
    "",
    "## Markup",
    "```html",
    clean.markup,
    "```" ] );
  if ( clean.style ) source = source.concat( [
    "",
    "## Style",
    "```css",
    clean.style,
    "```" ] );
  if ( clean.script ) source = source.concat( [
    "",
    "## Script",
    "```javascript",
    clean.script.replace(/ /g,' '),
    "```" ] );

  console.log( "writing", docstubs[0] );  
  fs.writeFile( 'example_upgrades/'+docstubs[0], file+'\n'+source.join('\n'), 'utf-8', next);
}

function next() {
  docstubs = docstubs.slice(1);
  readDoc();  
}
