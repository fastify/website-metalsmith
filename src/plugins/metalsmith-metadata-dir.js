const { readdir, readFile } = require('fs')
const { extname, join } = require('path')
const { cpus } = require('os')
const debug = require('debug')('metalsmith-metadata-dir')
const yaml = require('js-yaml')
const mapLimit = require('async/mapLimit')

const parseMap = {
  '.yml': content => yaml.load(content),
  '.json': content => JSON.parse(content)
}

function plugin (opts) {
  opts.directory = opts.directory || null
  opts.key = opts.key || 'data'

  debug(`Initialized metalsmith-metadata-dir with directory "${opts.directory}"`)

  return function (files, metalsmith, done) {
    readdir(opts.directory, function (err, files) {
      if (err) throw err

      const metadata = {
        [`${opts.key}`]: {}
      }

      mapLimit(
        files, cpus().length * 2,
        (filename, done) => {
          const ext = extname(filename)
          if (!parseMap[ext]) {
            return done()
          }

          const fullPath = join(opts.directory, filename)
          const metadataGroup = filename.substr(0, filename.length - ext.length)
          readFile(fullPath, (err, content) => {
            if (err) throw err

            const data = parseMap[ext](content)
            metadata[opts.key][metadataGroup] = data
            debug(`Parsed data for "${fullPath}" and saved into metadata as "${opts.key}.${metadataGroup}"`)
            return done()
          })
        },
        (err) => {
          if (err) throw err

          metalsmith.metadata(Object.assign(metalsmith.metadata(), metadata))

          return done()
        }
      )
    })
  }
}

module.exports = plugin
