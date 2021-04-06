const { access } = require('fs')
const { join } = require('path')
const { mkdir, copyFile, readdir } = require('fs').promises

function fileExists (path) {
  return new Promise((resolve, reject) => {
    access(path, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(false)
        }
        return reject(err)
      }
      return resolve(true)
    })
  })
}

async function copyDir (src, dest) {
  const hasDir = await fileExists(src)
  if (hasDir) {
    await mkdir(dest, { recursive: true })
    const entries = await readdir(src, { withFileTypes: true })
    return Promise.all(entries.map((entry) => {
      const srcPath = join(src, entry.name)
      const destPath = join(dest, entry.name)
      if (entry.isDirectory()) {
        return copyDir(srcPath, destPath)
      }
      return copyFile(srcPath, destPath)
    }))
  }
}

module.exports = {
  copyDir,
  fileExists
}
