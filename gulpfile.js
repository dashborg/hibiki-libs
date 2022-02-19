// Copyright 2022 Dashborg Inc
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

var gulp = require("gulp");
var inject = require("gulp-inject");
var rename = require("gulp-rename");
var path = require("path");
var fs = require("fs");

let versionRegexp = /^v\d+\.\d+\.\d+$/;

let DIRS = ["build/hibiki/code-highlight/"];

function buildTask(dir) {
    let baseName = path.basename(dir);
    let htmlFileName = path.resolve(dir, baseName + ".html");
    let libContents = fs.readFileSync(htmlFileName, "utf8");
    let match = libContents.match(/<define-library\s+name="([a-zA-Z0-9/-]+)"\s+version="(v\d+\.\d+\.\d+)"/);
    if (match == null) {
        throw new Error("Invalid <define-library> tag, must follow the exact format <define-library name=\"...\" version=\"v0.0.0\">");
    }
    if ("build/" + match[1] + "/" !== dir) {
        throw new Error("<define-library> name:" + match[1] + " does not match directory:" + dir);
    }
    let libName = match[1];
    let libVersion = match[2];
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
    let target = gulp.src(htmlFileName);
    let destDir = "./dist/libs/" + libName + "/" + libVersion + "/";
    gulp.task("builddev:" + baseName, () => {
        let injectSources = gulp.src([dir + "_*.html", dir + "bundle-dev.js", dir + "*.css"]);
        console.log("Library " + libName + " " + libVersion + " => " + destDir + baseName + ".dev.html");
        return task = target
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(rename(baseName + ".dev.html"))
            .pipe(gulp.dest(destDir));
    });
    console.log("adding task", "builddev:" + baseName);
    gulp.task("buildprod:" + baseName, () => {
        let injectSources = gulp.src([dir + "_*.html", dir + "bundle-prod.js", dir + "*.css"]);
        console.log("Library " + libName + " " + libVersion + " => " + destDir + baseName + ".html");
        return task = target
            .pipe(inject(injectSources, {transform: transformFn}))
            .pipe(gulp.dest(destDir));
    });
    console.log("adding task", "buildprod:" + baseName);
    return baseName;
}

let devTasks = [];
let prodTasks = [];
for (let dir of DIRS) {
    let baseName = buildTask(dir);
    devTasks.push("builddev:" + baseName);
    prodTasks.push("buildprod:" + baseName);
}

gulp.task("builddev:all", gulp.parallel(devTasks));
gulp.task("buildprod:all", gulp.parallel(prodTasks));

