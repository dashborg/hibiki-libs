// Copyright 2022 Dashborg Inc
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const DEFAULT_BEAUTIFY_OPTS = {
    "indent_size": "2",
    "indent_char": " ",
    "max_preserve_newlines": "-1",
    "preserve_newlines": false,
    "keep_array_indentation": false,
    "break_chained_methods": false,
    "indent_scripts": "normal",
    "brace_style": "collapse",
    "space_before_conditional": true,
    "unescape_strings": false,
    "jslint_happy": false,
    "end_with_newline": false,
    "wrap_line_length": "0",
    "indent_inner_html": false,
    "comma_first": false,
    "e4x": false,
    "indent_empty_lines": false,
};

function highlight(req) {
    let uuid = req.data.id;
    let elem = document.getElementById(uuid);
    if (elem == null) {
        return null;
    }
    if (req.data.fromselector != null) {
        let fromElem = document.querySelector(req.data.fromselector);
        if (fromElem == null) {
            elem.textContent = "";
        }
        else if (req.data.useouterhtml) {
            elem.textContent = fromElem.outerHTML;
        }
        else {
            elem.textContent = fromElem.innerHTML;
        }
    }
    if (req.data.beautify) {
        let userOptsVal = req.data.beautifyopts;
        let beautifyOpts = Object.assign({}, DEFAULT_BEAUTIFY_OPTS);
        if (typeof(userOptsVal) === "object") {
            beautifyOpts = Object.assign(beautifyOpts, userOptsVal);
        }
        let textContent = elem.textContent ?? "";
        let beautifyOutput = html_beautify(textContent, beautifyOpts);
        elem.textContent = beautifyOutput;
    }
    window.hljs.highlightElement(elem);
}

function highlightCallbackFn(state, clib) {
    clib.registerLocalJSHandler("hibiki/code-highlight", "/highlight", highlight);
}

window.Hibiki.addLibraryCallback("hibiki/code-highlight", highlightCallbackFn);
