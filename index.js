var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    fontUtils = require('./lib/font-utils'),
    util = require('util')

exports.outTypes = ['eot', 'woff', 'woff2']
exports.log = console.log.bind(console)

exports.defaultConfig = {
    autoHint: true,
    subset: false,
    outTypes: null,
    woff2NativeConverter: false
}

exports.createFontName = function createFontName(fontName) {
    return fontName.replace(/\s+/g, '-').replace(/[-_]+/g, '-').toLowerCase()
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
            function (fall) {
                fontUtils.fontFamily(sourceFontPath, function (_fontFamily) {
                    fontFamily = _fontFamily
                    fontFamilyLogging = '"' + fontFamily + '"'

                    if (!fontFamily) {
                        return fall(path.basename(sourceFontPath) + ' has no family name')
                    }

                    exports.log('Converting', fontFamilyLogging)

                    fall(null)
                })
            },
            function (fall) {
                fontDestName = exports.createFontName(fontFamily)
                fontDestDir =  path.resolve(path.join(destinationDir, fontDestName))
                normalizedFontPath = path.join(fontDestDir, fontDestName + '.ttf')

                try {
                    fs.mkdirSync(fontDestDir)
                }
                catch(e) {
                    if (e.code !== 'EEXIST') {
                        return fall('Can`t create dir ' + fontDestDir)
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

                fontUtils.fontSubset(config.subset, normalizedFontPath, normalizedFontPath, fall)

                exports.log('Subset applied for', fontFamilyLogging)
            },
            function hintFont(fall) {
                if (!config.autoHint) {
                    return fall(null)
                }

                fontUtils.autoHint(normalizedFontPath, normalizedFontPath, fall)

                exports.log(fontFamilyLogging, 'hinted')
            },
            function convertFont(fall) {
                var normalizedTtf,
                    ttf

                async.eachSeries(config.outTypes, function (type, _nextEach) {
                    var convertedFontPath = path.join(fontDestDir, fontDestName + '.' + type)

                    function nextEach(error) {
                        exports.log(fontFamilyLogging, 'converted to ' + type.toUpperCase())
                        _nextEach(error)
                    }

                    if (type === 'eot') {
                        var ttf2eot = require('ttf2eot')

                        ttf = new Uint8Array(normalizedTtf = normalizedTtf || fs.readFileSync(normalizedFontPath))
                        var eot = new Buffer(ttf2eot(ttf).buffer)

                        fs.writeFileSync(convertedFontPath, eot)

                        nextEach(null)
                    }
                    else if (type === 'woff2') {
                        var ttf2woff2 = config.woff2NativeConverter ? require('ttf2woff2') : require('ttf2woff2/jssrc')

                        ttf = normalizedTtf = (normalizedTtf || fs.readFileSync(normalizedFontPath))

                        fs.writeFileSync(convertedFontPath, ttf2woff2(ttf))

                        nextEach(null)
                    }
                    else {
                        fontUtils.convert(normalizedFontPath, convertedFontPath, nextEach)
                    }
                }, fall)
            }
        ],
        callback
    )
}

exports.getSourceFontsPath = function (sourceFontsDir, callback) {
    var fonts = []

    fs.readdir(sourceFontsDir, function (error, files) {
        if (error) {
            return callback(error)
        }

        async.eachSeries(files, function (fontFile, nextEach) {
            var sourceFont = path.join(sourceFontsDir, fontFile)

            if (!fs.statSync(sourceFont).isFile()) {
                return nextEach()
            }

            fonts.push(sourceFont)

            nextEach(null)
        }, function (error) {
            callback(error, fonts)
        })
    })
}

exports.convertFonts = function convertFonts(sourceFontsDir, destinationDir, callback, config) {
    config = config || {}

    config.sourceFontsDir = sourceFontsDir
    config.destinationDir = destinationDir

    var _config = util._extend({}, exports.defaultConfig)
    config = util._extend(_config, config)

    if (!config.outTypes) {
        config.outTypes = exports.outTypes
    }

    async.waterfall(
        [
            function (fall) {
                exports.getSourceFontsPath(sourceFontsDir, fall)
            },
            function(fonts, fall) {
                async.eachSeries(fonts, function (sourceFontPath, nextEach) {
                    async.waterfall(
                        [
                            function (fall) {
                                exports.convertFont(sourceFontPath, config, fall)
                            }
                        ],
                        nextEach
                    )
                }, fall)
            }
        ],
        callback
    )
}