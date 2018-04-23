var async = require('async'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  path = require('path'),
  fontUtils = require('./lib/font-utils'),
  util = require('util'),
  _ = require('lodash')

exports.outTypes = ['ttf', 'eot', 'woff', 'woff2']

exports.log = console.log.bind(console)

exports.sourceFontTypes = [
  'sfd',
  'ttf',
  'otf',
  'ps',
  'sfnt',
  'bdf',
  'fon',
  'fnt',
  'svg',
  'ufo',
]

Object.defineProperty(exports, 'fontForgeBin', {
  get: function() {
    return fontUtils.fontForgeBin
  },
  set: function(binPath) {
    fontUtils.fontForgeBin = binPath
  },
})
Object.defineProperty(exports, 'ttfautohintBin', {
  get: function() {
    return fontUtils.fontForgeBin
  },
  set: function(binPath) {
    fontUtils.fontForgeBin = binPath
  },
})

exports.defaultConfig = {
  autoHint: true,
  subset: false,
  outTypes: null,
  woff2NativeConverter: true,
  ttfautoHintFallbackScript: 'latn',
  ttfautoHintArgs: [],
  fontFileNameFilter: null,
  fontDestinationDirFilter: null,
}

exports.createFontFileName = function createFontFileName(fontFamily, config) {
  var fontFileName = fontFamily
    .replace(/\s+/g, '-')
    .replace(/[-_]+/g, '-')
    .toLowerCase()

  if (config && config.fontFileNameFilter instanceof Function) {
    fontFileName = config.fontFileNameFilter(fontFileName, fontFamily, config)
  }

  return fontFileName
}

exports.convertFont = function convertFont(sourceFontPath, config, callback) {
  var destinationDir = config.destinationDir

  var fontDestName,
    fontDestDir,
    normalizedFontPath,
    fontFamily,
    fontFamilyLogging

  async.waterfall(
    [
      function(fall) {
        fontUtils.fontFamily(sourceFontPath, function(_fontFamily) {
          fontFamily = _fontFamily

          if (!fontFamily) {
            fontFamily = path
              .basename(sourceFontPath, path.extname(sourceFontPath))
              .toLowerCase()
              .replace(/[-_\s]+/g, '-')
          }

          fontFamilyLogging = '"' + fontFamily + '"'

          exports.log('Converting', fontFamilyLogging)

          fall(null)
        })
      },
      function(fall) {
        fontDestName = exports.createFontFileName(fontFamily, config)
        fontDestDir = path.resolve(path.join(destinationDir, fontDestName))
        fontTempDir = path.resolve(destinationDir, 'temp')

        if (config && config.fontDestinationDirFilter instanceof Function) {
          fontDestDir = config.fontDestinationDirFilter(
            fontDestDir,
            destinationDir,
            fontDestName,
            fontFamily,
            config
          )
        }

        normalizedFontPath = path.join(fontTempDir, fontDestName + '.ttf')

        try {
          fs.mkdirSync(fontDestDir)
        } catch (e) {
          if (e.code !== 'EEXIST') {
            return fall('Can`t create dir ' + fontDestDir)
          }
        }

        try {
          fs.mkdirSync(fontTempDir)
        } catch (e) {
          if (e.code !== 'EEXIST') {
            return fall('Can`t create dir ' + fontTempDir)
          }
        }

        fall(null)
      },
      function normalizeFont(fall) {
        fontUtils.convert(sourceFontPath, normalizedFontPath, fall)
      },
      function subsetFont(fall) {
        if (!config.subset) {
          return fall(null)
        }

        fontUtils.fontSubset(
          config.subset,
          normalizedFontPath,
          normalizedFontPath,
          fontTempDir,
          fall
        )

        exports.log('Subset applied for', fontFamilyLogging)
      },
      function hintFont(fall) {
        if (!config.autoHint) {
          return fall(null)
        }

        fontUtils.autoHint(normalizedFontPath, normalizedFontPath, config, fall)

        exports.log(fontFamilyLogging, 'hinted')
      },
      function convertFont(fall) {
        var normalizedTtf, ttf

        async.eachSeries(
          config.outTypes,
          function(type, _nextEach) {
            var convertedFontPath = path.join(
              fontDestDir,
              fontDestName + '.' + type
            )

            function nextEach(error) {
              exports.log(
                fontFamilyLogging,
                'converted to ' + type.toUpperCase()
              )
              _nextEach(error)
            }

            if (type === 'eot') {
              var ttf2eot = require('ttf2eot')

              ttf = new Uint8Array(
                (normalizedTtf =
                  normalizedTtf || fs.readFileSync(normalizedFontPath))
              )
              var eot = new Buffer(ttf2eot(ttf).buffer)

              fs.writeFileSync(convertedFontPath, eot)

              nextEach(null)
            } else if (type === 'woff2') {
              var ttf2woff2 = config.woff2NativeConverter
                ? require('ttf2woff2')
                : require('ttf2woff2/jssrc')

              ttf = normalizedTtf =
                normalizedTtf || fs.readFileSync(normalizedFontPath)

              fs.writeFileSync(convertedFontPath, ttf2woff2(ttf))

              nextEach(null)
            } else if (type === 'ttf') {
              nextEach(null) // ttf was converted previously
            } else {
              fontUtils.convert(normalizedFontPath, convertedFontPath, nextEach)
            }
          },
          fall
        )
      },
      function cleanUp(fall) {
        rimraf(fontTempDir, fall)
      },
    ],
    callback
  )
}

exports.getSourceFontsPath = function(sourceFontsDir, callback) {
  var fonts = []

  var sourceFontTypes = exports.sourceFontTypes

  fs.readdir(sourceFontsDir, function(error, files) {
    if (error) {
      return callback(error)
    }

    async.eachSeries(
      files,
      function(fontFile, nextEach) {
        if (sourceFontTypes instanceof Array && sourceFontTypes.length) {
          var fontSupported = sourceFontTypes.some(function(type) {
            return new RegExp('.' + type + '$', 'i').test(fontFile)
          })

          if (!fontSupported) {
            return nextEach()
          }
        }

        var sourceFont = path.join(sourceFontsDir, fontFile)

        if (!fs.statSync(sourceFont).isFile()) {
          return nextEach()
        }

        fonts.push(sourceFont)

        nextEach(null)
      },
      function(error) {
        callback(error, fonts)
      }
    )
  })
}

exports.convertFonts = function convertFonts(
  sourceFontsDir,
  destinationDir,
  callback,
  config
) {
  if (config instanceof Function) {
    var _callback = config
    config = callback
    callback = _callback
  }

  config = config || {}

  config.sourceFontsDir = sourceFontsDir
  config.destinationDir = destinationDir

  var _config = _.extend({}, exports.defaultConfig)
  config = _.extend(_config, config)

  if (!config.outTypes) {
    config.outTypes = exports.outTypes
  }

  return new Promise(function(resolve, reject) {
    async.waterfall(
      [
        function(fall) {
          exports.getSourceFontsPath(sourceFontsDir, fall)
        },
        function(fonts, fall) {
          async.eachSeries(
            fonts,
            function(sourceFontPath, nextEach) {
              async.waterfall(
                [
                  function(fall) {
                    exports.convertFont(sourceFontPath, config, fall)
                  },
                ],
                nextEach
              )
            },
            fall
          )
        },
      ],
      function(error) {
        ;(error ? reject : resolve).apply(undefined, arguments)

        if (callback instanceof Function) {
          callback.apply(undefined, arguments)
        }
      }
    )
  })
}
