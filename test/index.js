const expect = require('expect.js')
const Koa = require('koa')
const Router = require('@koa/router')
const request = require('supertest')
const KoaRouterSemver = require('..')

describe('demo', () => {
  let app = null
  let server = null

  beforeEach(() => {
    app = new Koa()
    const router = new Router()
    const semver = new KoaRouterSemver()
    router.get('index', '/', semver.version({
      '1.0.0': (ctx) => { ctx.body = 'Hello World!' },
      '1.1.0': (ctx) => { ctx.body = 'Hello Koa.js!' }
    }))
    app.use(router.routes())
    server = app.listen()
  })

  afterEach(async () => {
    await server.close()
  })

  it('should match 1.0.0 version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '1.0.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.0.0')
        expect(res.text).to.eql('Hello World!')
        done()
      })
  })

  it('should match 1.1.0 version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '1.1.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.1.0')
        expect(res.text).to.eql('Hello Koa.js!')
        done()
      })
  })
})

describe('Router', () => {
  let app = null
  let server = null

  beforeEach(() => {
    app = new Koa()
    const router = new Router()
    const rules = [
      { type: 'header', name: 'Accept-Version' },
      { type: 'param', name: 'ver' },
      { type: 'query', name: 'api-version' }
    ]
    const routerSemver = new KoaRouterSemver(rules)
    const handler = (ctx) => { ctx.body = { message: 'Hello World!' } }
    const middlewares = {
      '1.0.0': handler,
      '1.0.2': handler,
      '1.1.0': handler,
      '1.1.1': handler,
      '1.1.10': handler,
      '1.2.0': handler,
      '1.2.1-beta': handler,
      '1.0.1-beta': handler,
      '2.0.0': handler
    }
    router.get('/', routerSemver.version(middlewares))
    router.get('/:ver/', routerSemver.version(middlewares))
    router.get('/fallbackDefault', routerSemver.version(middlewares, { fallbackDefault: true, defaultVersion: '1.2.0' }))
    router.get('/fallbackLatest', routerSemver.version(middlewares, { fallbackDefault: true, defaultVersion: '^4' }))

    app.use(router.routes())
    server = app.listen()
  })

  afterEach(async () => {
    await server.close()
  })

  it('should respect request header with exact version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '1.0.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.0.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should respect request path with exact version', done => {
    request(server)
      .get('/1.0.0/')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.0.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should respect request query with exact version', done => {
    request(server)
      .get('/?api-version=1.0.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.0.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('no version should return latest', done => {
    request(server)
      .get('/')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('2.0.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should respect request header with caret range version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '^1.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.2.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should respect request header with tilde range version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '~1.1')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.1.10')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should throw an error if requested an invalid version', done => {
    request(server)
      .get('/')
      .set('Accept-Version', '^3.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(404)
        expect(res.text).to.eql('Version ^3.0 is not supported')
        done()
      })
  })

  it('should match the default version', done => {
    request(server)
      .get('/fallbackDefault')
      .set('Accept-Version', '^3.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('1.2.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })

  it('should match the latest version', done => {
    request(server)
      .get('/fallbackLatest')
      .set('Accept-Version', '^3.0')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.headers['x-api-version']).to.equal('2.0.0')
        expect(res.body.message).to.eql('Hello World!')
        done()
      })
  })
})
