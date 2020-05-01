import { Pos, Scene } from '../types';
import { toDOM, makePos } from '../utils';

interface SceneTooltip {
    (text: string | HTMLElement, opt?: Partial<SceneTooltipOptions>): Scene;

    /** Creates new tooltip instance */
    create(text: string, opt?: Partial<SceneTooltipOptions>): HTMLElement,

    /** Displays given tooltip in editor */
    show(tooltip: HTMLElement, opt?: Partial<SceneTooltipOptions>): void,

    /** Hides given tooltip in editor */
    hide(tooltip: HTMLElement, opt?: Partial<SceneTooltipOptions>): void
}

export interface SceneTooltipOptions {
    /** Time to wait before hiding tooltip, ms */
    wait: number;

    /** Position where tooltip should point to */
    pos: Pos;

    /** Horizontal alignment of tooltip relative to cursor location */
    alignX?: 'left' | 'center' | 'right';

    /** Vertical alignment of tooltip relative to cursor location*/
    alignY?: 'above' | 'below';

    /** Case class name for building tooltip UI */
    baseClass: string;

    /** CSS animation value for displaying tooltip */
    animationShow?: string;

    /** CSS animation value for hiding tooltip */
    animationHide?: string;

    /**
     * Method for attaching tooltip to editor: should mount element into DOM.
     * If not specified, a default `editor.addWidget()` is used.
     */
    attach?: (editor: CodeMirror.Editor, tooltip: HTMLElement, pos: CodeMirror.Position, options: SceneTooltipOptions) => void;
}

const tooltipWidget: SceneTooltip = Object.assign(tooltip, { show, hide, create });

export default tooltipWidget;

/**
 * Shows tooltip with given text, wait for `options.wait` milliseconds and then
 * hides tooltip
 */
function tooltip(text: string | HTMLElement, opt?: Partial<SceneTooltipOptions>): Scene {
    const options = createOptions(opt);

    const elem: HTMLElement = typeof text === 'string'
        ? create(text, options)
        : text;

    const tooltipScene: Scene = (editor, next, timer) => {
        const showScene = show(elem, opt);
        const hideScene = hide(elem, opt);
        showScene(editor, () => {
            timer(() => {
                hideScene(editor, next, timer);
            }, options.wait);
        }, timer);
    };

    tooltipScene.dispose = () => elem.remove();
    return tooltipScene;
}

/**
 * Displays given tooltip in editor. This tooltip should be explicitly
 * hidden with `hide` action
 */
function show(tooltip: HTMLElement, opt?: Partial<SceneTooltipOptions>): Scene {
    const options = createOptions(opt);
    const showTooltipScene: Scene = (editor, next) => {
        attach(tooltip, editor, options);
        animate(tooltip, options.animationShow, next);
    };
    showTooltipScene.dispose = () => tooltip.remove();
    return showTooltipScene;
}

/**
 * Hides given tooltip, previously displayed by `show` action
 */
function hide(tooltip: HTMLElement, opt?: Partial<SceneTooltipOptions>): Scene {
    const options = createOptions(opt);
    return function hideTooltipScene(editor, next) {
        animate(tooltip, options.animationHide, () => {
            tooltip.remove();
            next();
        });
    }
}

/**
 * Constructs tooltip UI
 */
function create(text: string, opt?: Partial<SceneTooltipOptions>): HTMLElement {
    const { baseClass, alignX, alignY } = createOptions(opt);
    return toDOM(`<div class="${baseClass}" data-align-x="${alignX}" data-align-y="${alignY}">
        <div class="${baseClass}-content">${text}</div>
        <div class="${baseClass}-tail"></div>
    </div>`) as HTMLElement;
}

/**
 * Applies given CSS animation to `elem` and waits until in finishes.
 * Calls `next` when animation is finished
 */
function animate(elem: HTMLElement, animation: string | undefined, next: () => void) {
    if (!animation) {
        return next();
    }

    const prevAnimation = elem.style.animation;
    elem.style.animation = animation;

    const complete = (evt: AnimationEvent) => {
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

function attach(tooltip: HTMLElement, editor: CodeMirror.Editor, options: SceneTooltipOptions): HTMLElement {
    const pt = makePos(options.pos, editor);

    const { alignX, alignY, attach } = options;
    if (attach) {
        attach(editor, tooltip, pt, options);
    } else {
        const px = editor.cursorCoords(pt, 'local');
        editor.addWidget(pt, tooltip, false);
        const { offsetWidth, offsetHeight } = tooltip;
        if (alignX === 'center') {
            tooltip.style.left = `${px.left - offsetWidth / 2}px`;
        } else if (alignX === 'right') {
            tooltip.style.left = `${px.left - offsetWidth}px`;
        }

        if (alignY === 'above') {
            tooltip.style.top = `${px.top - offsetHeight}px`;
        }
    }

    return tooltip;
}

function createOptions(opt?: Partial<SceneTooltipOptions>): SceneTooltipOptions {
    return {
        wait: 4000,
        pos: 'caret',
        alignX: 'center',
        alignY: 'above',
        baseClass: 'cmm-tooltip',
        ...opt
    };
}
