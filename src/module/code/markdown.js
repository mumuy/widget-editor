function inline(source,add,highlight){
    let index = 0;
    while(index<source.length){
        let rest = source.slice(index);
        let escape = rest.match(/^\\[\\`*{}[\]()#+\-.!_>~]/);
        let code = rest.match(/^(`+)([\s\S]*?)\1(?!`)/);
        let link = rest.match(/^!?\[[^\]\n]*\]\([^\n)]*\)|^\[[^\]\n]+\]\[[^\]\n]*\]/);
        let emphasis = rest[0]==='_'&&index>0&&/\w/.test(source[index-1])?null:rest.match(/^(\*\*|__|~~|\*|_)(\S(?:.*?\S)?)\1(?![\w*])/);
        let html = rest.match(/^<\/?[a-z][^>\n]*>|^&(?:#x[\da-f]+|#\d+|\w+);/i);
        if(escape){add(escape[0]);index += escape[0].length;}
        else if(code){add(code[0],'string');index += code[0].length;}
        else if(link){add(link[0],'property');index += link[0].length;}
        else if(emphasis){add(emphasis[0],'string');index += emphasis[0].length;}
        else if(html){highlight(html[0],'html').forEach(token=>add(token.text,token.type));index += html[0].length;}
        else{
            let text = rest.match(/^[^\\`\[!*_<&~]+/)?.[0]||rest[0];
            add(text);
            index += text.length;
        }
    }
}

export default function markdown(source,add,highlight){
    let index = 0;
    while(index<source.length){
        let rest = source.slice(index);
        let line = rest.match(/^[^\n]*(?:\n|$)/)[0];
        let fence = line.match(/^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)[^\n]*(?:\n|$)/);
        if(fence){
            add(line,'punctuation');
            index += line.length;
            let closing = new RegExp('^ {0,3}'+fence[1][0]+'{'+fence[1].length+',}[ \\t]*(?:\\n|$)','m');
            let end = closing.exec(source.slice(index));
            let body = source.slice(index,end?index+end.index:source.length);
            highlight(body,fence[2]||'text').forEach(token=>add(token.text,token.type));
            index += body.length;
            if(end){add(end[0],'punctuation');index += end[0].length;}
        }else if(rest.startsWith('<!--')){
            let end = rest.indexOf('-->',4);
            let text = end<0?rest:rest.slice(0,end+3);
            add(text,'comment');
            index += text.length;
        }else{
            let heading = line.match(/^ {0,3}#{1,6}(?:\s|$)/);
            let rule = /^(?: {0,3}(?:[-*_][ \t]*){3,}| {0,3}(?:=+|-+))\s*$/.test(line);
            let marker = line.match(/^\s*(?:>\s*|[-+*]\s+|\d+[.)]\s+)/);
            if(heading){add(line,'keyword');}
            else if(rule){add(line,'punctuation');}
            else{
                if(marker){add(marker[0],'tag');}
                inline(line.slice(marker?.[0].length||0),add,highlight);
            }
            index += line.length;
        }
    }
}
