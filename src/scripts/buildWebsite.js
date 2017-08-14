#!/usr/bin/env node

const path = require('path')
const Metalsmith = require('metalsmith')
const debug = require('metalsmith-debug')
const collections = require('metalsmith-collections')
const layouts = require('metalsmith-layouts')
const nunjucks = require('nunjucks')
const markdown = require('metalsmith-markdown')
const permalinks = require('metalsmith-permalinks')
const writemetadata = require('metalsmith-writemetadata')
const markdownFilter = require('nunjucks-markdown-filter')
const metadataDir = require('../plugins/metalsmith-metadata-dir')

const source = path.resolve(process.argv[2] || path.join(__dirname, '..', 'website'))
const dest = path.resolve(process.argv[3] || path.join(__dirname, '..', '..', 'build'))

console.log(`Building website from ${source} into ${dest}`)

const env = nunjucks.configure(path.join(source, 'layouts'), {watch: false, noCache: true})
env.addFilter('md', markdownFilter)

Metalsmith(source)
  .source(path.join(source, 'content'))
  .destination(dest)
  .clean(true)
  .metadata(require(path.join(source, 'metadata.json')))
  .use(debug())
  .use(writemetadata({
    childIgnorekeys: ['next', 'previous', 'content']
  }))
  .use(metadataDir({
    directory: path.join(source, 'data')
  }))
  .use(collections({
    docs: 'docs/**/*.md'
  }))
  .use(markdown())
  .use(permalinks({
    relative: false
  }))
  .use(layouts({
    engine: 'nunjucks',
    pattern: '**/*.html',
    directory: 'layouts',
    rename: true
  }))
  .build((err) => {
    if (err) throw err
  })
