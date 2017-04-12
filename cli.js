#!/usr/bin/env node

let _ = require('lodash/fp')
let chokidar = require('chokidar')
let dashdash = require('dashdash')
let metagen = require('./index')
let { version } = require('./package.json')

var options = [{
  names: ['version', 'v'],
  type: 'bool',
  help: 'Print tool version and exit.'
}, {
  names: ['help', 'h'],
  type: 'bool',
  help: 'Print this help and exit.'
}, {
  name: 'watch',
  type: 'bool',
  help: 'watches the input path for changes and re-generates the output'
}, {
  name: 'exclusions',
  type: 'string',
  help: 'expects a comma separated list of paths to exclude'
}, {
  name: 'filter',
  type: 'string',
  help: 'expects a valid regular expression syntax to filter files'
}]

let parser = dashdash.createParser({ options })
let opts
try {
  opts = parser.parse(process.argv)
} catch (e) {
  console.log(`metagen: error: ${e.message}`)
  process.exit(1)
}

if (opts.version) {
  console.log(version)
  process.exit(0)
}

let helpText = parser.help({ includeEnv: true }).trimRight()
let help = ({ code } = { code: 0 }) => {
  parser.help({includeEnv: true}).trimRight()
  console.log('usage: metagen [OPTIONS] <path> [format] [output]\n' + 'options:\n' + helpText)
  process.exit(code)
}

if (opts.help) {
  help()
}

let [ path, formatStr = 'amd', output = '__all.js' ] = opts._args

let format = metagen.formats[formatStr]

if (!(path && format)) {
  help(1)
}

let generate = () => metagen({
  path,
  format,
  output,
  exclusions: opts.exclusions && _.split(',', opts.exclusions),
  filter: opts.filter && _.filter(str => (new RegExp(opts.filter)).test(str))
})

opts.watch
  ? chokidar.watch(path, { ignored: path + '/' + output }).on('all', generate)
  : generate()
