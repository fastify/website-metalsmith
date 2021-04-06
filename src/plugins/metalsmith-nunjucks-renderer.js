const extname = require('path').extname
const debug = require('debug')('metalsmith-nunjucks-renderer')
const each = require('async/each')
const nunjucks = require('nunjucks')
const multimatch = require('multimatch')

const html = (file) => /\.html$/.test(extname(file))

function plugin (opts = {}) {
  debug('Initialized metalsmith-nunjucks')
  debug('Options: %o', opts)

  const pattern = opts.pattern || ['**/*.html']

  return (files, metalsmith, done) => {
    each(
      multimatch(Object.keys(files), pattern),
      (filepath, callback) => {
        if (!html(filepath)) {
          return callback()
        }
        debug('Convert html file: %s', filepath)
        const file = files[filepath]
        const metadata = Object.assign({}, file, metalsmith.metadata())
        const result = nunjucks.renderString(file.contents.toString(), metadata)
        file.contents = Buffer.from(result)
        callback()
      }, done)
  }
}

module.exports = plugin
