export type PetState = 'idle' | 'smoking' | 'speaking' | 'drawing' | 'firing';
export interface Character { id: string; name: string; initialState: PetState; animations: Record<PetState, { frames: string[]; frameDurationMs: number }>; dialogues: Record<string, string[]>; }
const empty = () => ({frames: [], frameDurationMs: 500});
export const akila: Character = { id:'akila', name:'아킬라', initialState:'idle', animations:{idle:empty(), smoking:empty(), speaking:empty(), drawing:empty(), firing:empty()}, dialogues:{testPassed:['코딩 실력은 인정하지. 감탄했다, 오픈AI.'], deploymentComplete:['남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.']} };
