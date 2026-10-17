import nativeCommand from './native.js';
import {escapeHTML} from '../method/sanitize.js';
import {fontFamily,fontSize,color,format,formatPainter} from './style.js';
import {blockquote,indentation} from './paragraph.js';
import {link,unlink} from './link.js';
import {insertMedia,insertFrame,updateImage} from './media.js';
import {insertTable,editTable,alignTable} from './table.js';
import {selectedCode,editCode,writeCode,indentCode,insertCode,codeLanguage} from './code.js';

const native = new Set(['bold','italic','underline','strikethrough','superscript','subscript',
    'insertorderedlist','insertunorderedlist','justifyleft','justifycenter','justifyright','justifyfull','formatblock']);
const inCode = new Set(['undo','redo','format','codeedit','codewrite','codeindent','codelanguage']);
const commands = {
    fontfamily:fontFamily,
    fontsize:fontSize,
    color,
    backgroundcolor:(editor,value)=>color(editor,value,'background-color'),
    format,
    formatpainter:formatPainter,
    blockquote,
    indentation,
    heading(editor,value){
        if(!/^(p|h[1-6])$/.test(value)||!editor.config.list('heading').includes(value)){return false;}
        return editor.transaction(()=>nativeCommand('formatBlock','<'+value+'>',true));
    },
    alignment(editor,value){
        let names = {left:'justifyLeft',center:'justifyCenter',right:'justifyRight',justify:'justifyFull'};
        if(!Object.hasOwn(names,value)||!editor.config.list('alignment').includes(value)){return false;}
        if(editor.table?.bounds()?.area||editor.selectedElement()?.closest('td,th')){
            return alignTable(editor,value);
        }
        return editor.transaction(()=>nativeCommand(names[value],null,true));
    },
    orderedlist:editor=>editor.command('insertOrderedList'),
    unorderedlist:editor=>editor.command('insertUnorderedList'),
    link,
    unlink,
    insertmedia:insertMedia,
    insertiframe:insertFrame,
    updateimage:updateImage,
    inserttable:insertTable,
    tableedit:editTable,
    insertcode:insertCode,
    codelanguage:codeLanguage,
    codeedit:editCode,
    codewrite:writeCode,
    codeindent:indentCode,
    inserthtml:(editor,value)=>editor.insertHTML(value),
    inserttext:(editor,value)=>editor.insertHTML(escapeHTML(value??'')),
    divider:editor=>editor.insertHTML('<hr><p><br></p>'),
    undo:editor=>editor.history.move(-1),
    redo:editor=>editor.history.move(1)
};

// 内容命令不依赖工具栏或弹框，可直接复用；界面权限由 execute/openInsertDialog 处理。
export default function executeCommand(editor,name,value,css=true){
    if(!editor._initialized||editor.source||editor.formControl.disabled||editor._composing){return false;}
    name = String(name).trim().toLowerCase();
    if(selectedCode(editor)&&!inCode.has(name)){return false;}
    if(Object.hasOwn(commands,name)){
        let result = commands[name](editor,value??undefined);
        return result===undefined?true:result;
    }
    if(!native.has(name)){return false;}
    return editor.transaction(()=>nativeCommand(name,value,['superscript','subscript'].includes(name)?false:css));
}
