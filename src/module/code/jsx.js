import {quoted} from './syntax.js';

function expressionEnd(source,index){
    let depth = 1;
    let previous = '';
    while(index<source.length&&depth){
        let rest = source.slice(index);
        let char = source[index];
        if(char==='"'||char==="'"||char===String.fromCharCode(96)){
            index = quoted(source,index,char);
            previous = 'value';
            continue;
        }
        if(rest.startsWith('//')){
            let end = source.indexOf('\n',index+2);
            index = end<0?source.length:end;
            continue;
        }
        if(rest.startsWith('/*')){
            let end = source.indexOf('*/',index+2);
            index = end<0?source.length:end+2;
            continue;
        }
        if(char==='/'&&(!previous||/[=(:,[!&|?;{}]$/.test(previous))){
            let end = index+1;
            let group = false;
            while(end<source.length&&source[end]!=='\n'){
                if(source[end]==='\\'){end += 2;continue;}
                if(source[end]==='['){group = true;}
                if(source[end]===']'){group = false;}
                if(source[end]==='/'&&!group){break;}
                end++;
            }
            if(source[end]==='/'){index = end+1;previous = 'value';continue;}
        }
        if(char==='{'){depth++;}
        if(char==='}'){depth--;}
        if(char.trim()){previous = char;}
        index++;
    }
    return index;
}

// JSX 标签和子文本按标记语言着色，花括号内继续识别 JavaScript / JSX。
export default function jsx(source,index,add,highlight){
    let opening = /^<(?:[a-z][\w.:-]*\b|>)/i.exec(source.slice(index));
    if(!opening){return index;}
    let expression = ()=>{
        add('{','punctuation');
        let start = ++index;
        index = expressionEnd(source,index);
        let closed = source[index-1]==='}';
        highlight(source.slice(start,closed?index-1:index),'jsx').forEach(token=>add(token.text,token.type));
        if(closed){add('}','punctuation');}
    };
    let tag = ()=>{
        let match = source.slice(index).match(/^<(\/?)([a-z][\w.:-]*)?/i);
        add('<'+match[1],'punctuation');
        if(match[2]){add(match[2],'tag');}
        index += match[0].length;
        let closing = !!match[1];
        while(index<source.length){
            let rest = source.slice(index);
            let end = rest.match(/^\/?\s*>/);
            if(end){
                add(end[0],'punctuation');
                index += end[0].length;
                return closing||end[0].startsWith('/');
            }
            let space = rest.match(/^\s+/);
            let name = rest.match(/^[\w.:-]+/);
            if(space){add(space[0]);index += space[0].length;}
            else if(source[index]==='{'){expression();}
            else if(source[index]==='"'||source[index]==="'"){
                let end = quoted(source,index,source[index],false,true);
                add(source.slice(index,end),'string');
                index = end;
            }else{
                let text = name?name[0]:source[index];
                add(text,name?'attribute':text==='='?'operator':'punctuation');
                index += text.length;
            }
        }
        return true;
    };
    if(tag()){return index;}
    while(index<source.length){
        let rest = source.slice(index);
        if(/^<\/(?:[a-z][\w.:-]*)?\s*>/i.test(rest)){tag();break;}
        if(/^<(?:[a-z][\w.:-]*\b|>)/i.test(rest)){
            index = jsx(source,index,add,highlight);
        }else if(rest[0]==='{'){
            expression();
        }else{
            let entity = rest.match(/^&(?:#x[\da-f]+|#\d+|\w+);/i);
            let text = entity?.[0]||rest.match(/^[^<{&]+/)?.[0]||rest[0];
            add(text,entity?'number':'text');
            index += text.length;
        }
    }
    return index;
}
