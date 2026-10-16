import highlight from './highlight.js';
import {languageName} from './language.js';

export const colors = {
    text:'#334155',background:'#f6f8fa',border:'#d8dee4',comment:'#6a737d',keyword:'#8250df',
    string:'#0a3069',number:'#0550ae',function:'#953800',property:'#0550ae',tag:'#116329',
    attribute:'#953800',operator:'#cf222e',punctuation:'#57606a',regexp:'#0550ae'
};

export function codeColor(value){
    return /^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value)&&CSS.supports('color',value);
}

export function codeText(code){
    if(code.childNodes.length===1&&code.firstChild.nodeName==='BR'){
        return '';
    }
    let text = '';
    let visit = node=>{
        if(node.nodeType===Node.TEXT_NODE){
            text += node.data;
        }else if(node.nodeName==='BR'){
            if(!node.hasAttribute('data-code-placeholder')){text += '\n';}
        }else{
            let block = ['DIV','P'].includes(node.nodeName);
            if(block&&text&&!text.endsWith('\n')){text += '\n';}
            node.childNodes.forEach(visit);
            if(block&&!text.endsWith('\n')){text += '\n';}
        }
    };
    code.childNodes.forEach(visit);
    return text.replace(/\r\n?/g,'\n');
}

export function codeOffset(code,node,offset){
    if(!code.contains(node)){
        return null;
    }
    let range = document.createRange();
    range.selectNodeContents(code);
    range.setEnd(node,offset);
    return range.toString().length;
}

export function codePoint(code,offset){
    if(code.lastChild?.nodeName==='BR'&&code.lastChild.hasAttribute('data-code-placeholder')&&offset>=code.textContent.length){
        return [code,code.childNodes.length-1];
    }
    let walker = document.createTreeWalker(code,NodeFilter.SHOW_TEXT);
    let last;
    while(walker.nextNode()){
        last = walker.currentNode;
        if(offset<=last.length){
            return [last,offset];
        }
        offset -= last.length;
    }
    return last?[last,last.length]:[code,0];
}

export function renderCode(code,editing=false){
    let language = languageName(code.getAttribute('data-language'));
    let text = codeText(code);
    let palette = Object.fromEntries(Object.entries(colors).map(([name,value])=>{
        let custom = code.style.getPropertyValue('--code-'+name).trim();
        return [name,codeColor(custom)?custom:value];
    }));
    let key = language+'\n'+text+'\n'+JSON.stringify(palette);
    let clean = Array.from(code.childNodes).every(node=>{
        if(node.nodeType===Node.TEXT_NODE){return true;}
        if(node.nodeName==='BR'&&node.hasAttribute('data-code-placeholder')){return true;}
        let color = node.nodeName==='SPAN'&&node.style.getPropertyValue('color').match(/^var\(--code-([a-z]+)\)$/);
        return color&&Object.hasOwn(colors,color[1])&&node.attributes.length===1&&node.style.length===1&&Array.from(node.childNodes).every(child=>child.nodeType===Node.TEXT_NODE);
    });
    if(editing&&code._highlight===key&&clean){
        return false;
    }
    code.setAttribute('data-language',language);
    code.setAttribute('style',Object.entries(palette).map(([name,value])=>'--code-'+name+': '+value+';').join(' ')+
        ' display: block; box-sizing: border-box; min-height: 48px; tab-size: 4; white-space: pre; overflow: auto; font-family: Menlo, Monaco, Consolas, "Courier New", monospace; font-size: 14px; line-height: 1.6; padding: 12px 14px; border: 1px solid var(--code-border); border-radius: 4px; color: var(--code-text); background-color: var(--code-background);');
    let fragment = document.createDocumentFragment();
    highlight(text,language).forEach(token=>{
        let node = document.createTextNode(token.text);
        if(token.type!=='text'){
            let span = document.createElement('span');
            span.setAttribute('style','color: var(--code-'+token.type+');');
            span.appendChild(node);
            node = span;
        }
        fragment.appendChild(node);
    });
    if(editing&&(!text||text.endsWith('\n'))){
        let placeholder = document.createElement('br');
        placeholder.setAttribute('data-code-placeholder','');
        fragment.appendChild(placeholder);
    }
    code.replaceChildren(fragment);
    code._highlight = key;
    return true;
}

export function normalizeCode(content,editing=false,range=null,dirty=null){
    let changed = false;
    content.querySelectorAll('pre').forEach(pre=>{
        if(dirty&&!dirty.has(pre)&&pre.firstElementChild?._highlight){return;}
        let start = range&&codeOffset(pre,range.startContainer,range.startOffset);
        let end = range&&codeOffset(pre,range.endContainer,range.endOffset);
        let code = pre.children.length===1&&pre.firstElementChild.tagName==='CODE'?pre.firstElementChild:null;
        if(!code){
            code = document.createElement('code');
            code.append(...pre.childNodes);
            pre.appendChild(code);
        }else if(pre.childNodes.length>1){
            code.textContent = codeText(pre);
            pre.replaceChildren(code);
            delete code._highlight;
        }
        if(renderCode(code,editing)){
            changed = true;
            if(start!==null&&start!==undefined){range.setStart(...codePoint(code,start));}
            if(end!==null&&end!==undefined){range.setEnd(...codePoint(code,end));}
        }
    });
    return changed;
}
