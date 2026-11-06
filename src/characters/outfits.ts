// Policy and runtime are separate until every B-state is approved and tested.
export const outfitPolicy = Object.freeze({
  targetDefault: 'mustang',
  active: 'blouson',
  outfits: {
    blouson: { assetRoot: 'derived/akila', ready: true },
    mustang: { assetRoot: 'derived/akila_mustang', ready: false },
  },
} as const);
