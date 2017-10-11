#!/usr/bin/env node

const { join, dirname, basename } = require('path')
const { readdir, lstatSync, writeFile, readFile, existsSync, mkdirSync } = require('fs')
const mapLimit = require('async/mapLimit')
const { cpus } = require('os')
const { safeDump } = require('js-yaml')
const clone = require('clone')
const sortVersionTags = require('./utils/sortVersionTags')

const sourceFolder = process.argv[2]
const destFolder = process.argv[3]

if (!sourceFolder || !destFolder) {
  throw new Error(`Missing parameters sourceFolder and destFolder.\n\nExpected command:\n\t${process.argv[0]} ${process.argv[1]} <sourceFolder> <destFolder>\n`)
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

const processDocFiles = (docs, latestVersion, cb) => {
  // merge all docs into a single array adding the version as a key in every object
  const docsArray = Object.keys(docs).reduce((acc, version) => {
    const curr = docs[version]
    return acc.concat(curr.map((item) => {
      item.version = version
      return item
    }))
  }, [])

  mapLimit(
    docsArray,
    cpus().length * 2,
    (item, done) => {
      const dir = dirname(item.destinationFile)
      if (!existsSync(dir)) {
        mkdirSync(dir)
      }

      readFile(item.sourceFile, 'utf8', (err, buffer) => {
        if (err) return done(err)

        let content = buffer.toString()
        // removes doc header from github
        content = content.replace(/<h1 align="center">Fastify<\/h1>\n/, '')

        // remap links
        content = content.replace(/https:\/\/github.com\/fastify\/fastify\/blob\/master\/docs/g, `/docs/${item.version}`)

        content = fixInternalLink(content)

        // adds frontmatter
        content =
`---
title: ${item.name}
layout: docs_page.html
path: ${item.link}
version: ${item.version}
${item.version === 'latest' ? `canonical: "${item.link.replace(/latest/, latestVersion)}"` : ''}
${item.version === 'master' ? `github_url: https://github.com/fastify/fastify/blob/master/docs/${item.fileName}` : ''}
---
${content}`

        writeFile(item.destinationFile, content, 'utf8', done)
      })
    },
    cb
  )
}

const fixInternalLink = (content) => {
  const docInternalLinkRx = /\(\/docs\/[\w\d.-]+\/[\w\d-]+(.md)/gi
  return content.replace(docInternalLinkRx, (match, p1) => match.replace(p1, ''))
}

const createVersionIndexFile = (latestVersion) => (version, cb) => {
  const content = `---
title: Documentation - ${version}
layout: docs_version_index.html
path: /docs/${version}
version: ${version}
${version === 'latest' ? `canonical: "/docs/${latestVersion}"` : ''}
github_url: "https://github.com/fastify/website/blob/master/src/website/layouts/docs_version_index.html"
---`

  const dest = join(destFolder, 'content', 'docs', version, 'index.md')
  console.log(`Creating ${dest}`)
  writeFile(dest, content, 'utf8', cb)
}

const createIndexFiles = (versions, cb) => {
  // create docs index

  const docsIndexContent = `---
title: Documentation
layout: docs_index.html
path: /docs
github_url: "https://github.com/fastify/website/blob/master/src/website/layouts/docs_index.html"
---`

  const dest = join(destFolder, 'content', 'docs', 'index.md')
  console.log(`Creating ${dest}`)
  writeFile(dest, docsIndexContent, 'utf8', (err) => {
    if (err) throw err

    const latestVersion = versions[1]

    mapLimit(
      versions,
      cpus().length * 2,
      createVersionIndexFile(latestVersion),
      cb
    )
  })
}

const createDocSources = () => new Promise((resolve, reject) => {
  readdir(sourceFolder, (err, files) => {
    if (err) return reject(err)

    const dirs = files.filter((file) => {
      const stats = lstatSync(join(sourceFolder, file))
      return stats.isDirectory()
    })

    const data = {}
    data.versions = dirs.sort(sortVersionTags).reverse()

    mapLimit(
      data.versions,
      cpus().length * 2,
      getTOCForVersion,
      (err, toc) => {
        if (err) return reject(err)

        const indexedToc = data.versions.reduce((acc, curr, i) => {
          acc[curr] = toc[i]
          return acc
        }, {})

        createDocsDataFile(join(destFolder, 'data', 'docs.yml'), {versions: data.versions, toc: indexedToc}, (err) => {
          if (err) return reject(err)

          const latestVersion = data.versions[1]

          processDocFiles(indexedToc, latestVersion, (err) => {
            if (err) return reject(err)

            createIndexFiles(data.versions, (err) => {
              if (err) return reject(err)

              return resolve()
            })
          })
        })
      }
    )
  })
})

const extractEcosystemFromFile = (file, cb) => {
  readFile(file, 'utf8', (err, data) => {
    if (err) return cb(err)

    const content = data.toString()
    const lines = content.split('## Ecosystem')[1].split('- *More coming soon*')[0].split('\n').filter(Boolean)
    // if a line doesn't start with "-" merge it back with the previous item
    const mergedLines = lines.reduce((acc, curr) => {
      if (curr[0] === '-') {
        acc.push(curr)
      } else {
        acc[acc.length - 1] += ' ' + curr
      }
      return acc
    }, [])
    const re = /\[`([a-z-]+)`\]\(([^)]+)\)(\s+(.+))?/
    const plugins = mergedLines.map((line) => {
      const match = re.exec(line)

      const name = match[1]
      const url = match[2]
      const description = match[3] ? match[3].trim() : ''

      return {name, url, description}
    })

    cb(null, { plugins })
  })
}

const createEcosystemDataFile = () => new Promise((resolve, reject) => {
  const versionFolder = join(sourceFolder, 'master')
  const destination = join(destFolder, 'data', 'ecosystem.yml')
  readdir(versionFolder, (err, files) => {
    if (err) return reject(err)

    const subfolder = files.find(file => file.match(/^fastify-/))
    const indexFile = join(versionFolder, subfolder, 'README.md')

    return extractEcosystemFromFile(indexFile, (err, ecosystem) => {
      if (err) return reject(err)

      writeFile(destination, safeDump(ecosystem), 'utf8', (err) => {
        if (err) return reject(err)

        console.log(`Ecosystem file dumped in ${destination}`)

        return resolve()
      })
    })
  })
})

Promise.all([
  createDocSources(),
  createEcosystemDataFile()
])
  .then(() => console.log('Releases processed correctly'))
  .catch((err) => {
    console.error('Releases processing failed', err)
    process.exit(1)
  })
