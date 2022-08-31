const extname = require('path').extname
const debug = require('debug')('metalsmith-svg-optimizer')
const each = require('async/each')
const { optimize } = require('svgo')
const multimatch = require('multimatch')

const svg = (file) => /\.svg$/.test(extname(file))

function plugin (opts) {
  debug('Initialized metalsmith-svg-optimizer')
  debug('Options: %o', opts)

  const pattern = opts.pattern || ['**/*.svg']

  return (files, metalsmith, done) => {
    each(
      multimatch(Object.keys(files), pattern),
      (filepath, callback) => {
        if (!svg(filepath)) {
          return callback()
        }
        debug('Optimize file: %s', filepath)
        const file = files[filepath]

        const result = optimize(file.contents.toString(), { path: filepath, pretty: opts.pretty, plugins: opts.plugins })
        // Update the file contents with the optimized version
        file.contents = Buffer.from(result.data)
        callback()
      }, done)
  }
}

module.exports = plugin
