const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const jsYaml = require('js-yaml')
const chalk = require('chalk')

let errors = 0

const orgsPath = join(
  __dirname,
  '..',
  'src',
  'website',
  'data',
  'organisations.yml'
)
const orgs = jsYaml.load(readFileSync(orgsPath, 'utf8'))
orgs.forEach((org) => {
  if (!org.name || !org.image || !org.link) {
    console.log(
			`😱  ${chalk.red(
				orgsPath
			)}: invalid organisation entry, no "link", "image" or "name" field`
    )
    errors++
  }
  if (
    !existsSync(
      join(
        __dirname,
        '..',
        'src',
        'website',
        'content',
        'images',
        'organisations',
        org.image
      )
    )
  ) {
    console.log(`😱  ${chalk.red(org.image)}: Organisation logo doens't exist`)
    errors++
  }
  process.exit(errors)
})
