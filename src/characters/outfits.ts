// Post-prototype design contract. B is the desktop QA default; all nine current B poses are user-approved.
export const outfitPolicy = Object.freeze({
  targetDefault: 'mustang',
  active: 'mustang',
  outfits: {
    // Later A is a separate approved design in design/references/akila-sheet-02.png.
    // Never alias the initial prototype to later A. A standalone runtime pack is pending.
    blouson: { assetRoot: 'design/references/akila-sheet-02.png', ready: false },
    mustang: { assetRoot: 'candidates/b-mustang-20261107', ready: true },
  },
} as const);
