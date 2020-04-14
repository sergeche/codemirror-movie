# CodeMirror Movie

A plugin for CodeMirror editor for creating code demos as on [Emmet Documentation](http://docs.emmet.io) web-site.

## Installation

Install it as a regular npm package:

```sh
npm i codemirror-movie
```

## How to use

To create a presentation movie, you should create a _scenario_ with _scenes_, where each scene represents single action like typing text, displaying tooltip and so on:


```js
import CodeMirror from 'codemirror';
import createMovie from 'codemirror-movie';

// Create editor instance
const editor = CodeMirror.fromTextArea('code');

// Create a movie
const movie = createMovie(editor, scene => [
    scene.type('Hello world'),
    scene.wait(1000),
    scene.tooltip('Sample tooltip'),
    scene.wait(600),
    scene.run('goWordLeft', { times: 2 })
]);

// Now you can play, pause and stop (revert to initial state) movie
movie.play();
```

For a complete example, check out [./example](./example) folder.

## Predefined scenes

When you create a movie, you pass editor instance and a function, which should return an array of scenes. CodeMirror Movie comes with a number of predefined scenes, which are available as methods of a factory function.

### `type(text: string, options?)`
Types-in specified text, starting at current caret position, character-by-character.

Options:

* `delay` (number): delay between character typing, milliseconds. Default is 60.
* `pos` ([Position](#position-object)): initial position where to start typing.

### `wait(timeout: number)`
Wait for a `timeout` milliseconds and advanes to next scene.

### `moveTo(pos: Position, options?)`
Moves cursor to given [position](#position-object). By default, this action calculates optimal horizontal and vertical offsets and moves caret in “natural” manner, as user would do, character-by-character.

Options:

* `delay` (number): delay between caret movements, milliseconds. Setting this option to `0` will move caret immediately to designated position.
* `afterDelay` (number): delay after movement is complete, before advancing to next scene.

### `jumpTo(pos: Position)`

Alias to `moveTo` scene with `delay: 0` option.

### `run(command: string, options?)`

Executes given [CodeMirror command](https://codemirror.net/doc/manual.html#commands).

Options:

* `delay` (number): delay before actual command execution, milliseconds. Default is `500`.
* `times` (number): how many times the command should be executed. Defaults to `1`. Each command call is delayed with `delay` timeout.

### `select(to: Position, from?: Position)`
Selects text in `from:to` range. By default, `from` is a current cursor position. Both `from` and `to` are [Position](#position-object) objects.

### `tooltip(text: string | HTMLElement, options?)`

Displays tooltip with given text (or given DOM element), waits for a specified timeout and automatically hides it.

Options:

* `wait` (number): Number of milliseconds to wait before hiding tooltip.
* `pos` ([Position](#position-object)): position where tooltip should be displayed. Default is current caret position.
* `alignX` (`left` | `center` | `right`): horizontal alignment of tooltip, relative to `pos`. Default is `center`.
* `alignY` (`above` | `below`): vertical alignment of tooltip, relative, to `pos`: display it either above or below specified position. Default is `above`.
* `baseClass` (string): base class name for constructing tooltip UI. Default tooltip is a `<div>` with `baseClass` class name, which contains `${baseClass}-content` and `${baseClass}-tail` elements.
* `animationShow` (string): value for `animation` CSS property. If given, applies value to `animation` CSS property right after tooltip is attached and waits until CSS animation is completed. You can specify animation as described in [CSS animation](https://developer.mozilla.org/en-US/docs/Web/CSS/animation) spec, e.g. animation name, delay, duration etc. Example: `scene.tooltip('Hello world', { animationShow: 'show-tooltip 0.2s ease-out' })`.
* `animationHide` (string): same as `animationShow` but for hiding tooltip.

*Important: if you use `animationShow` and/or `animationHide` options for tooltip, you _must_ define CSS animations with names used, otherwise tooltip will be stalled!*

### Advanced `tooltip` usage

The `tooltip` scene has several methods that you can use for advanced use cases:

* `tooltip.create(text: string, options?): HTMLElement`: creates tooltip element.
* `tooltip.show(elem: HTMLElement, options?)`: displays given tooltip element.
* `tooltip.hide(elem: HTMLElement, options?)`: hides given tooltip element.

For example, if you want to show tooltip, run some actions and then hide it, you movie might look like this:

```js
const movie = createMovie(editor, scene => {
    const tooltip = scene.tooltip.create('Hello world');

    return [
        // Show created tooltip
        scene.tooltip.show(tooltip, {
            animationShow: 'my-anim 0.3s',
            alignX: 'left'
        }),
        scene.run('selectWordLeft', { times: 2 }),
        scene.wait(1000),
        // Hide tooltip
        scene.tooltip.hide(tooltip, {
            animationHide: 'my-anim 0.3s reverse'
        })
    ];
});
```

## Creating custom scenes

Each scene is just a function with the following arguments:

* `editor`: current CodeMirror editor instance.
* `next()`: a function that _must_ be invoked when scene is finished; advances to next scene in scenario.
* `timer(callback, timeout)`: function for creating timeouts. Same as `setTimeout()` but works with current movie playback state. If user pauses playback, timer will be paused as well and resumed when playback continues.

Example of custom scene:

```js
const movie = createMovie(editor, scene => {
    return [
        scene.type('Hello world'),
        // Custom scene: select word then replace it
        (editor, next, timer) => {
            editor.setSelection(
                { line: 0, ch: 6 },
                { line: 0, ch: 11 }
            );
            // Wait a bit
            timer(() => {
                // ...and insert new content
                editor.replaceRange('planet',
                    { line: 0, ch: 6 },
                    { line: 0, ch: 11 });

                // Finish scene, go to next one
                next();
            }, 200);
        },
        scene.wait(1000)
    ];
});
```

## Position object

Some actions can accept `Position` object which can contain one of the following value:

* `'cursor'` (string): current caret position.
* `number`: character index in text editor.
* `{line: number, ch: number}` (object): object used in CodeMirror for describing positions.

## Movie API

The movie instance created with `createMovie()` has the following methods:

* `play()`: start movie playback.
* `pause()`: pause movie playback. The playback can be resumed with `play()` method.
* `stop()`: stop playback and reset editor content to its initial state (when movie was created).
* `toggle()`: toggle playback (play/pause).
* `state` — current playback state: `idle`, `play`, `pause`.
* `on(event, callback)`: subscribe to given `event`.
* `off(event, callback)`: unsubscribe from given `event`.

### Events

The movie emits a number of events which you can subscribe and unsubscribe with `on(event, callback)` and `off(event, callback)` methods:

* `play`: movie playback was started;
* `pause`: movie playback was paused.
* `resume`: movie playback was resumed from paused state.
* `stop`: movie playback was stopped.
* `scene`: emitted when movie advances to the next scene The `callback` receives an scene index as argument.

