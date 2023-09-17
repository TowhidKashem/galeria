const createConfigAsync = require('@expo/webpack-config')
const path = require('path')

module.exports = async (env, argv) => {
  const config = await createConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['galeria'],
      },
    },
    argv
  )
  config.resolve.modules = [
    path.resolve(__dirname, './node_modules'),
    path.resolve(__dirname, '../node_modules'),
  ]
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  })

  return config
}
