// Copyright 2022 Dashborg Inc
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

var gulp = require("gulp");
var inject = require("gulp-inject");
var rename = require("gulp-rename");
var watch = require("gulp-watch");
var path = require("path");
var fs = require("fs");
var webpack = require("webpack-stream");

let versionRegexp = /^v\d+\.\d+\.\d+$/;

let LIBS = ["hibiki/code-highlight"];
let DIRS = ["build/hibiki/code-highlight/"];

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
    let buildDir = "build/" + libName + "/";
    let baseName = path.basename(buildDir);
    let libFileName = path.resolve(buildDir, baseName + ".html");
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
    let builddevTask = () => {
        let libVersion = readLibVersion(libFileName, buildDir, libName);
        let destDir = "./dist/libs/" + libName + "/" + libVersion + "/";
        let target = gulp.src(libFileName);
        let injectSources = gulp.src([buildDir + "_*.html", buildDir + "bundle-dev.js", buildDir + "*.css"]);
        console.log("Building Library " + libName + " " + libVersion + " => " + destDir + baseName + ".dev.html");
        return task = target
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(rename(baseName + ".dev.html"))
            .pipe(gulp.dest(destDir));
    };
    gulp.task("builddev:" + baseName, builddevTask);
    let watchTask = () => {
        watch(buildDir + "*", {queue: false, delay: 1000}, builddevTask);
    };
    gulp.task("watch:builddev:" + baseName, gulp.series(builddevTask, watchTask));
    gulp.task("buildprod:" + baseName, () => {
        let libVersion = readLibVersion(libFileName, buildDir, libName);
        let destDir = "./dist/libs/" + libName + "/" + libVersion + "/";
        let target = gulp.src(libFileName);
        let injectSources = gulp.src([buildDir + "_*.html", buildDir + "bundle-prod.js", buildDir + "*.css"]);
        console.log("Building Library " + libName + " " + libVersion + " => " + destDir + baseName + ".html");
        return task = target
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(gulp.dest(destDir));
    });
    console.log("adding tasks", "buildprod:" + baseName, "builddev:" + baseName, "watch:builddev:" + baseName);
    return baseName;
}

gulp.task("webpack:watch", () => {
    let webpackConfig = require("./webpack.dev.js");
    webpackConfig.watch = true;
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/"));
});
gulp.task("webpack:builddev", () => {
    let webpackConfig = require("./webpack.dev.js");
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/"));
});
gulp.task("webpack:buildprod", () => {
    let webpackConfig = require("./webpack.prod.js");
    return gulp.src("src/")
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest("build/"));
});
let devTasks = [];
let prodTasks = [];
let watchTasks = [];
for (let libName of LIBS) {
    let baseName = buildTask(libName);
    devTasks.push("builddev:" + baseName);
    watchTasks.push("watch:builddev:" + baseName);
    prodTasks.push("buildprod:" + baseName);
}

gulp.task("builddev:all", gulp.series("webpack:builddev", gulp.parallel(devTasks)));
gulp.task("buildprod:all", gulp.series("webpack:buildprod", gulp.parallel(prodTasks)));
watchTasks.push("webpack:watch");
gulp.task("watch:builddev:all", gulp.series("webpack:builddev", gulp.parallel(watchTasks)));


