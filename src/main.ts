import { akila } from './characters/akila';
import { mountPet } from './renderer/pet';
import './style.css';
mountPet(document.querySelector<HTMLDivElement>('#app')!, akila);
