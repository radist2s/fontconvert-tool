exports.fontForgeBin = 'fontforge'
exports.ttfautohintBin = 'ttfautohint'

var scriptsDir = __dirname + '/forge-scripts'

var child_process = require('child_process'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    os = require('os')

exports.maxBuffer = 1024 * 1024 * 10

exports.fontFamily = function fontFamily(src, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    child_process.execFile(exports.fontForgeBin, ['-lang=ff', '-script', forgeScript('fontfamily'), src], function (err, fontFamily) {
        if (err) {
            console.error(err)
            return callback()
        }

        callback((fontFamily || '').trim())
    })
}

exports.autoHint = function autoHint(src, dst, config, callback) {
    var args = ['--no-info', '--windows-compatibility']

    if (config) {
        if (config.ttfautoHintFallbackScript) {
            args = args.concat(['--fallback-script=' + config.ttfautoHintFallbackScript])
        }

        if (config.ttfautoHintArgs instanceof Array) {
            args = args.concat(config.ttfautoHintArgs)
        }
    }

    args.push(src)

    child_process.execFile(exports.ttfautohintBin, args,
        {maxBuffer: exports.maxBuffer, encoding: 'buffer'}, function (error, output) {
        if (error) {
            return callback(error)
        }

        fs.writeFile(dst, output, callback)
    })
}

exports.convert = function convert(src, dst, callback) {
    child_process.execFile(exports.fontForgeBin, ['-lang=ff', '-script', forgeScript('convert'), src, dst], function (error) {
        callback(error)
    })
}

exports.subsetRanges = subsetRanges

exports.fontSubset = function (rangesNames, sourceFontPath, outSubsetFont, callback) {
    if (!rangesNames) {
        return callback(null)
    }

    var subset = subsetRanges(rangesNames)

    if (!subset || !subset.length) {
        callback('No input subset')
    }

    var unicodeAssignments = [],
        selections = []

    subset.forEach(function (code) {
        code = '0x' + toHex(code)

        // SelectIf(%u)
        unicodeAssignments.push('Select(%u); SetUnicodeValue(%u);'.replace(/%u/g, code))
        // SelectMoreIf(%u)
        selections.push('SelectMore(%u);'.replace(/%u/g, code))
    })

    var command = fs.readFileSync(forgeScript('subset')).toString()

    command = os.EOL + command
        .replace(/%selections%/, selections.join(os.EOL))
        .replace(/%unicode_assignments%/, unicodeAssignments.join(os.EOL))
        //.replace(/(\r\n|\n)/g, '')

    child_process.execFile(exports.fontForgeBin, ['-lang=ff', '-c', command, sourceFontPath, outSubsetFont], function (error) {
        callback(error)
    })
}

function forgeScript(script) {
    return path.join(scriptsDir, script)
}

function toDecimal(hex) {
    return parseInt(hex, 16)
}

function toHex(decimal) {
    return decimal.toString(16)
}

function subsetRanges(_ranges) {
    var rangesNames

    if (_ranges instanceof Array) {
        rangesNames = _ranges
    }
    else {
        rangesNames = _.toArray(arguments)
    }

    if (!rangesNames.length) {
        return
    }

    var unicodeRanges = require('./lib/unicode-ranges')

    rangesNames.forEach(function (subset, index) {
        if (subset instanceof Array) {
            unicodeRanges.push(subset)
            rangesNames[index] = subset[0]
        }
    })

    var subset = []

    unicodeRanges.forEach(function (data) {
        var name = data[0],
            ranges = data[1]

        if (rangesNames.indexOf(name) < 0) {
            return
        }



        var newChars = []

        if (ranges[0] instanceof Array) {
            ranges = ranges[0]

            ranges.forEach(function (hexCode) {
                newChars.push(toDecimal(hexCode))
            })
        }
        else {
            var hexRange = ranges[0].split('-')

            var start = hexRange[0],
                end = hexRange[1]

            newChars = _.range(toDecimal(start), toDecimal(end) + 1)
        }

        subset = _.union(subset, newChars)
    })

    return subset
}