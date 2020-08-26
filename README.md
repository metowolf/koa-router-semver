# [koa-router-semver](https://github.com/metowolf/koa-router-semver)

> Semver Version Router middleware for [Koa](https://github.com/koajs/koa).

* [Semantic Versioning](http://semver.org/) routes
* Multiple version middleware
* Support for Header, search query and path params

## Installation

```bash
# npm .. 
npm i koa-router-semver
# yarn .. 
yarn add koa-router-semver
```

## Usage

Server
```js
const Koa = require('koa')
const Router = require('@koa/router')
const SemverRouter = require('koa-router-semver')

const app = new Koa()
const router = new Router()
const semver = new SemverRouter()

router.get('index', '/', semver.version({
  '1.0.0': (ctx) => { ctx.body = 'Hello World!' },
  '1.1.0': (ctx) => { ctx.body = 'Hello Koa.js!' }
}))

app.use(router.routes())

app.listen(3000)
```

Client
```bash
# Specifying a version
$ curl -i -H "Accept-Version: 1.0.0" http://localhost:3000/
HTTP/1.1 200 OK
x-api-version: 1.0.0
<more headers>

Hello World!

# Hyphen Ranges version
$ curl -i -H "Accept-Version: >1.0.0" http://localhost:3000/
HTTP/1.1 200 OK
x-api-version: 1.1.0
<more headers>

Hello Koa.js!

# Caret Ranges
$ curl -i -H "Accept-Version: ^1.0" http://localhost:3000/
HTTP/1.1 200 OK
x-api-version: 1.1.0
<more headers>

Hello Koa.js!
```

## Contributing

Please submit all issues and pull requests to the [metowolf/koa-router-semver](https://github.com/metowolf/koa-router-semver) repository!

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/metowolf/koa-router-semver/issues).


### License

[MIT](LICENSE)