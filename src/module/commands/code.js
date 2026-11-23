import {codeText,codeOffset,codePoint,renderCode} from '../code/content.js';
import {languageName} from '../code/language.js';
import {insertHTMLContent} from './native.js';

export function selectedCode(editor,range=editor.getRange()){
    let find = node=>(node?.nodeType===Node.TEXT_NODE?node.parentElement:node)?.closest?.('pre')?.querySelector('code');
    let code = range&&find(range.startContainer);
    return code&&editor.content.contains(code)&&code===find(range.endContainer)?code:null;
}

export function editCode(editor,callback){
    let code = selectedCode(editor);
    if(!code||typeof callback!=='function'){return false;}
    let range = editor.getRange();
    let result = callback(codeText(code),codeOffset(code,range.startContainer,range.startOffset),codeOffset(code,range.endContainer,range.endOffset));
    return editor.transaction(()=>{
        code.textContent = result.text;
        delete code._highlight;
        renderCode(code,true);
        let range = document.createRange();
        range.setStart(...codePoint(code,result.start));
        range.setEnd(...codePoint(code,result.end));
        editor.selection.select(range);
        return true;
    });
}

export function writeCode(editor,value){
    value = String(value).replace(/\r\n?/g,'\n');
    return editCode(editor,(text,start,end)=>({text:text.slice(0,start)+value+text.slice(end),start:start+value.length,end:start+value.length}));
}

export function indentCode(editor,reverse){
    return editCode(editor,(text,start,end)=>{
        if(!reverse&&start===end){
            return {text:text.slice(0,start)+'    '+text.slice(end),start:start+4,end:end+4};
        }
        let first = text.lastIndexOf('\n',Math.max(0,start-1))+1;
        if(start===0){first = 0;}
        let last = end>start&&text[end-1]==='\n'?end-1:end;
        last = text.indexOf('\n',last);
        if(last<0){last = text.length;}
        let delta = 0;
        let firstDelta = 0;
        let lines = text.slice(first,last).split('\n').map((line,index)=>{
            let size = reverse?(line.match(/^(?: {1,4}|\t)/)?.[0].length||0):4;
            let change = reverse?-size:size;
            if(index===0){firstDelta = change;}
            delta += change;
            return reverse?line.slice(size):'    '+line;
        });
        return {text:text.slice(0,first)+lines.join('\n')+text.slice(last),start:Math.max(first,start+firstDelta),end:Math.max(first,end+delta)};
    });
}

export function insertCode(editor,values={}){
    let pre = document.createElement('pre');
    let code = document.createElement('code');
    code.setAttribute('data-language',languageName(values.language||'javascript'));
    code.textContent = values.text??editor.getRange()?.toString()??'';
    pre.appendChild(code);
    renderCode(code);
    let previous = new Set(editor.content.querySelectorAll('pre code'));
    return editor.transaction(()=>{
        insertHTMLContent(editor,pre.outerHTML);
        code = Array.from(editor.content.querySelectorAll('pre code')).find(node=>!previous.has(node));
        if(!code){return false;}
        let range = document.createRange();
        range.setStart(...codePoint(code,codeText(code).length));
        range.collapse(true);
        editor.selection.select(range);
        return true;
    });
}

export function codeLanguage(editor,{code=selectedCode(editor),language}={}){
    if(!code?.matches?.('pre > code')||!editor.content.contains(code)){return false;}
    return editor.transaction(()=>{
        code.setAttribute('data-language',languageName(language));
        return true;
    });
}
