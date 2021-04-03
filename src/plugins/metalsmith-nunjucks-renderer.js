const extname = require('path').extname
const debug = require('debug')('metalsmith-nunjucks-renderer')
const each = require('async/each')
const nunjucks = require('nunjucks')

const html = (file) => /\.html$/.test(extname(file))

function plugin () {
  debug('Initialized metalsmith-nunjucks')

  return (files, metalsmith, done) => {
    each(
      Object.keys(files).filter(html),
      (filepath, callback) => {
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
