# Hibiki HTML Libraries

Repository that holds named Hibiki HTML Libraries.  Deployed to
https://cdn.hibikihtml.com/libs/.

## Scaffolding

This repository includes gulp, webpack, and sass, to help with building Hibiki HTML
libraries that integrate 3rd party JavaScript libraries, custom JavaScript, external
React controls, and SASS integration.

Gulp ties all of these resources together into a single HTML file that inlines the
JavaScript and CSS bundles to produce a versioned Hibiki HTML library.  Because all
of the code is inline (or references stable 3rd party CDNs), the built library files
can be easily copied or inlined into existing code.

Gulp will read the 'version' key in your <define-library> and output
your bundled library HTML to './dist/libs/[library-name]/[version]/[base-name].html'
(dev builds are labeled as ".dev.html").

## Adding a New Library

Fork this repository, and add your new library to the 'LIBS' array at the top of gulpfile.js.
Create the corresponding directory in the "src" directory.

Your "src" directory can contain:

* (required) an HTML file named with the base name of your library (copy 'library-template.html').  e.g. for "hibiki/bulma" your base library file would be src/hibiki/bulma/bulma.html.  This is the main file that will contain the Hibiki <define-library> tag.
* If you need custom JavaScript or TypeScript code add an 'index.js' or 'index.ts' file to your src directory.  Webpack will be run, and the resulting bundle will be embedded into your library
* Any ".css" files in your src directory will be embedded into your library
* Any ".scss" files will be processed with SASS and then embedded into your library
* Any "_*.html" files (must start with an underscore) will be embedded into your library (can be used to define components in separate files).

## Gulp Commands

* **clean** - cleans build directory
* **build** - builds dev and prod builds
* **builddev** - builds dev libraries (libname.dev.html)
* **buildprod** - builds prod libraries
* **watch** - builds dev libraries, watches for changes
* **webserver** - builds dev libraries, watches for changes, and starts a webserver on port '5005' to serve the libraries (/dist directory)
* **builddev:[library-name]** - builds dev version of specific library
* **buildprod:[library-name]** - builds prod version of specific library
* **watch:[library-name]** - builds dev version of specific library, watches for changes
* **clean:[library-name]** - cleans build directory for library

