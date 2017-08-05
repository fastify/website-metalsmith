#!/usr/bin/env node

const request = require('request-promise-native')
const mapLimit = require('async/mapLimit')
const { resolve, join } = require('path')
const unzip = require('unzip-stream')
const { cpus } = require('os')

const dest = resolve(process.argv[2] || 'releases')

console.log(`downloading releases into ${dest}`)

const headers = { "User-Agent": 'fastify-website-builder-v1' } 

request({
  url: 'https://api.github.com/repos/fastify/fastify/releases',
  json: true,
  headers
})
  .then( (releases) => {
    const selectedReleases = releases
      .map((release) => ({
        name: release.name,
        url: release.zipball_url
      }))
      // Keeps only the latest patch per release and creates a map
      .reduce((acc, curr) => {
        const [major, minor, patch] = curr.name.substr(1).split('.').map(Number)
        const label = `v${major}.${minor}.x`
        if (!acc[label] || acc[label].patch < patch) {
          acc[label] = Object.assign(curr, {major, minor, patch})
        }

        return acc
      }, {})

    mapLimit(Object.keys(selectedReleases), cpus().length * 2, (name, done) => {
      const release = selectedReleases[name] 
      request({
        url: release.url,
        headers
      })
         .pipe(unzip.Extract({ path: join(dest, name) }))
         .on('finish', () => {
           console.log(` - ${name}`)
           done()
         })
    }, (err, data) => {})
  })


