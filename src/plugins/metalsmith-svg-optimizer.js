const extname = require('path').extname
const debug = require('debug')('metalsmith-svg-optimizer')
const each = require('async/each')
const SVGO = require('svgo')

const svg = (file) => /\.svg$/.test(extname(file))

function plugin (opts) {
  debug(`Initialized metalsmith-svg-optimizer`)
  debug('Options: %o', opts)

  const svgo = new SVGO({
    pretty: opts.pretty,
    plugins: opts.plugins
  })

  return (files, metalsmith, done) => {
    each(
      Object.keys(files).filter(svg),
      (filepath, callback) => {
        debug('Optimize file: %s', filepath)
        const file = files[filepath]

        svgo.optimize(file.contents.toString(), { path: filepath })
          .then((result) => {
            // Update the file contents with the optimized version
            file.contents = Buffer.from(result.data)
            callback()
          }, callback)
      }, done)
  }
}

module.exports = plugin
