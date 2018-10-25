# directory-metagen

[![CircleCI](https://circleci.com/gh/smartprocure/directory-metagen.svg?style=svg)](https://circleci.com/gh/smartprocure/directory-metagen)
[![Greenkeeper badge](https://badges.greenkeeper.io/smartprocure/directory-metagen.svg)](https://greenkeeper.io/)
[![npm version](https://badge.fury.io/js/directory-metagen.svg)](https://badge.fury.io/js/directory-metagen) ![dependencies](https://david-dm.org/smartprocure/directory-metagen.svg) [![Code Climate](https://codeclimate.com/github/smartprocure/directory-metagen/badges/gpa.svg)](https://codeclimate.com/github/smartprocure/directory-metagen)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Generates directory meta files for things such as including entire directories in requirejs.

Started as a feature request on `requirejs-metagen` but has grown beyond it (as it is no longer tied to requirejs).

_Requires Node Version >= 4.3.2_
_Works on Linux, OSX and Windows_

# API
`directory-metagen` takes an object with the following parameters:

| Name | Description |
| --- | --- |
|`path` | The directory in which to look |
|`format` | The format function to use to generate the output |
|`output` | The relative destination file path (optional, defaults to `__all.js`) |
|`exclusions` | An array of minimatch glob for exclusion, see recursive-readdir for more info |
|`filter` | A function which will filter the matched files, typically to whitelist extensions. Defaults to `/.js|.html|.jsx|.ts|.coffee|.less|.css|.sass|.hbs|.ejs/` |


## Customization

This library takes a custom format parameter, which is a function that recieves the (recursive) list of files in a directory and then generates an output file


# Supported Formats
For each of the examples below, we will be running the metagen against the example directory tree below.
```
some_dependencies/
├── dependency-a/
│   ├── foo.js
├── dependency-b/
│   ├── bar.js
│   └── baz.js
└── dependency-empty/
```

## amd
`amd` format is the traditional `define([], function() { })` syntax. The generated object is a hash where the keys are the paths to the files without extensions, and the values are the required in modules
### Example output
```js
// some_dependencies/__all.js
define([
  'dependency-a/foo',
  'dependency-b/bar',
  'dependency-b/baz'
], function() {
  return {
    'dependency-a/foo': arguments[0],
    'dependency-b/bar': arguments[1],
    'dependency-b/baz': arguments[2]
  }
});
```

## commonJS
`commonJS` format is the CommonJS sugar syntax supported by NodeJS `module.exports = {}`. The generated object is a hash where the keys are the paths to the files without extensions, and the values are the required in modules
### Example output
```js
// some_dependencies/__all.js
module.exports = {
  'dependency-a/foo': require('./dependency-a/foo'),
  'dependency-b/bar': require('./dependency-b/bar'),
  'dependency-b/baz': require('./dependency-b/baz')
};
```
 
## AMDCommonJS
`commonJS` format is the CommonJS sugar syntax supported by requirejs `define(function(require) {})`. The generated object is a hash where the keys are the paths to the files without extensions, and the values are the required in modules
### Example output
```js
// some_dependencies/__all.js
define(function(require) {
  return {
    'dependency-a/foo': require('./dependency-a/foo'),
    'dependency-b/bar': require('./dependency-b/bar'),
    'dependency-b/baz': require('./dependency-b/baz')
  };
});
```

## es6
`es6` format outputs a es6 module (e.g. `import * as FileName from 'filename'` followed by `export { FileName }`). Also supports sanitizing filenames and deeply nested directory structures, and automatically allows referencing `index` js files by the parent folder name.
### Example output
```js
import * as dependency_a_foo from 'dependency-a/foo'
import * as dependency_b_baz from 'dependency-b/baz'
import * as dependency_b_bar from 'dependency-b/bar'
export {
  dependency_a_foo,
  dependency_b_baz,
  dependency_b_bar
}
```

## deepAMD
`deepAMD` format is just like `amd`, except that the object is nested so directories have child properties corresponding to files (e.g. `{ a: { b: { c: file } } }` instead of `{ 'a.b.c': file }`) 
### Example output
```js
// some_dependencies/__all.js
define([
  'dependency-a/foo',
  'dependency-b/bar',
  'dependency-b/baz'
], function() {
  return {
    "dependency-a": {
      "foo": "arguments[0]"
    },
    "dependency-b": {
      "bar": "arguments[1]",
      "baz": "arguments[2]"
    }
  };
});
```

## deepCommonJS
`deepCommonJS` format is just like `commonJS`, except that the object is nested so directories have child properties corresponding to files (e.g. `{ a: { b: { c: file } } }` instead of `{ 'a.b.c': file }`)
### Example output
```js
// some_dependencies/__all.js
module.exports = {
  "dependency-a": {
    "foo": require('./dependency-a/foo')
  },
  "dependency-b": {
    "baz": require('./dependency-b/baz'),
    "bar": require('./dependency-b/bar')
  }
};
```

## deepAMDCommonJS
`deepAMDCommonJS` format is just like `AMDCommonJS`, except that the object is nested so directories have child properties corresponding to files (e.g. `{ a: { b: { c: file } } }` instead of `{ 'a.b.c': file }`)
### Example output
```js
// some_dependencies/__all.js
define(function(require) {
  return {
    "dependency-a": {
      "foo": require('./dependency-a/foo')
    },
    "dependency-b": {
      "baz": require('./dependency-b/baz'),
      "bar": require('./dependency-b/bar')
    }
  };
});
```

## deepES6
`deepES6` format is just like `es6`, except that the resulting object is nested so directories have child properties corresponding to files (e.g. `{ a: { b: { c: file } } }` instead of `{ 'a.b.c': file }`)
### Example output
```js
import * as dependency_a_foo from 'dependency-a/foo'
import * as dependency_b_baz from 'dependency-b/baz'
import * as dependency_b_bar from 'dependency-b/bar'
export {
  dependency_a: {
    foo: dependency_a_foo
  },
  dependency_b: {
    baz: dependency_b_baz,
    bar: dependency_b_bar
  }
}
```

# Usage with Gulp
Here's an example using with gulp including a watch mode:

```js
// gulpfile.js
var gulp = require('gulp');
var Promise = require('bluebird');
var metagen = require('directory-metagen');
var metagenPaths = [{
  path: __dirname + '/public/someDir/',
  // exclusions: ['all.js'],
  format: metagen.formats.deepCommonJS
  //output: '__generated-all.js' // relative to path
}];
gulp.task('metagen', x => Promise.map(metagenPaths, metagen));
gulp.task('metagen-watch', function() {
  // Watch for files added and removed
  require('chokidar').watch(_.map(metagenPaths, 'path'))
    .on('add', x => gulp.start('metagen'))
    .on('unlink', x => gulp.start('metagen'));
});
```

# CLI

This repo also provides a CLI. This CLI comes free once
directory-metagen is installed, and is available in npm scripts as
`metagen`, and directly at `./node_modules/.bin/metagen`.

The CLI can be used as follows:
```
$ ./node_modules/.bin/metagen
usage: metagen [OPTIONS] <path> [format] [output]
options:
    -v, --version     Print tool version and exit.
    -h, --help        Print this help and exit.
    --watch           watches the input path for changes and re-generates the
                      output.
    --exclusions=ARG  expects a comma separated list of paths to exclude.
    --filter=ARG      expects a valid regular expression syntax to filter files.
```

The path is sent as the first parameter to the CLI (without considering the options, which are preceded either by `-` or by `--`). For example, if your current directory is like:

```
src/
    pages/
        page1.js
public/
...
```

You can run: `./node_modules/.bin/metagen src/pages/ deepES6`, and it will produce an `__all.js` file inside of `src/pages/`.

You can also specify the output file with `./node_modules/.bin/metagen src/pages/ deepES6 myCustomFile.js`, which will produce the output in `src/pages/myCustomFile`.
