import * as scene from './scene';
import Movie, { MovieOptions } from './movie';
import { Scene } from './types';

type ScenarioFactory = (scene: typeof import('./scene')) => Scene[];

export default function movie(editor: CodeMirror.Editor, factory: ScenarioFactory, options?: Partial<MovieOptions>): Movie {
    const scenes = factory(scene);
    return new Movie(scenes, editor, options);
}
