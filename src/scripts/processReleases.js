#!/usr/bin/env node

const { readdir, lstatSync, writeFile } = require('fs')
const { join, dirname, basename } = require('path')
const { readFile } = require('fs')
const mapLimit = require('async/mapLimit')
const { cpus } = require('os')
const { safeDump } = require('js-yaml')
const clone = require('clone')

const sourceFolder = process.argv[2]
const destFolder = process.argv[3]

if (!sourceFolder || !destFolder) {
  throw new Error(`Missing parameters sourceFolder and destFolder.\n\nExpected command:\n\t${process.argv[0]} ${process.argv[1]} <sourceFolder> <destFolder>\n`)
}

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

const extractTOCFromFile = (file, version, cb) => {
  readFile(file, 'utf8', (err, data) => {
    if (err) return cb(err)

    const content = data.toString()

    const lines = content.split('## Documentation')[1].split('\n\n')[0].split('\n').filter(Boolean)
    const re = /master\/docs\/([a-zA-Z-]+\.md)"><code><b>(.+)<\/b>/
    const toc = lines.map((line) => {
      const match = re.exec(line)
      const fileName = match[1]
      const name = match[2]
      const sourceFile = join(dirname(file), 'docs', fileName)
      const destinationFile = join(destFolder, 'content', 'docs', version, fileName)
      const slug = basename(sourceFile, '.md')
      const link = `/docs/${version}/${slug}`

      return {
        fileName,
        name,
        sourceFile,
        destinationFile,
        slug,
        link
      }
    })

    cb(null, toc)
  })
}

const getTOCForVersion = (version, cb) => {
  const versionFolder = join(sourceFolder, version)
  readdir(versionFolder, (err, files) => {
    if (err) return cb(err)

    const subfolder = files.find(file => file.match(/^fastify-/))
    const indexFile = join(versionFolder, subfolder, 'README.md')

    return extractTOCFromFile(indexFile, version, cb)
  })
}

const createDocsDataFile = (destination, docsInfo, cb) => {
  // remove sourceFile and destinationFile keys from toc
  const toDump = clone(docsInfo)
  Object.keys(toDump.toc).forEach((version) => {
    toDump.toc[version].forEach((entry, i) => {
      delete toDump.toc[version][i].sourceFile
      delete toDump.toc[version][i].destinationFile
    })
  })

  writeFile(destination, safeDump(toDump), 'utf8', cb)
}

const processDocFiles = (docs, cb) => {
  // TODO create directories (if they don't exists)
  // TODO copy files content from source to dest applying filters
  // TODO add frontmatter filter
  // TODO remap links filter

  console.log(docs)
  cb()
}

const createDocSources = () => new Promise((resolve, reject) => {
  readdir(sourceFolder, (err, files) => {
    if (err) return reject(err)

    const dirs = files.filter((file) => {
      const stats = lstatSync(join(sourceFolder, file))
      return stats.isDirectory()
    })

    const data = {}
    data.versions = dirs.sort(sortVersionTags)

    mapLimit(
      data.versions,
      cpus().length * 2,
      getTOCForVersion,
      (err, toc) => {
        if (err) throw err

        const indexedToc = data.versions.reduce((acc, curr, i) => {
          acc[curr] = toc[i]
          return acc
        }, {})

        createDocsDataFile(join(destFolder, 'data', 'docs.yml'), {versions: data.versions, toc: indexedToc}, (err) => {
          if (err) throw err

          processDocFiles(indexedToc, (err) => {
            if (err) throw err
          })
        })
      }
    )
  })
})

createDocSources()
