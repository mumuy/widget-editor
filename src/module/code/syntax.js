export function quoted(source,index,quote,triple=false,raw=false,multiline=true){
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

function delimited(source,opening,closing){
    let end = source.indexOf(closing,opening.length);
    return end<0?source:source.slice(0,end+closing.length);
}

export function comment(source,index,language){
    let rest = source.slice(index);
    if(language==='lua'&&rest.startsWith('--')){
        let opening = rest.match(/^--\[(=*)\[/);
        return opening?delimited(rest,opening[0],']'+opening[1]+']'):rest.match(/^[^\n]*/)[0];
    }
    if(language==='ruby'&&/^=begin(?:\s|$)/.test(rest)&&(index===0||source[index-1]==='\n')){
        let end = /\n=end\b[^\n]*/.exec(rest);
        return end?rest.slice(0,end.index+end[0].length):rest;
    }
    let line = language==='sql'?rest.startsWith('--'):
        language==='visual-basic'?rest[0]==="'"||/^rem\b/i.test(rest)&&/(?:^|:)\s*$/.test(source.slice(source.lastIndexOf('\n',index-1)+1,index)):
        ['python','ruby','bash'].includes(language)?rest[0]==='#'&&(language!=='bash'||index===0||/[\s;|&()<>]/.test(source[index-1])):
        !['css','json','lua'].includes(language)&&rest.startsWith('//')||language==='php'&&rest[0]==='#';
    if(line){return rest.match(/^[^\n]*/)[0];}
    if(!['python','ruby','bash','json','visual-basic','lua'].includes(language)&&rest.startsWith('/*')){
        if(['swift','kotlin','rust'].includes(language)){
            let depth = 1;
            let end = 2;
            while(end<rest.length&&depth){
                if(rest.startsWith('/*',end)){depth++;end += 2;}
                else if(rest.startsWith('*/',end)){depth--;end += 2;}
                else{end++;}
            }
            return rest.slice(0,end);
        }
        return delimited(rest,'/*','*/');
    }
    return null;
}

export function literal(source,index,language){
    let rest = source.slice(index);
    if(language==='cpp'){
        let raw = rest.match(/^(?:u8|[uUL])?R"([^\s()\\]{0,16})\(/);
        if(raw){return {text:delimited(rest,raw[0],')'+raw[1]+'"'),type:'string'};}
    }
    if(language==='lua'){
        let long = rest.match(/^\[(=*)\[/);
        if(long){return {text:delimited(rest,long[0],']'+long[1]+']'),type:'string'};}
    }
    if(language==='swift'){
        let raw = rest.match(/^(#+)("""|")/);
        if(raw){return {text:delimited(rest,raw[0],raw[2]+raw[1]),type:'string'};}
    }
    if(language==='rust'){
        let raw = rest.match(/^(?:br|cr|r)(#{0,255})"/);
        if(raw){return {text:delimited(rest,raw[0],'"'+raw[1]),type:'string'};}
    }
    if(language==='csharp'){
        let raw = rest.match(/^(?:\$+)?("{3,})/);
        if(raw){return {text:delimited(rest,raw[0],raw[1]),type:'string'};}
    }
    if(language==='ruby'){
        let opening = rest.match(/^%([qQrwWiIx])([^\w\s])/);
        if(opening){
            let start = opening[2];
            let closing = {'(' : ')','[' : ']','{' : '}','<' : '>'}[start]||start;
            let depth = 1;
            let end = opening[0].length;
            while(end<rest.length&&depth){
                if(rest[end]==='\\'){end += 2;continue;}
                if(rest[end]===closing){depth--;}
                else if(start!==closing&&rest[end]===start){depth++;}
                end++;
            }
            if(opening[1]==='r'){while(/[imxoensu]/.test(rest[end]||' ')){end++;}}
            return {text:rest.slice(0,end),type:opening[1]==='r'?'regexp':'string'};
        }
    }
    let prefix = language==='python'?rest.match(/^(?:fr|rf|br|rb|[frbu])(?=["'])/i)?.[0]||'':
        language==='csharp'?rest.match(/^(?:\$@|@\$|@|\$)(?=")/)?.[0]||'':
        ['c','cpp'].includes(language)?rest.match(/^(?:u8|[uUL])(?=["'])/)?.[0]||'':
        language==='rust'?rest.match(/^(?:b(?=["'])|c(?="))/)?.[0]||'':'';
    let quote = source[index+prefix.length];
    let backtick = quote===String.fromCharCode(96)&&['javascript','typescript','jsx','go','bash','ruby'].includes(language);
    if(quote!=='"'&&quote!=="'"&&!backtick){return null;}
    // Rust 的生命周期（如 'a、'static）不是字符字面量。
    if(language==='rust'&&quote==="'"&&!/^'(?:\\(?:u\{[\da-f_]+\}|x[\da-f]{2}|[^\r\n])|[^'\\\r\n])'/iu.test(rest.slice(prefix.length))){return null;}
    let triple = ['python','java','swift','kotlin'].includes(language)&&source.startsWith(quote.repeat(3),index+prefix.length);
    let raw = ['sql','visual-basic'].includes(language)||language==='csharp'&&prefix.includes('@')||language==='go'&&backtick||language==='bash'&&quote==="'"||language==='kotlin'&&triple;
    let multiline = triple||backtick||['php','sql','bash','ruby'].includes(language)||language==='csharp'&&raw;
    let end = quoted(source,index+prefix.length,quote,triple,raw,multiline);
    return {text:source.slice(index,end),type:language==='json'&&/^\s*:/.test(source.slice(end))?'property':'string'};
}
