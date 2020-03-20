const { access } = require('fs')

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

module.exports = {
  fileExists
}
