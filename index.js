var postcss = require('postcss');

module.exports = postcss.plugin('shift', function shift(opts) {

  return function(css, res) {

    opts = opts || {};

    // PostCSS processor code

    return css;

  };

});