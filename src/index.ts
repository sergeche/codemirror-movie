import * as scene from './scene';
import MovieClass, { MovieOptions, PlaybackState } from './movie';
import { Scene } from './types';

type ScenarioFactory = (scene: typeof import('./scene')) => Scene[];
type Movie = MovieClass;

export default function movie(editor: CodeMirror.Editor, factory: ScenarioFactory, options?: Partial<MovieOptions>): MovieClass {
    const scenes = factory(scene);
    return new MovieClass(scenes, editor, options);
}

export { Movie, MovieOptions, Scene, PlaybackState }
