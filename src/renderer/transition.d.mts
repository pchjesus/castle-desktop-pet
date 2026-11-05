import type { PetState } from '../characters/akila';
export function createTransition(render: (state: PetState) => void, leave: () => boolean, delay?: number): (state: PetState) => void;
