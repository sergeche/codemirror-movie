import { Scene, Pos } from './types';
import { makePos } from './utils';

interface SceneTypeOptions {
    /** Delay between character typing, in ms */
    delay: number;

    /** Initial position where to start typing. Default is 'cursor' */
    pos: Pos;
}

interface SceneMoveToOptions {
    /** Delay before actual movement. Use `0` to immediately just to given position */
    delay: number;

    /** Delay after movement, before advancing to next scene */
    afterDelay: number;
}

interface SceneRunOptions {
    /** Delay before each command execution */
    delay: number;
    /** How many times command should be executed */
    times: number;
}

type CommandFn = (editor: CodeMirror.Editor, time?: number) => void;

export { default as tooltip } from './widgets/tooltip';

/**
 * Type-in passed text into current editor char-by-char
 */
export function type(text: string, opt?: Partial<SceneTypeOptions>): Scene {
    const options: SceneTypeOptions = {
        delay: 60,
        pos: 'cursor',
        ...opt
    };

    return function typeScene(editor, next, timer) {
        if (text == null) {
            return next();
        }

        if (options.pos !== 'cursor') {
            editor.setCursor(makePos(options.pos, editor));
        }

        const chars = String(text).split('');

        timer(function perform() {
            var ch = chars.shift()!;
            editor.replaceSelection(ch, 'end');
            if (chars.length) {
                timer(perform, options.delay);
            } else {
                next();
            }
        }, options.delay);
    };
}

/**
 * Wait for a specified timeout, in ms, and moves to next scene
 */
export function wait(timeout: number): Scene {
    return function waitScene(editor, next, timer) {
        timer(next, timeout);
    }
}

/**
 * Move caret to a specified position
 */
export function moveTo(pos: Pos, opt?: Partial<SceneMoveToOptions>): Scene {
    const options: SceneMoveToOptions = {
        delay: 90,
        afterDelay: 0,
        ...opt
    };

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
            } else {
                editor.setCursor(targetPos);
                if (options.afterDelay) {
                    timer(next, options.afterDelay);
                } else {
                    next();
                }
            }
        }, options.delay);
    }
}

/**
 * Shortcut for `moveTo` scene but with immediate cursor position update
 */
export function jumpTo(pos: Pos, opt?: Partial<SceneMoveToOptions>): Scene {
    return moveTo(pos, {
        delay: 0,
        afterDelay: 200,
        ...opt
    });
}

export function run(command: string | CommandFn, opt?: SceneRunOptions): Scene {
    const options: SceneRunOptions = {
        delay: 500,
        times: 1,
        ...opt
    };

    return function runScene(editor, next, timer) {
        let count = 0;

        if (options.times <= 0) {
            return next();
        }

        timer(function perform() {
            count++;
            if (typeof command === 'function') {
                command(editor, count);
            } else {
                editor.execCommand(command);
            }

            if (count < options.times) {
                timer(perform, options.delay);
            } else {
                next();
            }
        }, options.delay);
    }
}