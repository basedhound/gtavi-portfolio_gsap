// Init script for tools/record.mjs on the live site: marks 'loader:fadeout' when the loader logo's
// 1000ms fade starts, which the live loader does right after emitting its 'fadeout' event.
(() => {
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    if (options && options.duration === 1000 && String(options.easing).includes('0.2, 0, 0.8, 1')) performance.mark('loader:fadeout');
    if (options && options.duration === 1300 && String(options.easing).includes('0.4, 0, 0.8, 1')) performance.mark('loader:overlay-fade');
    return animate.call(this, keyframes, options);
  };
})();
