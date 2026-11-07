import { akila, type PetState } from './characters/akila';
import { mountPet } from './renderer/pet';
import './style.css';
import {installPetMouse} from './renderer/mouse-interaction';
const root=document.querySelector<HTMLDivElement>('#app')!;
const livePet=mountPet(root,akila);
installPetMouse(root);
const permitted=new Set<PetState>(['idle','smoking','working','drawing','firing','sitting']);
window.pet?.onAction((state:string)=>{
 if(permitted.has(state as PetState)) livePet.set(state as PetState);
});
