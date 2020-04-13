import * as scene from './scene';
import Scenario, { ScenarioOptions } from './scenario';
import { Scene } from './types';

type ScenarioFactory = (scene: typeof import('./scene')) => Scene[];

export default function movie(editor: CodeMirror.Editor, factory: ScenarioFactory, options?: Partial<ScenarioOptions>): Scenario {
    const scenes = factory(scene);
    return new Scenario(scenes, editor, options);
}
