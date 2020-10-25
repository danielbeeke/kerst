const presetEnv = require('postcss-preset-env')
module.exports = {
  plugins: [
    require('postcss-nested'),
    presetEnv({
    stage: 3,
    features: {
      'nesting-rules': true
    }
  })],
};
