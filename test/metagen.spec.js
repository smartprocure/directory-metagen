/* eslint-env mocha */
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const mockFS = require('mock-fs')
const metagen = require('../')
const assert = require('assert')

describe('metagen', function () {
  this.timeout(15000)

  const jsGen = ext => ({
    [`file1.${ext}`]: `console.log("${ext} file 1")`,
    [`file2.${ext}`]: `console.log("${ext} file 2")`
  })
  const cssGen = ext => ({
    [`file1.${ext}`]: `#titanic.file1${ext} { float: none; }`,
    [`file2.${ext}`]: `#wife.file2${ext} { right: 100%; }`
  })

  beforeEach(() => {
    mockFS({
      'public/publicFiles': {
        js: jsGen('js'),
        jsx: jsGen('jsx'),
        ts: jsGen('ts'),
        coffee: jsGen('coffee'),
        css: cssGen('css'),
        less: cssGen('less'),
        sass: cssGen('sass'),
        'rootjs.js': 'console.log("JS file")',
        'rootcss.css': '.delorean { z-index: -1955; }',
        'file.txt': 'Text file',
        'roothtml.html': '<html>file</html>',
        'empty-dir': {}
      },
      'path/to/some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      'some/other/path': {/** another empty directory */}
    })
  })

  afterEach(() => {
    mockFS.restore()
  })

  it('Output Option', async () => {
    mockFS({
      'public/publicFiles': {
        'output': {
          'file1.js': 'console.log("JS file")',
          'file2.js': 'console.log("JS file")'
        }
      }
    })

    await metagen({
      output: '__catalog.js',
      path: 'public/publicFiles/output',
      format: metagen.formats.commonJS
    })

    const fileCommonJS = await fs.readFileAsync('public/publicFiles/output/__catalog.js', 'utf8')

    assert.equal(fileCommonJS, `module.exports = {
  'file1': require('./file1'),
  'file2': require('./file2')
};`)

    await metagen({
      output: '__catalog.js',
      path: 'public/publicFiles/output',
      format: metagen.formats.es6
    })

    const fileES6 = await fs.readFileAsync('public/publicFiles/output/__catalog.js', 'utf8')

    assert.equal(fileES6, `import file1 from './file1'
import file2 from './file2'
export default {
  file1,
  file2
}`)
  })

  it('commonJS', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.commonJS
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `module.exports = {
  'coffee/file1': require('./coffee/file1'),
  'coffee/file2': require('./coffee/file2'),
  'css/file1': require('./css/file1'),
  'css/file2': require('./css/file2'),
  'js/file1': require('./js/file1'),
  'js/file2': require('./js/file2'),
  'jsx/file1': require('./jsx/file1'),
  'jsx/file2': require('./jsx/file2'),
  'less/file1': require('./less/file1'),
  'less/file2': require('./less/file2'),
  'rootcss': require('./rootcss'),
  'roothtml': require('./roothtml'),
  'rootjs': require('./rootjs'),
  'sass/file1': require('./sass/file1'),
  'sass/file2': require('./sass/file2'),
  'ts/file1': require('./ts/file1'),
  'ts/file2': require('./ts/file2')
};`)
  })

  it('AMDCommonJS', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.AMDCommonJS
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `define(function(require) {
  return {
    'coffee/file1': require('./coffee/file1'),
    'coffee/file2': require('./coffee/file2'),
    'css/file1': require('./css/file1'),
    'css/file2': require('./css/file2'),
    'js/file1': require('./js/file1'),
    'js/file2': require('./js/file2'),
    'jsx/file1': require('./jsx/file1'),
    'jsx/file2': require('./jsx/file2'),
    'less/file1': require('./less/file1'),
    'less/file2': require('./less/file2'),
    'rootcss': require('./rootcss'),
    'roothtml': require('./roothtml'),
    'rootjs': require('./rootjs'),
    'sass/file1': require('./sass/file1'),
    'sass/file2': require('./sass/file2'),
    'ts/file1': require('./ts/file1'),
    'ts/file2': require('./ts/file2')
  };
});`)
  })

  it('amd', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.amd
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `define([
  'coffee/file1',
  'coffee/file2',
  'css/file1',
  'css/file2',
  'js/file1',
  'js/file2',
  'jsx/file1',
  'jsx/file2',
  'less/file1',
  'less/file2',
  'rootcss',
  'roothtml',
  'rootjs',
  'sass/file1',
  'sass/file2',
  'ts/file1',
  'ts/file2'
], function() {
  return {
    'coffee/file1': arguments[0],
    'coffee/file2': arguments[1],
    'css/file1': arguments[2],
    'css/file2': arguments[3],
    'js/file1': arguments[4],
    'js/file2': arguments[5],
    'jsx/file1': arguments[6],
    'jsx/file2': arguments[7],
    'less/file1': arguments[8],
    'less/file2': arguments[9],
    'rootcss': arguments[10],
    'roothtml': arguments[11],
    'rootjs': arguments[12],
    'sass/file1': arguments[13],
    'sass/file2': arguments[14],
    'ts/file1': arguments[15],
    'ts/file2': arguments[16]
  }
});`)
  })

  it('es6', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.es6
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `import coffee_file1 from './coffee/file1'
import coffee_file2 from './coffee/file2'
import css_file1 from './css/file1'
import css_file2 from './css/file2'
import js_file1 from './js/file1'
import js_file2 from './js/file2'
import jsx_file1 from './jsx/file1'
import jsx_file2 from './jsx/file2'
import less_file1 from './less/file1'
import less_file2 from './less/file2'
import rootcss from './rootcss'
import roothtml from './roothtml'
import rootjs from './rootjs'
import sass_file1 from './sass/file1'
import sass_file2 from './sass/file2'
import ts_file1 from './ts/file1'
import ts_file2 from './ts/file2'
export default {
  coffee_file1,
  coffee_file2,
  css_file1,
  css_file2,
  js_file1,
  js_file2,
  jsx_file1,
  jsx_file2,
  less_file1,
  less_file2,
  rootcss,
  roothtml,
  rootjs,
  sass_file1,
  sass_file2,
  ts_file1,
  ts_file2
}`)
  })

  it('deepES6', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.deepES6
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `import coffee_file1 from './coffee/file1'
import coffee_file2 from './coffee/file2'
import css_file1 from './css/file1'
import css_file2 from './css/file2'
import js_file1 from './js/file1'
import js_file2 from './js/file2'
import jsx_file1 from './jsx/file1'
import jsx_file2 from './jsx/file2'
import less_file1 from './less/file1'
import less_file2 from './less/file2'
import rootcss from './rootcss'
import roothtml from './roothtml'
import rootjs from './rootjs'
import sass_file1 from './sass/file1'
import sass_file2 from './sass/file2'
import ts_file1 from './ts/file1'
import ts_file2 from './ts/file2'
export default {
  coffee: {
    file1: coffee_file1,
    file2: coffee_file2
  },
  css: {
    file1: css_file1,
    file2: css_file2
  },
  js: {
    file1: js_file1,
    file2: js_file2
  },
  jsx: {
    file1: jsx_file1,
    file2: jsx_file2
  },
  less: {
    file1: less_file1,
    file2: less_file2
  },
  rootcss: rootcss,
  roothtml: roothtml,
  rootjs: rootjs,
  sass: {
    file1: sass_file1,
    file2: sass_file2
  },
  ts: {
    file1: ts_file1,
    file2: ts_file2
  }
}`)
  })

  it('deepCommonJS', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.deepCommonJS
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `module.exports = {
  "coffee": {
    "file1": require('./coffee/file1'),
    "file2": require('./coffee/file2')
  },
  "css": {
    "file1": require('./css/file1'),
    "file2": require('./css/file2')
  },
  "js": {
    "file1": require('./js/file1'),
    "file2": require('./js/file2')
  },
  "jsx": {
    "file1": require('./jsx/file1'),
    "file2": require('./jsx/file2')
  },
  "less": {
    "file1": require('./less/file1'),
    "file2": require('./less/file2')
  },
  "rootcss": require('./rootcss'),
  "roothtml": require('./roothtml'),
  "rootjs": require('./rootjs'),
  "sass": {
    "file1": require('./sass/file1'),
    "file2": require('./sass/file2')
  },
  "ts": {
    "file1": require('./ts/file1'),
    "file2": require('./ts/file2')
  }
};`)
  })

  it('deepAMDCommonJS', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.deepAMDCommonJS
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `define(function(require) {
  return {
    "coffee": {
      "file1": require('./coffee/file1'),
      "file2": require('./coffee/file2')
    },
    "css": {
      "file1": require('./css/file1'),
      "file2": require('./css/file2')
    },
    "js": {
      "file1": require('./js/file1'),
      "file2": require('./js/file2')
    },
    "jsx": {
      "file1": require('./jsx/file1'),
      "file2": require('./jsx/file2')
    },
    "less": {
      "file1": require('./less/file1'),
      "file2": require('./less/file2')
    },
    "rootcss": require('./rootcss'),
    "roothtml": require('./roothtml'),
    "rootjs": require('./rootjs'),
    "sass": {
      "file1": require('./sass/file1'),
      "file2": require('./sass/file2')
    },
    "ts": {
      "file1": require('./ts/file1'),
      "file2": require('./ts/file2')
    }
  };
});`)
  })

  it('deepAMD', async () => {
    await metagen({
      path: 'public/publicFiles/',
      format: metagen.formats.deepAMD
    })

    const file = await fs.readFileAsync('public/publicFiles/__all.js', 'utf8')

    assert.equal(file, `define([
  'coffee/file1',
  'coffee/file2',
  'css/file1',
  'css/file2',
  'js/file1',
  'js/file2',
  'jsx/file1',
  'jsx/file2',
  'less/file1',
  'less/file2',
  'rootcss',
  'roothtml',
  'rootjs',
  'sass/file1',
  'sass/file2',
  'ts/file1',
  'ts/file2'
], function() {
  return {
    "coffee": {
      "file1": "arguments[0]",
      "file2": "arguments[1]"
    },
    "css": {
      "file1": "arguments[2]",
      "file2": "arguments[3]"
    },
    "js": {
      "file1": "arguments[4]",
      "file2": "arguments[5]"
    },
    "jsx": {
      "file1": "arguments[6]",
      "file2": "arguments[7]"
    },
    "less": {
      "file1": "arguments[8]",
      "file2": "arguments[9]"
    },
    "rootcss": "arguments[10]",
    "roothtml": "arguments[11]",
    "rootjs": "arguments[12]",
    "sass": {
      "file1": "arguments[13]",
      "file2": "arguments[14]"
    },
    "ts": {
      "file1": "arguments[15]",
      "file2": "arguments[16]"
    }
  };
});`)
  })
})
