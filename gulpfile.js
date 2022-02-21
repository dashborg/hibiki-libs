// Copyright 2022 Dashborg Inc
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

var gulp = require("gulp");
var inject = require("gulp-inject");
var rename = require("gulp-rename");
var watch = require("gulp-watch");
var replace = require("gulp-replace");
var connect = require("gulp-connect");
var debug = require("gulp-debug");
var sass = require("gulp-sass")(require("sass"));
var path = require("path");
var fs = require("fs");
var webpack = require("webpack-stream");
var del = require("del");
var dayjs = require("dayjs");
var cors = require("cors");

let LIBS = [
    "hibiki/code-highlight",
    "hibiki/codemirror",
    "hibiki/bulma",
];

// # base, gulp-only tasks (files already in /build)
// [gulp|sass|webpack]:builddev:[LIB]
// [gulp|sass|webpack]:buildprod:[LIB]
// [gulp|sass|webpack]:watch:[LIB]
// 
// # adds webpack+gulp+sass
// builddev:[LIB]
// watch:[LIB]
// buildprod:[LIB]
// 
// # all tasks
// builddev:all
// buildprod:all
// watch:all
// webserver:base
// 
// # webpack 'all' tasks
// webpack:watch:all
// webpack:builddev:all
// webpack:buildprod:all
// 
// # top-level 'all' tasks
// clean
// builddev
// buildprod
// watch
// webserver - webserver + watch

let versionRegexp = /^v\d+\.\d+\.\d+$/;
let BUILD = makeBuildStr();

function makeBuildStr() {
    let buildStr = dayjs().format("YYYYMMDD-HHmmss");
    return buildStr;
}

function libJsIndexFile(libName) {
    let srcDir = "./src/" + libName + "/";
    if (fs.existsSync(srcDir + "index.ts")) {
        return srcDir + "index.ts";
    }
    if (fs.existsSync(srcDir + "index.js")) {
        return srcDir + "index.js";
    }
    let baseName = path.basename(srcDir);
    if (fs.existsSync(srcDir + baseName + ".ts")) {
        return srcDir + baseName + ".ts";
    }
    if (fs.existsSync(srcDir + baseName + ".js")) {
        return srcDir + baseName + ".js";
    }
    return null;
}

function readLibVersion(libFileName, dir, libName) {
    let libContents = fs.readFileSync(libFileName, "utf8");
    let match = libContents.match(/<define-library\s+name="([a-zA-Z0-9/-]+)"\s+version="(v\d+\.\d+\.\d+)"/);
    if (match == null) {
        throw new Error("Invalid <define-library> tag, must follow the exact format <define-library name=\"...\" version=\"v0.0.0\">");
    }
    if (match[1] !== libName) {
        throw new Error("<define-library> name:" + match[1] + " does not match lib-name:" + libName);
    }
    let libVersion = match[2];
    return libVersion;
}

function buildTask(libName) {
    console.log("building gulp tasks for", libName);
    
    let buildDirDev = "build/dev/" + libName + "/"
    let buildDirProd = "build/prod/" + libName + "/";
    let srcDir = "src/" + libName + "/";
    let baseName = path.basename(srcDir);
    let libFileName = path.resolve(srcDir, baseName + ".html");
    let transformFn = (filePath, file) => {
        let contents = file.contents.toString("utf8");
        if (filePath.endsWith(".js")) {
            let dataUri = "data:text/javascript;charset=utf-8;base64," + btoa(contents);
            return "\n<script data-filepath=\"" + filePath + "\" src=\"" + dataUri + "\"></script>\n";
        }
        else if (filePath.endsWith(".css")) {
            let dataUri = "data:text/css;charset=utf-8;base64," + btoa(contents);
            return "\n<link data-filesource=\"" + filePath + "\" rel=\"stylesheet\" href=\"" + dataUri + "\">\n";
        }
        else if (filePath.endsWith(".html")) {
            return "\n<!-- " + filePath + " -->\n" + contents + "\n\n";
        }
        else {
            throw new Error("Invalid extension for injected file:", filePath);
        }
    };

    // DEV
    let sassBuildDevTask = () => {
        return gulp.src(srcDir + "*.scss", {allowEmpty: true})
            .pipe(sass.sync().on("error", sass.logError))
            .pipe(gulp.dest(buildDirDev));
    };
    gulp.task("sass:builddev:" + libName, sassBuildDevTask);
    let gulpBuildDevTask = () => {
        let libVersion = readLibVersion(libFileName, buildDirDev, libName);
        let destDir = "./dist/libs/" + libName + "/" + libVersion + "/";
        let target = gulp.src(libFileName);
        let injectSources = gulp.src([srcDir + "_*.html", buildDirDev + "bundle-dev.js", srcDir + "*.css", buildDirDev + "*.css"], {allowEmpty: true});
        console.log("Building Library " + libName + " " + libVersion + " => " + destDir + baseName + ".dev.html");
        return task = target
            .pipe(replace(/(<define-library[^>]+ build)/, "$1=\"" + BUILD + "\""))
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(rename(baseName + ".dev.html"))
            .pipe(gulp.dest(destDir));
    };
    gulp.task("gulp:builddev:" + libName, gulpBuildDevTask);
    gulp.task("webpack:builddev:" + libName, () => {
        let jsFile = libJsIndexFile(libName);
        if (jsFile == null) {
            return Promise.resolve(null);
        }
        let webpackConfig = require("./webpack.dev.js");
        return gulp.src(jsFile)
            .pipe(webpack(webpackConfig))
            .pipe(gulp.dest(buildDirDev));
    });
    gulp.task("clean:dev:" + libName, () => {
        return del(buildDirDev);
    });
    gulp.task("builddev:" + libName, gulp.series("clean:dev:" + libName, "webpack:builddev:" + libName, "sass:builddev:" + libName, "gulp:builddev:" + libName));

    // PROD
    gulp.task("sass:buildprod:" + libName, () => {
        return gulp.src(srcDir + "*.scss", {allowEmpty: true})
            .pipe(sass.sync({outputStyle: "compressed"}).on("error", sass.logError))
            .pipe(gulp.dest(buildDirProd));
    });
    gulp.task("gulp:buildprod:" + libName, () => {
        let libVersion = readLibVersion(libFileName, buildDirProd, libName);
        let destDir = "./dist/libs/" + libName + "/" + libVersion + "/";
        let target = gulp.src(libFileName);
        let injectSources = gulp.src([srcDir + "_*.html", buildDirProd + "bundle-prod.js", srcDir + "*.css", buildDirProd + "*.css"], {allowEmpty: true});
        console.log("Building Library " + libName + " " + libVersion + " => " + destDir + baseName + ".html (" + BUILD + ")");
        return task = target
            .pipe(replace(/(<define-library[^>]+ build)/, "$1=\"" + BUILD + "\""))
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(gulp.dest(destDir));
    });
    gulp.task("webpack:buildprod:" + libName, () => {
        let jsFile = libJsIndexFile(libName);
        if (jsFile == null) {
            return Promise.resolve(null);
        }
        let webpackConfig = require("./webpack.prod.js");
        return gulp.src(jsFile)
            .pipe(webpack(webpackConfig))
            .pipe(gulp.dest(buildDirProd));
    });
    gulp.task("clean:prod:" + libName, () => {
        return del(buildDirProd);
    });
    gulp.task("buildprod:" + libName, gulp.series("clean:prod:" + libName, "webpack:buildprod:" + libName, "sass:buildprod:" + libName, "gulp:buildprod:" + libName));

    // WATCH (dev)
    gulp.task("gulp:watch:" + libName, () => {
        watch([buildDirDev + "*.js", srcDir + "*.html", srcDir + "*.css", buildDirDev + "*.css"],
              {queue: false, delay: 1000}, () => {
                  console.log("gulp:watch:" + libName, "triggering gulp:builddev:" + libName);
                  return gulpBuildDevTask();
              });
    });
    gulp.task("sass:watch:" + libName, () => {
        watch(srcDir + "*.scss", {queue: false, delay: 200}, () => {
            console.log("sass:watch:" + libName, "triggering sass:builddev:" + libName);
            return sassBuildDevTask();
        });
    });
    gulp.task("webpack:watch:" + libName, () => {
        let jsFile = libJsIndexFile(libName);
        if (jsFile == null) {
            return Promise.resolve(null);
        }
        let webpackConfig = require("./webpack.dev.js");
        webpackConfig.watch = true;
        return gulp.src(jsFile)
            .pipe(webpack(webpackConfig))
            .pipe(gulp.dest(buildDirDev));
    });
    gulp.task("watch:" + libName, gulp.series("builddev:" + libName, gulp.parallel("webpack:watch:" + libName, "gulp:watch:" + libName, "sass:watch:" + libName)));
    

    // MISC (clean)
    gulp.task("clean:" + libName, () => {
        return del([buildDirDev, buildDirProd]);
    });
    
    return;
}

gulp.task("webpack:builddev", () => {
    let webpackConfig = require("./webpack.dev.js");
    let srcs = LIBS.map((libName) => libJsIndexFile(libName));
    srcs = srcs.filter((v) => (v != null));
    if (srcs.length == 0) {
        return Promise.resolve(null);
    }
    webpackConfig.entry = {};
    for (let libName of LIBS) {
        let jsFileName = libJsIndexFile(libName);
        if (jsFileName != null) {
            webpackConfig.entry[libName] = [jsFileName];
        }
    }
    webpackConfig.output = {filename: "[name]/bundle-dev.js"};
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/dev"));
});
gulp.task("webpack:buildprod", () => {
    let webpackConfig = require("./webpack.prod.js");
    let srcs = LIBS.map((libName) => libJsIndexFile(libName));
    srcs = srcs.filter((v) => (v != null));
    if (srcs.length == 0) {
        return Promise.resolve(null);
    }
    webpackConfig.entry = {};
    for (let libName of LIBS) {
        let jsFileName = libJsIndexFile(libName);
        if (jsFileName != null) {
            webpackConfig.entry[libName] = [jsFileName];
        }
    }
    webpackConfig.output = {filename: "[name]/bundle-prod.js"};
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/prod"));
});
gulp.task("webpack:watch", () => {
    let webpackConfig = require("./webpack.dev.js");
    let srcs = LIBS.map((libName) => libJsIndexFile(libName));
    srcs = srcs.filter((v) => (v != null));
    if (srcs.length == 0) {
        return Promise.resolve(null);
    }
    webpackConfig.entry = {};
    for (let libName of LIBS) {
        let jsFileName = libJsIndexFile(libName);
        if (jsFileName != null) {
            webpackConfig.entry[libName] = [jsFileName];
        }
    }
    webpackConfig.output = {filename: "[name]/bundle-dev.js"};
    webpackConfig.watch = true;
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/dev"));
});

let devTasks = [];
let prodTasks = [];
let watchTasks = [];
for (let libName of LIBS) {
    buildTask(libName);
    devTasks.push(gulp.series("sass:builddev:" + libName, "gulp:builddev:" + libName));
    prodTasks.push(gulp.series("sass:buildprod:" + libName, "gulp:buildprod:" + libName));
    watchTasks.push("gulp:watch:" + libName, "sass:watch:" + libName);
}

gulp.task("clean", () => {
    return del("build/**");
});
gulp.task("clean:dev", () => {
    return del("build/dev/**");
});
gulp.task("clean:prod", () => {
    return del("build/prod/**");
});

gulp.task("webserver:base", () => {
    connect.server({
        directoryListing: true,
        port: 5005,
        root: "./dist",
        middleware: () => {
            return [cors()];
        },
    });
});

gulp.task("builddev", gulp.series("clean:dev", "webpack:builddev", gulp.parallel(devTasks)));
gulp.task("buildprod", gulp.series("clean:prod", "webpack:buildprod", gulp.parallel(prodTasks)));
gulp.task("build", gulp.series("builddev", "buildprod"));
gulp.task("watch", gulp.series("clean:dev", "builddev", gulp.parallel(["webpack:watch", ...watchTasks])));
gulp.task("webserver", gulp.parallel("webserver:base", "watch"));


