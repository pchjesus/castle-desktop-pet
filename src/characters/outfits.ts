// Post-prototype design contract. Mustang stays the approved default; blouson adds an independent nine-pose B-20 pack.
export const outfitPolicy = Object.freeze({
  targetDefault: 'mustang',
  active: 'mustang',
  outfits: {
    // Later A/B-20 blouson runtime derives from the user-approved 3×3 concept.
    // Do not fall back to the initial prototype or the mustang sprite registry.
    blouson: { assetRoot: 'src/characters/candidates/a-blouson-b20', ready: true },
    mustang: { assetRoot: 'candidates/b-mustang-20261107', ready: true },
  },
} as const);
