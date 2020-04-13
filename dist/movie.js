var CodeMirrorMovie = (function () {
    'use strict';

    /**
     * Helper function that produces <code>{line, ch}</code> object from
     * passed argument
     */
    function makePos(pos, editor) {
        if (pos === 'caret') {
            return editor.getCursor();
        }
        if (typeof pos === 'string') {
            if (pos.includes(':')) {
                const [line, ch] = pos.split(':').map(Number);
                return { line, ch };
            }
            pos = Number(pos);
        }
        if (typeof pos === 'number') {
            return editor.posFromIndex(pos);
        }
        return pos;
    }
    /**
     * Renders string into DOM element
     */
    function toDOM(str) {
        var div = document.createElement('div');
        div.innerHTML = str;
        return div.firstChild;
    }

    const tooltipWidget = Object.assign(tooltip, { show, hide, create });
    /**
     * Shows tooltip with given text, wait for `options.wait` milliseconds and then
     * hides tooltip
     */
    function tooltip(text, opt) {
        const options = createOptions(opt);
        const elem = typeof text === 'string'
            ? create(text, options)
            : text;
        return function tooltipScene(editor, next, timer) {
            const showScene = show(elem, opt);
            const hideScene = hide(elem, opt);
            showScene(editor, () => {
                timer(() => {
                    hideScene(editor, next, timer);
                }, options.wait);
            }, timer);
        };
    }
    /**
     * Displays given tooltip in editor. This tooltip should be explicitly
     * hidden with `hide` action
     */
    function show(tooltip, opt) {
        const options = createOptions(opt);
        return function showTooltipScene(editor, next) {
            attach(tooltip, editor, options);
            animate(tooltip, options.animationShow, next);
        };
    }
    /**
     * Hides given tooltip, previously displayed by `show` action
     */
    function hide(tooltip, opt) {
        const options = createOptions(opt);
        return function hideTooltipScene(editor, next) {
            animate(tooltip, options.animationHide, () => {
                tooltip.remove();
                next();
            });
        };
    }
    /**
     * Constructs tooltip UI
     */
    function create(text, opt) {
        const { baseClass } = createOptions(opt);
        return toDOM(`<div class="${baseClass}">
        <div class="${baseClass}-content">${text}</div>
        <div class="${baseClass}-tail"></div>
    </div>`);
    }
    /**
     * Applies given CSS animation to `elem` and waits until in finishes.
     * Calls `next` when animation is finished
     */
    function animate(elem, animation, next) {
        if (!animation) {
            return next();
        }
        const prevAnimation = elem.style.animation;
        elem.style.animation = animation;
        const complete = (evt) => {
            if (animation.includes(evt.animationName)) {
                elem.removeEventListener('animationend', complete);
                elem.removeEventListener('animationcancel', complete);
                elem.style.animation = prevAnimation;
                next();
            }
        };
        elem.addEventListener('animationend', complete);
        elem.addEventListener('animationcancel', complete);
    }
    function attach(tooltip, editor, options) {
        const pt = makePos(options.pos, editor);
        const px = editor.cursorCoords(pt, 'local');
        const { alignX, alignY } = options;
        editor.addWidget(pt, tooltip, false);
        const { offsetWidth, offsetHeight } = tooltip;
        if (alignX === 'center') {
            tooltip.style.left = `${px.left - offsetWidth / 2}px`;
        }
        else if (alignX === 'right') {
            tooltip.style.left = `${px.left - offsetWidth}px`;
        }
        if (alignY === 'above') {
            tooltip.style.top = `${px.top - offsetHeight}px`;
        }
        return tooltip;
    }
    function createOptions(opt) {
        return Object.assign({ wait: 4000, pos: 'caret', alignX: 'center', alignY: 'above', baseClass: 'cmm-tooltip' }, opt);
    }

    /**
     * Type-in passed text into current editor char-by-char
     */
    function type(text, opt) {
        const options = Object.assign({ delay: 60, pos: 'cursor' }, opt);
        return function typeScene(editor, next, timer) {
            if (text == null) {
                return next();
            }
            if (options.pos !== 'cursor') {
                editor.setCursor(makePos(options.pos, editor));
            }
            const chars = String(text).split('');
            timer(function perform() {
                var ch = chars.shift();
                editor.replaceSelection(ch, 'end');
                if (chars.length) {
                    timer(perform, options.delay);
                }
                else {
                    next();
                }
            }, options.delay);
        };
    }
    /**
     * Wait for a specified timeout, in ms, and moves to next scene
     */
    function wait(timeout) {
        return function waitScene(editor, next, timer) {
            timer(next, timeout);
        };
    }
    /**
     * Move caret to a specified position
     */
    function moveTo(pos, opt) {
        const options = Object.assign({ delay: 90, afterDelay: 0 }, opt);
        return function moveToScene(editor, next, timer) {
            const targetPos = makePos(pos, editor);
            let curPos = editor.getCursor();
            if (!options.delay) {
                editor.setCursor(targetPos);
                return next();
            }
            const deltaLine = targetPos.line - curPos.line;
            const deltaChar = targetPos.ch - curPos.ch;
            const stepLine = deltaLine < 0 ? -1 : 1;
            const stepChar = deltaChar < 0 ? -1 : 1;
            let steps = Math.max(deltaChar, deltaLine);
            // reset selection, if exists
            editor.setSelection(curPos, curPos);
            timer(function perform() {
                curPos = editor.getCursor();
                if (steps > 0 && !(curPos.line == targetPos.line && curPos.ch == targetPos.ch)) {
                    if (curPos.line != targetPos.line) {
                        curPos.line += stepLine;
                    }
                    if (curPos.ch != targetPos.ch) {
                        curPos.ch += stepChar;
                    }
                    editor.setCursor(curPos);
                    steps--;
                    timer(perform, options.delay);
                }
                else {
                    editor.setCursor(targetPos);
                    if (options.afterDelay) {
                        timer(next, options.afterDelay);
                    }
                    else {
                        next();
                    }
                }
            }, options.delay);
        };
    }
    /**
     * Shortcut for `moveTo` scene but with immediate cursor position update
     */
    function jumpTo(pos, opt) {
        return moveTo(pos, Object.assign({ delay: 0, afterDelay: 200 }, opt));
    }
    function run(command, opt) {
        const options = Object.assign({ delay: 500, times: 1 }, opt);
        return function runScene(editor, next, timer) {
            let count = 0;
            if (options.times <= 0) {
                return next();
            }
            timer(function perform() {
                count++;
                if (typeof command === 'function') {
                    command(editor, count);
                }
                else {
                    editor.execCommand(command);
                }
                if (count < options.times) {
                    timer(perform, options.delay);
                }
                else {
                    next();
                }
            }, options.delay);
        };
    }

    var scene = /*#__PURE__*/Object.freeze({
        __proto__: null,
        type: type,
        wait: wait,
        moveTo: moveTo,
        jumpTo: jumpTo,
        run: run,
        tooltip: tooltipWidget
    });

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var eventemitter3 = createCommonjsModule(function (module) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Add a listener for a given event.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} once Specify if the listener is a one-time listener.
     * @returns {EventEmitter}
     * @private
     */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }

      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;

      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];

      return emitter;
    }

    /**
     * Clear event by name.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} evt The Event name.
     * @private
     */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];

      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }

      return ee;
    };

    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];

      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    {
      module.exports = EventEmitter;
    }
    });

    class Scenario extends eventemitter3 {
        constructor(scenes, editor, opt) {
            super();
            this.scenes = scenes;
            this.editor = editor;
            this.state = "idle" /* Idle */;
            this.ix = 0;
            this.timer = null;
            this.options = Object.assign({ beforeDelay: 1000, afterDelay: 1000 }, opt);
            this.initial = {
                value: editor.getValue(),
                cursor: editor.getCursor(),
                readOnly: editor.getOption('readOnly')
            };
        }
        /**
         * Play current scenario
         */
        play() {
            if (this.state === "play" /* Play */) {
                // already playing
                return;
            }
            if (this.state === "pause" /* Pause */) {
                this.state = "play" /* Play */;
                this.editor.focus();
                // Restore timer
                if (this.timer) {
                    const { timeout, start } = this.timer;
                    const delta = Date.now() - start;
                    // In paused state timer still spends time: check if we should wait
                    // or continue immediately
                    if (delta >= this.timer.timeout) {
                        this.timer.fn();
                    }
                    else {
                        runTimer(this.timer, timeout - delta);
                    }
                }
                this.emit('resume');
                return;
            }
            else if (this.state === "idle" /* Idle */) {
                const { editor } = this;
                this.revert();
                this.lock();
                editor.focus();
                var timer = this.requestTimer.bind(this);
                this.ix = 0;
                const next = () => {
                    if (this.ix >= this.scenes.length) {
                        return timer(() => this.stop(), this.options.afterDelay);
                    }
                    this.emit('action', this.ix);
                    const scene = this.scenes[this.ix++];
                    if (typeof scene === 'function') {
                        scene(this.editor, next, timer);
                    }
                    else {
                        throw new Error(`Scene ${this.ix} is not a function`);
                    }
                };
                this.state = "play" /* Play */;
                this.editor.setOption('readOnly', true);
                this.emit('play');
                timer(next, this.options.beforeDelay);
            }
        }
        /**
         * Pause current scenario playback. It can be restored with
         * `play()` method call
         */
        pause() {
            this.state = "pause" /* Pause */;
            if (this.timer) {
                pauseTimer(this.timer);
            }
            this.emit('pause');
        }
        /**
         * Stops playback of current scenario
         */
        stop() {
            if (this.state !== "idle" /* Idle */) {
                this.state = "idle" /* Idle */;
                this.unlock();
                this.emit('stop');
            }
        }
        /**
         * Toggle playback of movie scenario
         */
        toggle() {
            if (this.state === "play" /* Play */) {
                this.pause();
            }
            else {
                this.play();
            }
        }
        requestTimer(fn, delay) {
            if (this.timer) {
                throw new Error('Unable to create timer since another timer is currently running');
            }
            this.timer = createTimer(() => {
                this.timer = null;
                fn();
            }, delay);
            if (this.state === "play" /* Play */) {
                runTimer(this.timer);
            }
        }
        /**
         * Revers editor to it’s initial state
         */
        revert() {
            this.editor.operation(() => {
                this.editor.setValue(this.initial.value);
                this.editor.setCursor(this.initial.cursor);
            });
        }
        /**
         * Prevents user from interacting with editor
         */
        lock() {
            const { editor } = this;
            this.initial.readOnly = editor.getOption('readOnly');
            editor.setOption('readOnly', true);
            editor.on('keydown', stopEvent);
            editor.on('mousedown', stopEvent);
        }
        /**
         * Unlocks user interaction with editor
         */
        unlock() {
            const { editor } = this;
            editor.setOption('readOnly', this.initial.readOnly);
            editor.off('keydown', stopEvent);
            editor.off('mousedown', stopEvent);
        }
    }
    /**
     * Creates new timer object
     */
    function createTimer(fn, timeout) {
        return { fn, timeout, start: Date.now(), id: 0 };
    }
    /**
     * Runs given timer
     */
    function runTimer(timer, timeout = timer.timeout) {
        timer.id = window.setTimeout(timer.fn, timer.timeout);
    }
    /**
     * Pauses given timer
     */
    function pauseTimer(timer) {
        clearTimeout(timer.id);
        timer.id = 0;
    }
    function stopEvent(editor, event) {
        event.preventDefault();
    }

    function movie(editor, factory, options) {
        const scenes = factory(scene);
        return new Scenario(scenes, editor, options);
    }

    return movie;

}());
//# sourceMappingURL=movie.js.map
