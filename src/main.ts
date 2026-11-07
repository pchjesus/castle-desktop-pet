import { akila, type PetState } from './characters/akila';
import { mountPet } from './renderer/pet';
import './style.css';
const livePet=mountPet(document.querySelector<HTMLDivElement>('#app')!,akila);
const permitted=new Set<PetState>(['idle','smoking','working','drawing','firing','sitting']);
window.pet?.onAction((state:string)=>{
 if(permitted.has(state as PetState)) livePet.set(state as PetState);
});
