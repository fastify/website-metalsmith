#!/usr/bin/env node

const request = require('request-promise-native')
const mapLimit = require('async/mapLimit')
const { resolve, join } = require('path')
const unzip = require('unzip-stream')
const { cpus } = require('os')

const repository = process.argv[2] || 'fastify/fastify'
const dest = resolve(process.argv[3] || 'releases')
const minRelease = process.argv[4] || 'v0.11.0'

console.log(`downloading releases into ${dest}`)

const headers = { 'User-Agent': 'fastify-website-builder-v1' } 

request({
  url: `https://api.github.com/repos/${repository}/releases`,
  json: true,
  headers
})
  .then( (releases) => {
    const selectedReleases = releases
      // creates version map and label per every release
      .map((release) => {
        const [major, minor, patch] = release.name.substr(1).split('.').map(Number)
        return {
          name: release.name,
          url: release.zipball_url,
          label: `v${major}.${minor}.x`,
          version: { major, minor, patch }
        }
      })
      // removes release prior to a given release
      .filter(({version}) => {
        const [major, minor, patch] = minRelease.substr(1).split('.').map(Number)
        return (
          version.major > major ||
          (version.major === major && version.minor > minor) ||
          (version.major === major && version.minor === minor && version.patch >= patch)
        )
      })
      // Keeps only the latest patch per release and creates a map
      .reduce((acc, curr) => {
        if (!acc[curr.label] || acc[curr.label].version.patch < curr.version.patch) {
          acc[curr.label] = curr
        }

        return acc
      }, {})
      
    // Adds current master
    selectedReleases.master = {
      label: 'master',
      name: 'master',
      url: `https://github.com/${repository}/archive/master.zip`
    }  

    // downloads the releases
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
  .catch((err) => {
    console.error(err, err.stack)
    process.exit(1)
  })


