# upgrade_documentation.js

This a little utility that generates upgrade documentation in the format found in the example_upgrades directory.

Usage
=====
```
node scripts/upgrade_documentation.js [stub_dir] [room]
```
where `stub-dir` is the path to a directory containing your document stubs and `room` is the name of a chat.os room that contains the upgrades.

The document stubs are markdown files that supply the help text at the beginning of the documentation file. This script will attempt to match the file name of the stub to an upgrade in the room. If found, it will append some rendered documentation to the stub and save it to the example_upgrades directory.

Example
=======
Say you have a chat.os room named "dog", and it contains an upgrade named "fish" that you would like to document. First you create a 'stubs' directory, then you save a fish.md file within it. The file should look something like this:

<pre>
# fish

This upgrade shows a picture of a fish
:fish red
will show a picture of a red fish.

This upgrade depends on the 'cat' and 'horse' upgrade.
</pre>

Then, from the chat.os server root, type:
```
node scripts/upgrade_documentation.js stubs dog
```
