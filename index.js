// Inspired by (but complete rewrite of) requirejs-metagen
var _           = require('lodash/fp'),
    Promise     = require('bluebird'),
    readDir     = Promise.promisify(require('recursive-readdir')),
    fs          = Promise.promisifyAll(require('fs'));

// Path Utils
var filesRelative = (dir, ex) => readDir(dir, ex).map(x => x.slice(dir.length));
var noExt = file => file.slice(0, _.lastIndexOf('.', file));
var test = x => y => x.test(y);

// Core
var filter = _.filter(test(/.js|.html|.jsx|.ts|.coffee|.less|.css|.sass|.hbs|.ejs/));
var metagen = dir => filesRelative(dir.path, dir.exclusions || [dir.output || '__all.js'])
    .then(dir.filter || filter)
    .then(files => fs.writeFileAsync(dir.path + (dir.output || '__all.js'), dir.format(files, dir)));

// Formats
metagen.formats = {};
metagen.formats.commonJS = files => `define(function(require) {
    return {
        ${ files.map(noExt).map(file => `'${ file }': require('./${ file }')`).join(',\n        ') }
    };
});`;
metagen.formats.amd = files => `define([
    ${ files.map(file => `'${ noExt(file) }'`).join(',\n    ') }
], function() {
    return {
        ${ files.map((file, i) => `'${ noExt(file) }': arguments[${ i }]`).join(',\n        ') }
    }
});`;

// Deep Formats
var deepKeys    = _.map(_.flow(noExt, _.replace(/\//g, '.'))),
    stringify   = x => JSON.stringify(x, null, 4),
    indent      = _.replace(/\n/g, '\n    '),
    unquote     = _.replace(/"require(.*)'\)"/g, "require$1')"),
    deepify     = _.flow(_.zipObjectDeep, stringify, indent, unquote);
    
metagen.formats.deepCommonJS = files => `define(function(require) {
    return ${ deepify(deepKeys(files), files.map(file => `require('./${ noExt(file) }')`))};
});`;
metagen.formats.deepAMD = files => `define([
    ${ files.map(file => `'${ noExt(file) }'`).join(',\n    ') }
], function() {
    return ${ deepify(deepKeys(files), files.map((file, i) => `arguments[${ i }]`))};
});`;

module.exports = metagen;