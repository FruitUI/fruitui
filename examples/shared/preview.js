/**
 * Adds the Responsive/iPhone preview state to an example's own Alpine data. Object.assign keeps the
 * example's getters reactive, and refs stay with the example's scope.
 */
export const withPreview =
  factory =>
  (...args) =>
    Object.assign(factory(...args), { preview: 'responsive' });
