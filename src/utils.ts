import { Pos } from './types';

/**
 * Helper function that produces <code>{line, ch}</code> object from
 * passed argument
 */
export function makePos(pos: Pos, editor: CodeMirror.Editor): CodeMirror.Position {
    if (pos === 'caret' || pos === 'cursor') {
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
export function toDOM(str: string): ChildNode {
    var div = document.createElement('div');
    div.innerHTML = str;
    return div.firstChild!;
}
