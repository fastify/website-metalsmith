#!/usr/bin/env node

const { readdir } = require('fs')
const { join } = require('path')
const { readFile } = require('fs')
const mapLimit = require('async/mapLimit')
const { cpus } = require('os')

const sourceFolder = process.argv[2]
const destFolder = process.argv[3]

const sortVersionTags = (a, b) => {
  if (a === b) return 0
  if (a === 'master') return -1
  if (b === 'master') return 1

  const [majorA, minorA, patchA] = a.substr(1).split('.').map(Number)
  const [majorB, minorB, patchB] = b.substr(1).split('.').map(Number)

  if (
    majorA > majorB ||
    (majorA === majorB && minorA > minorB) ||
    (majorA === majorB && minorA === minorB && patchA > patchB)
  ) {
    return -1
  }

  return 1
}

const extractTOCFromFile = (file, cb) => {
  // TODO
  readFile(file, 'utf8', (err, data) => {
    if (err) return cb(err)

    const content = data.toString()

    const lines = content.split('## Documentation')[1].split('\n\n')[0].split('\n').filter(Boolean)
    console.log(lines)
    const re = /master\/docs\/([a-zA-Z-]+\.md)"><code><b>(.+)<\/b>/ig
    const toc = lines.map((line) => {
      const match = re.exec(line)
      console.log(line, re, match)
      return { file: match[1], name: match[2] }
    })

    console.log(toc)

    cb(null, toc)
  })
}

const getTOCForVersion = (version, cb) => {
  const versionFolder = join(sourceFolder, version)
  readdir(versionFolder, (err, files) => {
    if (err) return cb(err)

    const subfolder = files.find(file => file.match(/^fastify-/))

    const indexFile = join(versionFolder, subfolder, 'README.md')

    return extractTOCFromFile(indexFile, cb)
  })
}

const createDocsData = () => new Promise((resolve, reject) => {
  readdir(sourceFolder, (err, files) => {
    if (err) return reject(err)

    const data = {}
    data.versions = files.sort(sortVersionTags)

    mapLimit(
      data.versions,
      cpus().length * 2,
      getTOCForVersion,
      (err, data) => {}
    )
  })
})

createDocsData()
