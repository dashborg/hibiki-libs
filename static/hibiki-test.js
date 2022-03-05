// Copyright 2021-2022 Dashborg Inc

// sets up a very basic HTML page that
// includes hibiki-dev.js, the JS prereqs, and Bulma for testing.

var scriptQueue = [];

function writeScript(src) {
    let tag = document.createElement("script");
    tag.src = src;
    tag.addEventListener("load", loadScriptQueue);
    document.querySelector("head").appendChild(tag);
}

function loadScriptQueue() {
    if (scriptQueue.length === 0) {
        return;
    }
    let nextSrc = scriptQueue.shift();
    writeScript(nextSrc);
}

function writeStyleSheet(href) {
    let tag = document.createElement("link");
    tag.rel = "stylesheet";
    tag.href = href;
    document.querySelector("head").appendChild(tag);
}

function testMode() {
    let params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "test") {
        return "test";
    }
    if (params.get("mode") === "prod") {
        return "prod";
    }
    if (window.location.host.match(/(^localhost|(^|\.)hibiki-dev.com)(\:\d+)?$/)) {
        return "test";
    }
    return "prod";
}

if (testMode() === "test") {
    window.HibikiGlobalConfig = {
        libraryRoot: "http://localhost:5005/libs/",
        useDevLibraryBuilds: true,
    };
    scriptQueue.push("http://localhost:9000/hibiki-dev.js");
}
else {
    scriptQueue.push("https://cdn.hibikihtml.com/hibiki/v0.3.3/hibiki-prod.min.js");
}
loadScriptQueue();

