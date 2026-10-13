import {languageName,profiles} from './language.js';

// 只识别代码文本中的词法标记，不执行代码，也不把代码作为 HTML 解析。
export default function highlight(source,language){
    language = languageName(language);
    let tokens = [];
    let add = (text,type='text')=>{
        if(!text){
            return;
        }
        let last = tokens[tokens.length-1];
        if(last?.type===type){
            last.text += text;
        }else{
            tokens.push({text,type});
        }
    };
    if(language==='text'){
        add(source);
        return tokens;
    }
    if(language==='php'&&source.includes('<?')){
        let index = 0;
        let match;
        let openings = /<\?(?:php\b|=)?/gi;
        while((match=openings.exec(source))){
            highlight(source.slice(index,match.index),'html').forEach(token=>add(token.text,token.type));
            add(match[0],'tag');
            let body = source.slice(openings.lastIndex);
            let length = scan(body,'php',add,true);
            if(length===body.length){
                return tokens;
            }
            add('?>','tag');
            index = openings.lastIndex+length+2;
            openings.lastIndex = index;
        }
        highlight(source.slice(index),'html').forEach(token=>add(token.text,token.type));
    }else if(language==='html'){
        html(source,add);
    }else{
        scan(source,language,add);
    }
    return tokens;
}

function quoted(source,index,quote,triple=false,raw=false,multiline=true){
    let delimiter = triple?quote.repeat(3):quote;
    let end = index+delimiter.length;
    while(end<source.length){
        if(source[end]==='\n'&&!multiline){
            break;
        }else if(source[end]==='\\'&&!raw){
            end += 2;
        }else if(source.startsWith(delimiter,end)){
            end += delimiter.length;
            if(!triple&&source[end]===quote&&quote!==String.fromCharCode(96)){
                end++;
            }else{
                break;
            }
        }else{
            end++;
        }
    }
    return Math.min(end,source.length);
}

function html(source,add){
    let index = 0;
    while(index<source.length){
        let rest = source.slice(index);
        if(rest.startsWith('<!--')){
            let end = source.indexOf('-->',index+4);
            end = end<0?source.length:end+3;
            add(source.slice(index,end),'comment');
            index = end;
            continue;
        }
        let opening = rest.match(/^<(\/?)([a-z][\w:-]*)\b/i);
        if(opening){
            add('<'+opening[1],'punctuation');
            add(opening[2],'tag');
            index += opening[0].length;
            let closed = false;
            let selfClosing = false;
            while(index<source.length){
                rest = source.slice(index);
                let end = rest.match(/^\/?\s*>/);
                if(end){
                    add(end[0],'punctuation');
                    selfClosing = end[0].startsWith('/');
                    index += end[0].length;
                    closed = true;
                    break;
                }
                let space = rest.match(/^\s+/);
                if(space){
                    add(space[0]);
                    index += space[0].length;
                }else if(source[index]==='"'||source[index]==="'"){
                    let end = quoted(source,index,source[index],false,true);
                    add(source.slice(index,end),'string');
                    index = end;
                }else if(source[index]==='='){
                    add('=','operator');
                    index++;
                    let value = source.slice(index).match(/^\s*([^\s"'=<>`]+)(?=\s|>|$)/);
                    if(value){
                        add(value[0],'string');
                        index += value[0].length;
                    }
                }else{
                    let name = rest.match(/^[\w:-]+/);
                    let text = name?name[0]:source[index];
                    add(text,name?'attribute':'punctuation');
                    index += text.length;
                }
            }
            let tag = opening[2].toLowerCase();
            if(closed&&!opening[1]&&!selfClosing&&(tag==='script'||tag==='style')){
                let closing = new RegExp('</'+tag+'\\s*>','i');
                let match = closing.exec(source.slice(index));
                let end = match?index+match.index:source.length;
                highlight(source.slice(index,end),tag==='script'?'javascript':'css').forEach(token=>add(token.text,token.type));
                index = end;
            }
            continue;
        }
        let declaration = rest.match(/^<![^>]*(?:>|$)/);
        let entity = rest.match(/^&(?:#x[\da-f]+|#\d+|\w+);/i);
        let text = declaration?.[0]||entity?.[0]||rest.match(/^[^<&]+/)?.[0]||source[index];
        add(text,declaration?'keyword':entity?'number':'text');
        index += text.length;
    }
}

function scan(source,language,add,phpBlock=false){
    let index = 0;
    let previous = '';
    let depth = 0;
    let emit = (text,type)=>{
        add(text,type);
        if(text.trim()&&type!=='comment'){
            previous = text;
        }
        index += text.length;
    };
    while(index<source.length){
        let rest = source.slice(index);
        if(phpBlock&&rest.startsWith('?>')){break;}
        let space = rest.match(/^\s+/);
        if(space){
            emit(space[0],'text');
            continue;
        }
        let lineComment = language==='sql'?rest.startsWith('--'):
            ['python','bash'].includes(language)?rest.startsWith('#')&&(language!=='bash'||index===0||/[\s;|&()<>]/.test(source[index-1])):
                !['css','json'].includes(language)&&rest.startsWith('//')||language==='php'&&rest.startsWith('#');
        if(lineComment){
            let comment = rest.match(/^[^\n]*/)[0];
            if(phpBlock&&comment.includes('?>')){comment = comment.slice(0,comment.indexOf('?>'));}
            emit(comment,'comment');
            continue;
        }
        if(!['python','bash','json'].includes(language)&&rest.startsWith('/*')){
            let end = rest.indexOf('*/',2);
            emit(end<0?rest:rest.slice(0,end+2),'comment');
            continue;
        }
        let prefix = language==='python'?rest.match(/^(?:fr|rf|br|rb|[frbu])(?=["'])/i)?.[0]||'':'';
        let quote = source[index+prefix.length];
        if(quote==='"'||quote==="'"||quote===String.fromCharCode(96)&&['javascript','typescript','go','bash'].includes(language)){
            let triple = ['python','java'].includes(language)&&source.startsWith(quote.repeat(3),index+prefix.length);
            let raw = language==='sql'||language==='go'&&quote===String.fromCharCode(96)||language==='bash'&&quote==="'";
            let multiline = triple||quote===String.fromCharCode(96)||['php','sql','bash'].includes(language);
            let end = quoted(source,index+prefix.length,quote,triple,raw,multiline);
            let type = language==='json'&&/^\s*:/.test(source.slice(end))?'property':'string';
            emit(source.slice(index,end),type);
            continue;
        }
        if(['javascript','typescript'].includes(language)&&rest[0]==='/'&&(!previous||/^(return|throw|case|yield|await)$/.test(previous)||/[=(:,[!&|?;{}]$/.test(previous))){
            let end = 1;
            let group = false;
            while(end<rest.length&&rest[end]!=='\n'){
                if(rest[end]==='\\'){
                    end += 2;
                    continue;
                }
                if(rest[end]==='['){group = true;}
                if(rest[end]===']'){group = false;}
                if(rest[end]==='/'&&!group){break;}
                end++;
            }
            if(rest[end]==='/'){
                end++;
                while(/[dgimsuvy]/.test(rest[end]||' ')){end++;}
                emit(rest.slice(0,end),'regexp');
                continue;
            }
        }
        let variable = ['php','bash'].includes(language)?rest.match(/^\$(?:[a-z_]\w*|\{[^}\n]*\}|\d+|[?@#*!$-])/i):null;
        if(variable){
            emit(variable[0],'property');
            continue;
        }
        let number = rest.match(/^(?:0[xX][\da-fA-F_]+(?:[lL]|n)?|0[bB][01_]+(?:[lL]|n)?|0[oO][0-7_]+(?:[lL]|n)?|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?(?:[fFdDlL]|n)?)(?!\w)/);
        let selector = language==='css'&&depth===0?rest.match(/^[#.][\w-]+/):null;
        if(selector){
            emit(selector[0],'tag');
            continue;
        }
        let cssNumber = language==='css'?rest.match(/^(?:#[\da-f]{3,8}\b|(?:\d+(?:\.\d+)?|\.\d+)(?:[a-z]+|%)?)/i):null;
        if(number||cssNumber){
            emit((cssNumber||number)[0],'number');
            continue;
        }
        if(language==='css'&&rest[0]==='@'){
            let rule = rest.match(/^@[\w-]+/);
            if(rule){
                emit(rule[0],'keyword');
                continue;
            }
        }
        let word = rest.match(language==='css'?/^(?:--)?[a-z_][\w-]*/i:/^[a-z_$][\w$]*/i);
        if(word){
            let text = word[0];
            let after = source.slice(index+text.length);
            let key = ['sql','php'].includes(language)?text.toLowerCase():text;
            let type = profiles[language]?.has(key)?'keyword':/^\s*\(/.test(after)?'function':['.','?.'].includes(previous)||/^\s*:/.test(after)?'property':'text';
            if(language==='css'&&type!=='function'){
                type = depth===0?'tag':/^\s*:/.test(after)?'property':'string';
            }
            emit(text,type);
            continue;
        }
        let operator = rest.match(/^(?:===|!==|=>|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\*\*|<<|>>|:=|\+\+|--|[+\-*/%=!<>?:&|^~])/);
        if(rest[0]==='{'){depth++;}
        if(rest[0]==='}'){depth--;}
        emit(operator?operator[0]:rest[0],operator?'operator':/[{}()[\],.;]/.test(rest[0])?'punctuation':'text');
    }
    return index;
}
