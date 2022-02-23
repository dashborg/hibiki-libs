import * as React from "react";
import * as mobxReact from "mobx-react";
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {DBCtx, resolveCnMapEx} from "hibiki-dbctx";
import {textContent} from "hibiki-utils";
import hibiki from "hibiki";

const LIB_NAME = "hibiki/markdown";

@mobxReact.observer
class MarkdownNode extends React.Component {
    render() {
        let ctx = new DBCtx(this);
        let mdText = null;
        let [bindVal, exists] = ctx.resolveAttrValPair("bind");
        if (exists) {
            mdText = DataCtx.valToString(bindVal);
        }
        else {
            mdText = ctx.textContent();
        }
        if (mdText == null) {
            return null;
        }
        let noTrimIndent = ctx.resolveAttrStr("notrimindent");
        if (!noTrimIndent) {
            mdText = ctx.dataenv.callFn("trimindent", [mdText]);
        }
        if (ctx.resolveAttrStr("debugtext")) {
            mdText = mdText.replace(/ /g, ".");
            return <pre>{ mdText }</pre>;
        }
        return (
            <ReactMarkdown remarkPlugins={[gfm]} children={mdText}/>
        );
    }
}

function moduleCallback(state, clib) {
    clib.registerNativeComponentImpl(LIB_NAME, "markdown", MarkdownNode);
}

window.Hibiki.addLibraryCallback(LIB_NAME, moduleCallback);
