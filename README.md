# live-markd

[![Build status](https://img.shields.io/travis/imcuttle/live-markd/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/live-markd)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/live-markd.svg?style=flat-square)](https://codecov.io/github/imcuttle/live-markd?branch=master)
[![NPM version](https://img.shields.io/npm/v/live-markd.svg?style=flat-square)](https://www.npmjs.com/package/live-markd)
[![NPM Downloads](https://img.shields.io/npm/dm/live-markd.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/live-markd)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)

github favorite markdown preview with live rendering

![](https://i.loli.net/2018/10/28/5bd58a95c6b7d.gif)

## Installation

```bash
npm install live-markd -g

live-markd .
```

## Usage

#### Standalone

```javascript
const liveMarkd = require('live-markd')

// Returns express app instance listened port 8080
const app = liveMarkd('path/to/dir', {
  port: 8080,
  baseUrl: '/www'
})
```

#### Use with express

```javascript
const app = require('express')()
const liveMarkd = require('live-markd')

const middleware = liveMarkd('path/to/dir', {
  heartBeatDelay: 4 * 1000, // 4s
  gssOptions: {}
})

app.use(middleware)
// or
app.use('/base-url', middleware)
```

#### CLI

```
npm i live-markd -g
live-markd <path>
```

## API

### `liveMarkd(root [, options])`

#### `root`

The markdown files' root folder.

- Type: `string`

#### Options

##### `port`

The server's port

- Type: `number`

##### `baseUrl`

The server's baseUrl (**only works on `port` is assigned**)

- Type: `string`

##### `heartBeatDelay`

The heartbeat detection's interval millisecond

- Type: `number`
- Default: `10 * 1000`

##### `gssOptions`

**Except `port`, `basePath`, rest options extends [github-similar-server](https://github.com/imcuttle/github-similar-server)**

###### `templateParameters`

**NOTE:** Expect [preset parameters](https://github.com/imcuttle/github-similar-server/blob/master/README.md#about-markdowntemplate) from github-similar-server

live-markd has injected follow parameters

| name      | description                                         |
| --------- | --------------------------------------------------- |
| `baseUrl` | the base url from `app.use('/baseUrl', lived(...))` |

###### `markdownTemplate`

The path of markdown's template, It's useful for customizing your suitable markdown style.

- Type: `string`
- Default: [`./dist/template.html`](./dist/template.html)

## Related

- [github-similar-server](https://github.com/imcuttle/github-similar-server) - A github similar static server with a markdown renderer.

## Contributing

- Fork it!
- Create your new branch:  
  `git checkout -b feature-new` or `git checkout -b fix-which-bug`
- Start your magic work now
- Make sure npm test passes
- Commit your changes:  
  `git commit -am 'feat: some description (close #123)'` or `git commit -am 'fix: some description (fix #123)'`
- Push to the branch: `git push`
- Submit a pull request :)

## Authors

This library is written and maintained by imcuttle, <a href="mailto:moyuyc95@gmail.com">moyuyc95@gmail.com</a>.

## License

MIT - [imcuttle](https://github.com/imcuttle) 🐟
