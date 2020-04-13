/**
 * Function that creates timer for delayed
 * execution. This timer will automatically delay execution when
 * scenario is paused and revert when played again
 */
export type TimerFn = (fn: () => void, delay: number) => void;

/**
 * Describes a single scene in a movie scenario
 * @param next Function to call when current scene is finished: advance to next one
 * @param timer Function that creates timer for delayed execution. This timer will
 * automatically delay execution when scenario is paused and revert when played
 * again
 */
export type Scene = (editor: CodeMirror.Editor, next: () => void, timer: TimerFn) => void;

/**
 * Describes character location in editor. Number is a character index, string
 * is a `line:ch` alias of `CodeMirror.Position` or `cursor`, which is current
 * cursor position.
 */
export type Pos = number | string | CodeMirror.Position;
