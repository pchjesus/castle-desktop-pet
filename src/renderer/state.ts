import type { PetState } from '../characters/akila';
export function createState(initial: PetState, onChange: (state: PetState) => void) {
  let current = initial;
  return { get: () => current, set(next: PetState) { current = next; onChange(current); } };
}
