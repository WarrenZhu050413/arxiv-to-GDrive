module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  // This setting helps with the "type": "module" in package.json
  // so Jest can properly transform ES modules
  sourceType: 'unambiguous',
}; 