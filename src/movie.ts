import EventEmitter from 'eventemitter3';
import { Scene } from './types';

interface Timer {
    fn: () => any;
    timeout: number;
    start: number;
    id: number;
}

export interface MovieOptions {
    /** Delay before starting scene playback */
    beforeDelay: number;
    /** Delay after finishing scene playback */
    afterDelay: number;
}

interface InitialState {
    value: string;
    cursor: CodeMirror.Position;
    readOnly: boolean | string;
}

export const enum PlaybackState {
    Idle = 'idle',
    Play = 'play',
    Pause = 'pause'
}

export interface MovieEvents {
    play: [];
    pause: [];
    resume: [];
    stop: [];
    scene: [number];
}

export default class Movie extends EventEmitter<MovieEvents> {
    public state: PlaybackState = PlaybackState.Idle;
    public options: MovieOptions;
    private ix = 0;
    private initial: InitialState;
    private timer: Timer | null = null;

    constructor(public scenes: Scene[], public editor: CodeMirror.Editor, opt?: Partial<MovieOptions>) {
        super();
        this.options = {
            beforeDelay: 1000,
            afterDelay: 1000,
            ...opt
        };
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
        if (this.state === PlaybackState.Play) {
            // already playing
            return;
        }

        if (this.state === PlaybackState.Pause) {
            this.state = PlaybackState.Play;
            this.editor.focus();

            // Restore timer
            if (this.timer) {
                const { timeout, start } = this.timer;
                const delta = Date.now() - start;
                // In paused state timer still spends time: check if we should wait
                // or continue immediately
                if (delta >= this.timer.timeout) {
                    this.timer.fn();
                } else {
                    runTimer(this.timer, timeout - delta);
                }
            }
            this.emit('resume');
            return;
        } else if (this.state === PlaybackState.Idle) {
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

                this.emit('scene', this.ix);
                const scene = this.scenes[this.ix++];

                if (typeof scene === 'function') {
                    scene(this.editor, next, timer);
                } else {
                    throw new Error(`Scene ${this.ix} is not a function`);
                }
            };

            this.state = PlaybackState.Play;
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
        this.state = PlaybackState.Pause;
        if (this.timer) {
            pauseTimer(this.timer);
        }
        this.emit('pause');
    }

    /**
	 * Stops playback of current scenario
	 */
    stop() {
        if (this.state !== PlaybackState.Idle) {
            this.state = PlaybackState.Idle;
            this.unlock();
            if (this.timer) {
                stopTimer(this.timer);
                this.timer = null;
            }
            this.emit('stop');
        }
    }

    /**
	 * Toggle playback of movie scenario
	 */
    toggle() {
        if (this.state === PlaybackState.Play) {
            this.pause();
        } else {
            this.play();
        }
    }

    private requestTimer(fn: () => any, delay: number) {
        if (this.timer) {
            throw new Error('Unable to create timer since another timer is currently running');
        }

        this.timer = createTimer(() => {
            this.timer = null;
            fn();
        }, delay);

        if (this.state === PlaybackState.Play) {
            runTimer(this.timer);
        }
    }

    /**
     * Revers editor to it’s initial state
     */
    private revert() {
        this.editor.operation(() => {
            this.editor.setValue(this.initial.value);
            this.editor.setCursor(this.initial.cursor);
        });
    }

    /**
     * Prevents user from interacting with editor
     */
    private lock() {
        const { editor } = this;
        this.initial.readOnly = editor.getOption('readOnly');
        editor.setOption('readOnly', true);
        editor.on('keydown', stopEvent);
        editor.on('mousedown', stopEvent);
    }

    /**
     * Unlocks user interaction with editor
     */
    private unlock() {
        const { editor } = this;
        editor.setOption('readOnly', this.initial.readOnly);
        editor.off('keydown', stopEvent);
        editor.off('mousedown', stopEvent);
    }
}

/**
 * Creates new timer object
 */
function createTimer(fn: () => any, timeout: number): Timer {
    return { fn, timeout, start: Date.now(), id: 0 };
}

/**
 * Runs given timer
 */
function runTimer(timer: Timer, timeout = timer.timeout) {
    timer.id = window.setTimeout(timer.fn, timeout);
}

/**
 * Stops given timer
 */
function stopTimer(timer: Timer) {
    clearTimeout(timer.id);
}

/**
 * Pauses given timer
 */
function pauseTimer(timer: Timer) {
    clearTimeout(timer.id);
    timer.id = 0;
}

function stopEvent(editor: CodeMirror.Editor, event: Event) {
    event.preventDefault();
}
