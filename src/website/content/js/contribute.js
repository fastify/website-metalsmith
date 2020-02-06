(function () {
  const { Component, h, render } = window.preact
  const dataURL = 'https://gh-issue-finder.glentiki.now.sh/api/findIssues?org=fastify'

  const Spinner = () => h('div', { className: 'spinner' })
  const ErrorBox = (props) => h('article', { className: 'message is-danger' },
    [
      h('div', { className: 'message-header' },
        h('p', null, 'Error')
      ),
      h('div', { className: 'message-body' }, props.message)
    ]
  )
  const Issue = (props) => h('div', { className: 'good-issue' }, [
    h('div', { className: 'card' }, [
      h('div', { className: 'card-content' }, [
        h('div', { className: 'media' }, [
          h('div', { className: 'media-left' }, [
            h('a', { href: props.author.acc_url }, [
              h('figure', { className: 'image is-96x96 contributor-picture' }, [
                h('img', { src: props.author.avatar_url, alt: props.author.name + '\'s profile picture' })
              ])
            ])
          ]),
          h('div', { className: 'media-content' }, [
            h('p', { className: 'title is-4' }, [
              h('a', { href: props.url }, props.title)
            ]),
            h('p', { className: 'subtitle is-6' }, [
              h('a', { href: props.project.url }, props.project.name)
            ]),
            h('p', null, [
              h('strong', null, props.comments),
              h('span', null, ' Comments')
            ])
          ])
        ])
      ])
    ])
  ])
  const Issues = (props) => {
    let content = 'No issue available 😱'
    if (props.issues && props.issues.length > 0) {
      content = props.issues.map((issue) => h(Issue, issue))
    }
    return h('div', { className: 'issues' }, content)
  }
  const ProjectFilter = (props) => h('a', {
    className: 'tag' + (props.selected ? ' is-primary' : ''),
    onClick: (e) => {
      e.preventDefault()
      props.toggle && props.toggle()
    }
  }, props.name + ' (' + props.count + ')')

  class App extends Component {
    constructor () {
      super()
      this.state = {
        loading: false,
        error: null,
        issues: [],
        projects: {},
        filteredIssues: []
      }
      this.toggleProject = this._toggleProject.bind(this)
    }

    _toggleProject (name) {
      const projects = this.state.projects
      if (projects[name]) {
        projects[name].selected = !projects[name].selected
      }
      const filteredIssues = this.state.issues.filter((issue) => {
        return projects[issue.project.name].selected
      })
      this.setState({ projects, filteredIssues })
    }

    componentDidMount () {
      this.setState({ loading: true })
      fetch(dataURL)
        .then((resp) => resp.json())
        .then((data) => {
          const issues = data.results
          const projects = data.results.reduce((acc, curr) => {
            acc[curr.project.name] = {
              count: typeof acc[curr.project.name] === 'undefined' ? 1 : acc[curr.project.name].count + 1,
              selected: true,
              name: curr.project.name
            }
            return acc
          }, {})
          const filteredIssues = issues.filter((issue) => {
            return projects[issue.project.name].selected
          })

          this.setState({ loading: false, issues, projects, filteredIssues })
        })
        .catch((err) => {
          this.setState({ loading: false, error: err })
        })
    }

    render () {
      if (this.state.loading) {
        return h(Spinner)
      }

      if (this.state.error) {
        return h(ErrorBox, { message: this.state.error.toString() })
      }

      return h('div', null, [
        h('div', { className: 'filters' }, Object.values(this.state.projects).sort(byCount).map((project) => [h(ProjectFilter, { ...project, toggle: this.toggleProject.bind(this, [project.name]) }), ' '])),
        h(Issues, { issues: this.state.filteredIssues })
      ])
    }
  }

  function byCount (a, b) {
    return b.count - a.count
  }

  const app = h(App)
  render(app, document.getElementById('good-first-issues'))
})()
