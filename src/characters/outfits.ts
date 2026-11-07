// Post-prototype design contract. B is the desktop QA default; visual approval remains pending.
export const outfitPolicy = Object.freeze({
  targetDefault: 'mustang',
  active: 'mustang',
  outfits: {
    // Later A is a separate approved design in design/references/akila-sheet-02.png.
    // Never alias the initial prototype to later A. A standalone runtime pack is pending.
    blouson: { assetRoot: 'design/references/akila-sheet-02.png', ready: false },
    mustang: { assetRoot: 'candidates/b-mustang-20261107/action-pack-v04', ready: false },
  },
} as const);
