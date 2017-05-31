// Inspired by (but complete rewrite of) requirejs-metagen
let _ = require('lodash/fp')
let Promise = require('bluebird')
let readDir = Promise.promisify(require('recursive-readdir'))
let fs = Promise.promisifyAll(require('fs'))
let path = require('path')
let beautify = require('js-beautify').js_beautify

let slice = start => thing => thing.slice(start)

// Path Utils
let sanitizeFileName = file => file.replace(/-|\.|\//g, '_')
let stripLeadingSlash = file => file.replace(/^\//g, '')
let filename = file => noExt(_.last(file.split('/')))
let relativeFilenames = (dir, exclusions) => readDir(dir, exclusions).map(slice(dir.length))
let noExt = file => file.slice(0, _.lastIndexOf('.', file))
let test = regex => str => regex.test(str) // This mirrors the test function in Ramda: http://ramdajs.com/docs/

// Core
let defaultFilter = _.filter(test(/.js|.html|.jsx|.ts|.coffee|.less|.css|.sass|.hbs|.ejs/))
let metagen = options => relativeFilenames(options.path, options.exclusions || [options.output || '__all.js'])
  .then(options.filter || defaultFilter)
  .then(files => fs.writeFileAsync(
    path.join(options.path, options.output || '__all.js'),
    beautify(options.format(files.map(stripLeadingSlash), options), {indent_size: options.indent_size || 2})
  ))

metagen.utils = {
  relativeFilenames,
  noExt,
  sanitizeFileName,
  filename
}

// Output formats
metagen.formats = {}
metagen.formats.commonJS = files => `define(function(require) {
  return {
    ${files.map(noExt).map(file => `'${file}': require('./${file}')`).join(',\n')}
  };
});`
metagen.formats.amd = files => `define([
  ${files.map(file => `'${noExt(file)}'`).join(',\n')}
], function() {
  return {
    ${files.map((file, i) => `'${noExt(file)}': arguments[${i}]`).join(',\n')}
  }
});`
metagen.formats.es6 = files => `${
  files.map(file => `import ${varName(file)} from './${noExt(file)}'`).join('\n')
}
export default {
  ${files.map(varName).join(',\n')}
}`

// Deep Formats
let deepKeys = _.map(_.flow(noExt, _.replace(/\//g, '.')))
let stringify = x => JSON.stringify(x, null, 4)
let indent = _.replace(/\n/g, '\n    ')
let unquote = _.replace(/"require(.*)'\)"/g, "require$1')")
let deepify = _.flow(_.zipObjectDeep, stringify, indent, unquote)

metagen.formats.deepCommonJS = files => `define(function(require) {
  return ${deepify(deepKeys(files), files.map(file => `require('./${noExt(file)}')`))};
});`
metagen.formats.deepAMD = files => `define([
  ${files.map(file => `'${noExt(file)}'`).join(',\n    ')}
], function() {
  return ${deepify(deepKeys(files), files.map((file, i) => `arguments[${i}]`))};
});`
metagen.formats.deepES6 = files => `${
  files.map(file => `import ${varName(file)} from './${noExt(file)}'`).join('\n')
}
export default ${deepify(deepKeys(files), files.map(varName)).replace(/"/g, '')}`

var stripIndex = file => file.replace(/\/index$/, '')
var varName = _.flow(noExt, stripIndex, sanitizeFileName)

module.exports = metagen
