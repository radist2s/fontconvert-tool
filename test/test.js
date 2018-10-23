var assert = require('assert'),
    fontgen = require('../'),
    fs = require('fs'),
    path = require('path')

var fontsSourceDir = path.resolve('test/fixtures')
var fontsDestDir = path.resolve('test/dest')

var outTypes = ['ttf', 'eot', 'woff', 'woff2']

var subset = [
    'Basic Latin', 'Latin-1 Supplement',
    'General Punctuation', 'Currency Symbols',
    [
        'French',
        [
            [
                '0x00C0', '0x0E0',
                '0x00C2', '0x0E2',
                '0x00C6', '0x0E6',
                '0x00C8', '0x0E8',
                '0x00C9', '0x0E9',
                '0x00CA', '0x0EA',
                '0x00CB', '0x0EB',
                '0x00CE', '0x0EE',
                '0x00CF', '0x0EF',
                '0x00D4', '0x0F4',
                '0x0152', '0x0153',
                '0x00D9', '0x0F9',
                '0x00DB', '0x0FB',
                '0x00DC', '0x0FC',
                '0x0178', '0x0FF',
                '0x00C7', '0x0E7'
            ]
        ]
    ]
]

describe('Convert', function () {
    it('should convert all files', function (done) {
        this.timeout(20000)

        var config = {
            subset: subset,
            outTypes: outTypes
        }

        fontgen.convertFonts(fontsSourceDir, fontsDestDir, config, function (error) {
            if (error) {
                throw error
            }

            var openSansSemiboldItalic = 'open-sans-semibold-italic/open-sans-semibold-italic',
                openSans = 'open-sans/open-sans';

            [openSans, openSansSemiboldItalic].forEach(function (font) {
                outTypes.forEach(function (type) {
                    fs.accessSync(path.join(fontsDestDir, font + '.' + type), fs.R_OK)
                })
            })

            done()
        })
    })

    it('should apply filters', function (done) {
        this.timeout(20000)

        var dirCounter = 0,
            fileCounter = 0

        var config = {
            outTypes: outTypes,
            fontFileNameFilter: function () {
                return (fileCounter++).toString()
            },
            fontDestinationDirFilter: function (fontDestDir, destinationDir, fontDestName) {
                return path.join(destinationDir, (dirCounter++).toString())
            }
        }

        fontgen.convertFonts(fontsSourceDir, fontsDestDir, config, function (error) {
            if (error) {
                throw error
            }

            for (dirCounter; dirCounter--;) {
                outTypes.forEach(function (type) {
                    fs.accessSync(path.join(fontsDestDir, dirCounter.toString(), dirCounter.toString() + '.' + type), fs.R_OK)
                })
            }

            done()
        })
    })
});