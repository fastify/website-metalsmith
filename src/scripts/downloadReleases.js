#!/usr/bin/env node

const axios = require('axios')
const { resolve, join } = require('path')
const unzip = require('unzip-stream')
var parseLinkHeader = require('parse-link-header')
const sortVersionTags = require('./utils/sortVersionTags')

const repository = process.argv[2] || 'fastify/fastify'
const dest = resolve(process.argv[3] || 'releases')
const minRelease = process.argv[4] || 'v1.13.0'

async function getAllReleases (repository, requestConfig) {
  let releases = []
  let nextUrl = `https://api.github.com/repos/${repository}/releases`
  while (nextUrl) {
    const { data, headers } = await axios.get(nextUrl, requestConfig)
    const links = parseLinkHeader(headers.link)
    nextUrl = links.next ? links.next.url : null
    releases = releases.concat(data)
  }

  return releases
}

function downloadReleases (releases, requestConfig) {
  const releasesDownload = Object.values(releases).map(async (release) => {
    const { data } = await axios.get(release.url, { ...requestConfig, responseType: 'stream' })
    return new Promise((resolve, reject) => {
      data
        .pipe(unzip.Extract({ path: join(dest, release.name) }))
        .on('error', reject)
        .on('finish', () => {
          console.log(` - ${release.name}`)
          return resolve()
        })
    })
  })
  return Promise.all(releasesDownload)
}

async function main () {
  console.log(`downloading releases into ${dest}`)

  const requestConfig = {
    responseType: 'json',
    headers: { 'User-Agent': 'fastify-website-builder-v2' }
  }

  if (process.env.GH_NAME && process.env.GH_TOKEN) {
    console.log(`  » GitHub API requests authenticated as "${process.env.GH_NAME}"`)
    requestConfig.auth = {
      username: process.env.GH_NAME,
      password: process.env.GH_TOKEN
    }
  }

  const releases = await getAllReleases(repository, requestConfig)
  console.log(`Found ${releases.length} releases`)
  const selectedReleases = releases
    // TODO: ----------------------------------------------------------------------- debug
    .concat([
      {
        name: 'v3.0.0-alpha',
        zipball_url: 'https://api.github.com/repos/fastify/fastify/zipball/v1.13.3'
      },
      {
        name: 'v3.0.0-alpha.2',
        zipball_url: 'https://api.github.com/repos/fastify/fastify/zipball/v1.13.3'
      }
    ])
    // TODO: ----------------------------------------------------------------------- end of debug
    // removes draft releases and pre-releases
    .filter((release) => !release.draft && !release.prerelease)
    // sorts releases by name
    .sort((a, b) => a.name < b.name)
    // creates version map and label per every release
    .map((release) => {
      const [major, minor, patch] = release.name.split('-', 1)[0].substr(1).split('.').map(Number)
      const annotation = release.name.split('-').slice(1).join('-') // catches annotations like `-alpha.1` or `-pre-release.2`
      console.log(release.name, '->', { major, minor, patch, annotation })
      return {
        name: release.name,
        url: release.zipball_url,
        label: `v${major}.${minor}.x`,
        version: { major, minor, patch, annotation }
      }
    })
    // removes release prior to a given release
    .filter(({ name, version }) => {
      const [major, minor, patch] = minRelease.substr(1).split('.').map(Number)
      const remove = (
        version.major > major ||
        (version.major === major && version.minor > minor) ||
        (version.major === major && version.minor === minor && version.patch >= patch)
      )
      console.log(`Ignoring ${name} as it's older than ${minRelease}`)
      return remove
    })
    // Keeps only the latest patch per release and creates a map
    .reduce((acc, curr) => {
      if (!acc[curr.label] || acc[curr.label].version.patch < curr.version.patch) {
        acc[curr.label] = curr
      }

      return acc
    }, {})

  // Create an alias of the latest release as `latest`
  const latestReleaseKey = Object.keys(selectedReleases).sort(sortVersionTags).reverse()[0]
  selectedReleases.latest = selectedReleases[latestReleaseKey]

  // Adds current master
  selectedReleases.master = {
    label: 'master',
    name: 'master',
    url: `https://github.com/${repository}/archive/master.zip`
  }

  // downloads the releases
  await downloadReleases(selectedReleases, requestConfig)
  console.log('All releases downloaded')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
