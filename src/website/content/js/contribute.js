(function () {
  const { Component, h, render } = window.preact
  const dataURL = 'https://gh-issue-finder.glentiki.now.sh/api/findIssues?org=fastify'

  const Debug = (props) => h('pre', null, JSON.stringify(props.data, null, 2))
  const Spinner = () => h('div', { className: 'spinner' })

  class App extends Component {
    constructor () {
      super()
      this.state = {
        loading: false,
        error: null,
        issues: [],
        projects: [],
        filteredIssues: []
      }
    }

    componentDidMount () {
      this.setState({ loading: true })
      fetch(dataURL)
        .then((resp) => {
          return resp.json()
        })
        .then((data) => {
          this.setState({ loading: false, issues: data })
        })
        .catch((err) => {
          this.setState({ loading: false, error: err })
        })
    }

    render () {
      if (this.state.loading) {
        return h(Spinner)
      }

      return h('div', null, h(Debug, { data: this.state }))
    }
  }

  const app = h(App)
  render(app, document.getElementById('good-first-issues'))

  // var container = document.getElementById('good-first-issues')
  // var projectRegex = /https:\/\/github\.com\/fastify\/([a-zA-Z0-9\-_]+)\/issues\/(\d+)/

  // function mapProject (url) {
  //   var match = url.match(projectRegex)
  //   if (!match || !match[1]) {
  //     return 'fastify'
  //   }

  //   return match[1]
  // }

  // var spinner = document.createElement('div')
  // spinner.className = 'spinner'
  // container.appendChild(spinner)

  // var xhr = new XMLHttpRequest()
  // xhr.onreadystatechange = function () {
  //   if (xhr.readyState !== 4) return
  //   if (xhr.status >= 200 && xhr.status < 300) {
  //     try {
  //       var results = JSON.parse(xhr.responseText).results.map((r) => {
  //         return Object.assign({}, r, { project: mapProject(r.url) })
  //       })
  //       handleResults(results)
  //     } catch (e) {
  //       handleError(e)
  //     }
  //   }
  // }

  // xhr.open('GET', 'https://gh-issue-finder.glentiki.now.sh/api/findIssues?org=fastify')
  // xhr.send()

  // function handleResults (results) {
  //   resetContainer()
  //   if (results.length > 0) {
  //     results.sort((a, b) => b.comments - a.comments)
  //     for (var i = 0; i < results.length; i++) {
  //       var result = results[i]
  //       var issueNode = document.createElement('div')
  //       issueNode.className = 'good-issue'
  //       issueNode.innerHTML = '<div class="card">' +
  //                         '<div class="card-content">' +
  //                           '<div class="media">' +
  //                             '<div class="media-left">' +
  //                                       '<a href="' + result.author.acc_url + '">' +
  //                                   '<figure class="image is-96x96 contributor-picture">' +
  //                                               '<img src="' + result.author.avatar_url + '" alt="' + e(result.author.name) + '\'s profile picture"/>' +
  //                                           '</figure>' +
  //                                       '</a>' +
  //                             '</div>' +
  //                             '<div class="media-content">' +
  //                                       '<p class="title is-4">' +
  //                                           '<a href="' + result.url + '">' + e(result.title) + '</a>' +
  //                                       '</p>' +
  //                                       '<p class="subtitle is-6">' +
  //                                           '<a href="https://github.com/fastify/' + result.project + '">' + e(result.project) + '</a>' +
  //                                       '</p>' +
  //                                     '<p><strong>' + result.comments + '</strong> Comments</p>' +
  //                             '</div>' +
  //                           '</div>' +
  //                         '</div>' +
  //                 '</div>'
  //       container.appendChild(issueNode)
  //     }
  //   } else {
  //     var noResultsNode = document.createElement('div')
  //     noResultsNode.className = 'no-issues'
  //     noResultsNode.innerHTML = '<h3>No issues found! 🚀</h3><p>Try <a href="https://github.com/fastify/fastify">checking the issues on GitHub</a> or <a href="https://gitter.im/fastify/Lobby">joining us on Gitter to join in the conversation</a></p>'
  //     container.appendChild(noResultsNode)
  //   }
  // }

  // function handleError (error) {
  //   resetContainer()
  //   var errorNode = document.createElement('div')
  //   errorNode.className = 'error-result'
  //   errorNode.innerHTML = '<h3>There was an unexpected error fetching issues to contribute to. :( </h3>' +
  //                               '<h4>Error message: ' + error.toString() + '</h4>' +
  //                               '<p>If this is unexpected please report an issue <a href="https://github.com/fastify/website/issues">here.</a></p>'
  //   container.appendChild(errorNode)
  // }

  // function resetContainer () {
  //   var child = container.lastChild
  //   while (child) {
  //     container.removeChild(child)
  //     child = container.lastChild
  //   }
  // }

  // function e (unsafe) {
  //   return unsafe
  //     .replace(/&/g, '&amp;')
  //     .replace(/</g, '&lt;')
  //     .replace(/>/g, '&gt;')
  //     .replace(/"/g, '&quot;')
  //     .replace(/'/g, '&#039;')
  // }
})()
