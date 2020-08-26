const semver = require('semver')

const defaultRules = [
  { type: 'header', name: 'Accept-Version' }
]

const defaultOptions = {
  responseHeader: 'x-api-version',
  fallbackDefault: false,
  defaultVersion: '*'
}

const getVersion = (rules, ctx) => {
  for (const rule of rules) {
    if (rule.type === 'header' && ctx.get(rule.name)) {
      return ctx.get(rule.name)
    } else if (rule.type === 'query' && ctx.query[rule.name]) {
      return ctx.query[rule.name]
    } else if (rule.type === 'param' && ctx.params[rule.name]) {
      return ctx.params[rule.name]
    }
  }
  return '*'
}

const getMiddleware = (middlewares, version) => {
  for (const middleware of middlewares) {
    if (semver.satisfies(middleware.version, version)) {
      return middleware
    }
  }
  return null
}

class KoaRouterSemver {
  constructor (rules, options = {}) {
    this.rules = rules || defaultRules
    this.options = Object.assign({}, defaultOptions, options)
  }

  version (versions, options = {}) {
    const customOptions = Object.assign({}, this.options, options)

    const middlewares = []
    for (const version of Object.entries(versions)) {
      middlewares.push({
        version: semver.clean(version[0]),
        handler: version[1]
      })
    }
    middlewares.sort((a, b) => semver.lt(a.version, b.version) ? 1 : -1)

    return (ctx, next) => {
      const version = getVersion(this.rules, ctx)
      let found = getMiddleware(middlewares, version)

      if (!found && customOptions.fallbackDefault && middlewares.length > 0) {
        found = getMiddleware(middlewares, customOptions.defaultVersion)
        if (!found) {
          found = getMiddleware(middlewares, '*')
        }
      }

      if (found) {
        ctx.set(customOptions.responseHeader, found.version)
        return found.handler(ctx, next)
      }

      ctx.throw(404, 'Version ' + version + ' is not supported')
    }
  }
}

module.exports = KoaRouterSemver
