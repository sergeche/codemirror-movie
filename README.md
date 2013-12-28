# CodeMirror Movie

A plugin for CodeMirror editor for creating interactive code demos. See [Emmet Documentation](http://docs.emmet.io) web-site for examples.

## Dependencies

* [CodeMirror](http://codemirror.net) 2.x or 3.x
* [Underscore.js](http://underscorejs.org) 1.3.x or later

## How to use

There are three easy steps to add CodeMirror Movie into your editor:

* Add [`cm-movie.css` and `cm-movie-full.js`](https://github.com/sergeche/codemirror-movie/blob/master/dist/) files into your page. The JS file must be added _after_ CodeMirror main file since it extends `CodeMirror` object. If you’re using your own Underscore.js library, you can add `cm-move.js` file instead.

* In `<textarea>` to be converted into CodeMirror editor, add the initial content of the editor and _movie scenario_, separated by `@@@`. Use `|` character to indicate initial caret position:

---
```html
<textarea id="code">
&lt;!doctype html&gt;
&lt;html lang="en"&gt;
&lt;body&gt;
	|
&lt;/body&gt;
&lt;/html&gt;
@@@
type: Hello world
wait: 1000
tooltip: Sample tooltip
</textarea>
```
    
* Initiate movie with JavaScript:

```javascript
// pass textarea ID or textarea itself to CodeMirror.movie
var movie = CodeMirror.movie('code');

// start playback
movie.play();
```

Look at [full example](/dist/index.html) for more info.

## Movie commands

Movie scenario is defined by a series of _commands_ to be performed. Commands tell movie what to do, for example: “type something, wait for a second and show a tooltip”. Commands are described by a simple `name: value` pair, each command must be written on its own line.

Every command can accept a number of options as JS object. By default, each command has good defaults and can accept only one, the most important option (marked as **bold** in the reference below). So, for example, `type: Hello world` and `type: {text: "Hello world"}` commands are equal.

### Available commands ###

#### type ####

Types specified text, starting at current caret position, character-by-character.

Options:

* **`text`** (String): text to type
* `delay` (Number): delay between character typing, milliseconds. Default is 60.
* `pos` (Position): initial position where to start typing (see “[Position object](#position-object)” below for description).

#### wait ####

Wait for a specified amount of time and executes next command

* **`timeout`** (Number): wait timeout, milliseconds.

#### moveTo ####

Moves caret to given position. By default, this action calculates optimal horizontal and vertical offsets and moves caret in “natural” manner, character-by-character.

* **`pos`** (Position): designated caret position (see “[Position object](#position-object)” below for description).
* `delay` (Number): delay between caret movements, milliseconds. Setting this option to `0` will move caret immediately to designated position.

#### jumpTo ####

Alias to `moveTo` command with `delay: 0` option.

#### run ####

Performs given [CodeMirror command](https://github.com/marijnh/CodeMirror/blob/v3.0/lib/codemirror.js#L2938).

* **`command`** (String): command name to execute.
* `beforeDelay` (Number): delay before actual command execution, milliseconds. Default is `500`, which improves user experience.
* `times` (Number): how many times the command should be executed. Defaults to `1`. Each command call is delayed with `beforeDelay` milliseconds.

#### select ####

* **`to`** (Position): the selection end (see “[Position object](#position-object)” below for description).
* `from` (Position): the selection start. Defaults to current caret position.

#### tooltip ####

Displays tooltip with given text, waits for a specified delay and automatically hides it.

* **`text`** (String): tooltip text, may contain HTML.
* `wait` (Number): Number of milliseconds to wait before hiding tooltip.
* `pos` (Position): position where tooltip should be displayed  (see “[Position object](#position-object)” below for description). Default to current caret position.

#### showTooltip ####

The same as `tooltip` command, but doesn’t hide tooltip, explicitly call `hideTooltip` command to do so. You should use these commands in cases when you want to display a tooltip, execute some other commands and then hide tooltip.

#### prompt ####

Emulates prompt dialog: shows input box and types “user input” character-by-character.

* **`text`** (String): required “user input”.
* `title` (String): prompt dialog title, default is “Enter something”.
* `delay` (Number): delay between character typing, milliseconds. Default is `80`.
* `typeDelay` (Number): delay before actual input typing, milliseconds. Default is `1000`.
* `hideDelay` (Number): delay before hiding prompt dialog, milliseconds. Default is `2000`.

### Position object ###

Some actions can accept `Position` object which can contain one of the following value:

* `Number` – character index in text editor.
* `line:char` (String) — line and character-in-line indexes (starting from 0).
* `caret` (String) — current caret position.

## Passing CodeMirror options

To pass CodeMirror editor options (like syntax name), simply add `data-cm-*` attributes to `<textarea>` source element. For example, to set CSS syntax highlighting, your textarea may look like this:

	<textarea data-cm-mode="text/css">


## Outline ##

The movie outline is a sidebar with some useful hints about movie key points. Every time a specified movie command runs, the corresponding outline item is highlighted.

To add outline, simply put `:::` separator and outline item content after required movie command:

    type: Hello world ::: Typing “Hello world”

## Movie API ##

The movie instance created with `CodeMirror.movie()` has the following methods:

* `play()` — starts movie playback.
* `pause()` — pauses movie. The playback can be resumed with `play()` method.
* `stop()` — stops playback and resets editor content to initial state.
* `toggle()` — toggles playback (play/pause).
* `state()` — returns current playback state: `idle`, `play`, `pause`.

### Events ###

CodeMirror Movie uses [Backbone.Events](http://backbonejs.org/#Events) for events subscription and dispatching. Available events:

* `play` — movie playback was started.
* `pause` — movie playback was paused.
* `resume` — movie playback was resumed from paused state.
* `stop` — movie playback was stopped.
* `action` — invoked when movie command was executed. The callback receives an action index as argument.

## Building ##

The project uses [Grunt.js](http://gruntjs.com) for building. To build project, run the following command in project’s root folder:

    npm install && grunt

The compiled files will appear in `./dist/` folder.
