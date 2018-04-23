var assert = require('assert'),
  fontgen = require('../'),
  fs = require('fs'),
  path = require('path')

var fontsSourceDir = path.resolve('test/fixtures')
var fontsDestDir = path.resolve('test/dest')

var outTypes = ['ttf', 'eot', 'woff', 'woff2']

var subset = [
  'Basic Latin',
  'Latin-1 Supplement',
  'Cyrillic Russian',
  'General Punctuation',
  'Currency Symbols',
]

describe('Convert', function() {
  it('should convert all files', function(done) {
    this.timeout(20000)

    var config = {
      subset: subset,
      outTypes: outTypes,
    }

    fontgen.convertFonts(fontsSourceDir, fontsDestDir, config, function(error) {
      if (error) {
        throw error
      }

      var openSansSemiboldItalic =
          'open-sans-semibold-italic/open-sans-semibold-italic',
        openSans = 'open-sans/open-sans'

      ;[openSans, openSansSemiboldItalic].forEach(function(font) {
        outTypes.forEach(function(type) {
          fs.accessSync(path.join(fontsDestDir, font + '.' + type), fs.R_OK)
        })
      })

      done()
    })
  })

  it('should apply filters', function(done) {
    this.timeout(20000)

    var dirCounter = 0,
      fileCounter = 0

    var config = {
      outTypes: outTypes,
      fontFileNameFilter: function() {
        return (fileCounter++).toString()
      },
      fontDestinationDirFilter: function(
        fontDestDir,
        destinationDir,
        fontDestName
      ) {
        return path.join(destinationDir, (dirCounter++).toString())
      },
    }

    fontgen.convertFonts(fontsSourceDir, fontsDestDir, config, function(error) {
      if (error) {
        throw error
      }

      for (dirCounter; dirCounter--; ) {
        outTypes.forEach(function(type) {
          fs.accessSync(
            path.join(
              fontsDestDir,
              dirCounter.toString(),
              dirCounter.toString() + '.' + type
            ),
            fs.R_OK
          )
        })
      }

      done()
    })
  })
})
