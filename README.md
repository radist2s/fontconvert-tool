# fontconvert-tool

> Helps to convert normal font into WebFont.

## Features
* Subset support
* Vertical align/line height normalization
* Hinting support

#### Installation

This plugin requires FontForge.
ttfautohint is optional(turn it off in config, see below). Tested on ttfautohint version 1.5.

### OS X

```
brew install ttfautohint fontforge --with-python
npm install fontconvert-tool --save-dev
```

### Linux
```
sudo apt-get install fontforge ttfautohint
npm install fontconvert-tool --save-dev
```

### Windows

```
npm install fontconvert-tool --save-dev
```

Then [install `ttfautohint`](http://www.freetype.org/ttfautohint/#download) (optional).

Then install `fontforge`.
* Download and install [fontforge](http://fontforge.github.io/en-US/downloads/windows/).
* Add `C:\Program Files (x86)\FontForgeBuilds\bin` to your `PATH` environment variable or [specify executable](#specifying-executables)


#### Example

```javascript
var fontconvert = require('fontconvert-tool')

fontconvert.convertFonts('./fonts-source', './fonts-out')
```


#### Selective subset example

```javascript
var fontconvert = require('fontconvert-tool')

fontconvert.convertFonts('./fonts-source', './fonts-out', {
    subset: [
        'Basic Latin', 'Latin-1 Supplement', // Latin
        'Cyrillic Russian', // Cyrillic
        'General Punctuation', 'Currency Symbols' // Punctuation
    ]
})
```

## API

### fontconvert(fontsInputDir, fontsOutDir, [config, callback])

Returns a promise.

## Config

#### subset

Type: `array`
Default: `[]`

Array list of out font subsets.
See supported unicode ranges [patterns](https://github.com/radist2s/fontconvert-tool/blob/master/lib/font-utils/lib/unicode-ranges.js).
##### Example:
```javascript
[
    'Basic Latin', 'Latin-1 Supplement', // Latin
    'Cyrillic Russian', // Cyrillic
    'General Punctuation', 'Currency Symbols' // Punctuation
]
```

#### outTypes

Type: `array`
Default: `['ttf', 'eot', 'woff', 'woff2']`.

svg-fonts not supported.

#### autoHint

Type: `boolean`
Default: `true`

Use ttfautohint util to hint fonts.

#### ttfautoHintFallbackScript

Type: `string`
Default: `latn`

#### ttfautoHintArgs:

Type: `array`
Default: `[]`

You can specify ttfautohint arguments


#### woff2NativeConverter

Type: `boolean`
Default: `true`

Use ttf2woff2 native addon. Set it false for using pure js converter in trouble case.

#### fontFileNameFilter

Type: `function(fontFileName, fontFamily, config)`

You can specify name of out file name by passing filter function

##### Example:

```javascript
function (fileName) {
    return 'prefix-' + fileName
}
```

#### fontDestinationDirFilter

Type: `function(fontDestDir, fontDestBaseDir, fontDestName, fontFamily, config)`

You can specify name of fonts out dir by passing filter function.

##### Example:

```javascript
function (dirName) {
    return path.join('subdir', dirName)
}
```

## Specifying executables

If you are using OS X or Linux usually you don't need to specify any paths if FontForge and ttfautohint installed normally.
On Windows you probably have to set paths manually(at least for FontForge).

```javascript
var fontconvert = require('fontconvert-tool')

fontconvert.fontForgeBin = 'fontforge'
fontconvert.ttfautohintBin = 'ttfautohint' // example: 'C:\Program Files (x86)\FontForgeBuilds\bin\fontforge.exe' 
```

## Logging

If you are using task manager like `gulp` you can specify logging function for pretty out log:

```javascript
var fontconvert = require('fontconvert-tool'),
    gutil = require('gutil')

fontconvert.log = gutil.log.bind(gutil)
```


## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/radist2s/fontconvert-tool/issues).

## Author

**Alex Batalov**

+ [github/radist2s](https://github.com/radist2s)

## License
Copyright © 2015 [Alex Batalov](http://tagart.ru)
Licensed under the MIT license.