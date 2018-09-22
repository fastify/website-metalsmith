const { readFileSync } = require('fs')
const { join, basename } = require('path')
const glob = require('glob')
const xml2js = require('xml2js')
const chalk = require('chalk')

const parser = new xml2js.Parser()
let errors = 0
glob(
  join(
    __dirname,
    '..',
    'src',
    'website',
    'content',
    'images',
    'organisations',
    '*.svg'
  ),
  {},
  function (er, files) {
    console.log(chalk.cyan('🖼  Validating organization images\n'))
    files.forEach(fullPath => {
      const filename = basename(fullPath)

      const svgContent = readFileSync(fullPath)
      parser.parseString(svgContent, (err, result) => {
        if (err) {
          console.log(
            `😱  ${chalk.red(filename)}: cannot read SVG content. ${err}`
          )
          errors++
          return
        }

        if (!result || !result.svg || !result.svg.$) {
          console.log(
            `😱  ${chalk.red(
              filename
            )}: invalid SVG content, can't find root "svg" tag`
          )
          errors++
          return
        }

        const { xmlns, viewBox, width, height } = result.svg.$
        if (xmlns !== 'http://www.w3.org/2000/svg') {
          console.log(
            `😱  ${chalk.red(
              filename
            )}: invalid xmlns content, "svg" tag. Expected "http://www.w3.org/2000/svg", found "${xmlns}"`
          )
          errors++
          return
        }

        if (!viewBox) {
          console.log(
            `😱  ${chalk.red(
              filename
            )}: invalid SVG content, "viewBox" not defined in xmlns tag`
          )
          errors++
          return
        }

        if (!width || !height) {
          console.log(
            `😱  ${chalk.red(
              filename
            )}: invalid SVG content, missing "width" or "height" attribute in xmlns tag`
          )
          errors++
          return
        }

        console.log(`🤩  ${chalk.green(filename)}`)
      })
    })

    process.exit(errors)
  }
)
