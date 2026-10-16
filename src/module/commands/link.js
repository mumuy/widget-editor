import {safeURL,escapeHTML,setLinkTarget} from '../method/sanitize.js';
import nativeCommand from './native.js';

function validLink(editor,link){
    return link?.matches?.('a[href]:not([download])')&&editor.content.contains(link);
}

export function link(editor,values={}){
    let target = values.link;
    let url = safeURL(values.url);
    if(!url||target&&!validLink(editor,target)){return false;}
    let text = String(values.text||'').trim()||url;
    let range = values.range||editor.getRange();
    if(values.range){editor.selection.range = range.cloneRange();}
    if(target){
        return editor.transaction(()=>{
            target.setAttribute('href',url);
            setLinkTarget(target,values.newWindow);
            if(text!==target.textContent){
                target.textContent = text;
                let range = document.createRange();
                range.selectNodeContents(target);
                range.collapse(false);
                editor.selection.select(range);
            }
            return true;
        });
    }
    if(range&&!range.collapsed&&text===range.toString()){
        return editor.transaction(()=>{
            nativeCommand('createLink',url);
            let selected = editor.selection.current();
            editor.content.querySelectorAll('a[href]:not([download])').forEach(node=>{
                if(selected?.intersectsNode(node)){setLinkTarget(node,values.newWindow);}
            });
            return true;
        });
    }
    editor.insertHTML('<a href="'+escapeHTML(url)+'" target="'+(values.newWindow===false?'_self':'_blank')+'">'+escapeHTML(text)+'</a>');
    return true;
}

export function unlink(editor,target){
    target ||= editor.selectedElement()?.closest('a[href]:not([download])');
    if(!validLink(editor,target)){return false;}
    return editor.transaction(()=>{
        let range = editor.getRange().cloneRange();
        let offset = (node,value)=>{
            if(!target.contains(node)){return null;}
            let part = document.createRange();
            part.selectNodeContents(target);
            part.setEnd(node,value);
            return part.toString().length;
        };
        let start = offset(range.startContainer,range.startOffset);
        let end = offset(range.endContainer,range.endOffset);
        let text = document.createTextNode(target.textContent);
        target.replaceWith(text);
        if(start!==null){range.setStart(text,start);}
        if(end!==null){range.setEnd(text,end);}
        editor.selection.select(range);
        if(start!==null&&end!==null){nativeCommand('removeFormat');}
        return true;
    });
}
