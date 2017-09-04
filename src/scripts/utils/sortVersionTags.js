const sortVersionTags = (a, b) => {
  if (a === b) return 0
  if (a === 'master') return 1
  if (b === 'master') return -1

  const [majorA, minorA, patchA] = a.substr(1).split('.').map(Number)
  const [majorB, minorB, patchB] = b.substr(1).split('.').map(Number)

  if (
    majorA > majorB ||
    (majorA === majorB && minorA > minorB) ||
    (majorA === majorB && minorA === minorB && patchA > patchB)
  ) {
    return 1
  }

  return -1
}

module.exports = sortVersionTags
