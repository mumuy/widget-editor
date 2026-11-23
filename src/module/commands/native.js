// 浏览器原生指令只在此调用；选区、历史和输出由编辑事务统一处理。
export default function nativeCommand(name,value=null,css){
    if(css!==undefined){document.execCommand('styleWithCSS',false,css);}
    return document.execCommand(name,false,value);
}

// Safari 在 Shadow DOM 中于弹框关闭后恢复的选区不会同步到原生编辑缓存，execCommand('insertHTML') 会静默失效，改用 Range 直接拼接内容。
export function insertHTMLContent(editor,html){
    let marked = editor.content.innerHTML;
    if(nativeCommand('insertHTML',html)&&editor.content.innerHTML!==marked){return true;}
    let selection = editor.selection;
    let range = selection.current()||selection.restore();
    range.deleteContents();
    let template = document.createElement('template');
    template.innerHTML = html;
    let last = template.content.lastChild;
    range.insertNode(template.content);
    if(last?.isConnected){
        let caret = document.createRange();
        caret.setStartAfter(last);
        caret.collapse(true);
        selection.select(caret);
    }
    return true;
}
