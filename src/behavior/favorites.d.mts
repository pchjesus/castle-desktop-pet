export type Favorites={poses:string[];dialogues:string[]};
export const FAVORITE_POSES:readonly string[];
export function favoriteDialogueAllowed(id:unknown):boolean;
export function normalizeFavorites(value:unknown):Favorites;
export function toggleFavorite(current:unknown,kind:string,id:string):Favorites|null;
