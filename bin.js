#!/usr/bin/env node
/**
 * @file bin
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */
const live = require('./')
const pkg = require('./package')
const nps = require('path')

const dv = {
  port: 9090,
  baseUrl: '/'
}

const argv = require('minimist')(process.argv.slice(2), {
  default: dv,
  alias: {
    help: 'h',
    version: 'v',
    port: 'p',
    'base-url': 'b'
  },

  boolean: ['cz-in-global', 'help', 'version']
})

const opt = {
  port: argv.port,
  baseUrl: argv['base-url']
}
const root = !argv._[0] ? process.cwd() : nps.resolve(argv._[0])

if (argv.help) {
  console.log(`  Usage
    $ ${pkg.name} <path> [options]
    
  Options
    
    --help, -h            Show help information in stdout
    --version, -v         Show version information in stdout
    --port, -p            Assign ${pkg.name}'s server port        [Default: ${dv.port}]
    --base-url, -b        Assign base url                         [Default: ${dv.baseUrl}]
  `)
} else if (argv.version) {
  console.log(pkg.version)
} else {
  live(root, opt)
}
