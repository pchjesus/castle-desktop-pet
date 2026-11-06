// Each outfit is looked up only in its own frame registry.
export function outfitFrames(registry, outfit, state) {
  const value = registry[outfit]?.[state];
  return Array.isArray(value) ? [...value] : [];
}
