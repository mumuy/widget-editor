import {escapeHTML} from './method/sanitize.js';
import {fileType,imageTypes,videoTypes,audioTypes} from './method/file.js';

// 文件粘贴与拖入沿用上传弹框、权限、数量校验及 upload 回调。
export default class EditorClipboard {
    constructor(editor){
        this.editor = editor;
        editor.content.addEventListener('paste',event=>{
            event.preventDefault();
            if(editor.formControl.disabled||editor._composing){return;}
            editor.saveSelection();
            let data = event.clipboardData;
            if(data.files.length){this.files(data.files);return;}
            let html = data.getData('text/html');
            let text = data.getData('text/plain');
            let lines = text.split(/\r\n?|\n/);
            editor.insertHTML(html?this.clean(html):lines.length>1?
                lines.map(line=>'<p>'+(escapeHTML(line)||'<br>')+'</p>').join(''):escapeHTML(text));
        });
        editor.content.addEventListener('dragover',event=>{
            if(event.dataTransfer.types.includes('Files')){event.preventDefault();}
        });
        editor.content.addEventListener('drop',event=>{
            event.preventDefault();
            if(editor.formControl.disabled||editor._composing||!event.dataTransfer.files.length){return;}
            let range;
            if(document.caretPositionFromPoint){
                let point = document.caretPositionFromPoint(event.clientX,event.clientY,{shadowRoots:[editor.shadowRoot]});
                if(point){range = document.createRange();range.setStart(point.offsetNode,point.offset);range.collapse(true);}
            }
            range ||= document.caretRangeFromPoint?.(event.clientX,event.clientY);
            if(range&&editor.content.contains(range.startContainer)){
                editor.blocks.select(range);
            }
            editor.saveSelection();
            if(!editor.codes.selected()){this.files(event.dataTransfer.files);}
        });
    }
    files(files){
        files = Array.from(files);
        let types = {image:imageTypes,video:videoTypes,audio:audioTypes};
        let kind = Object.keys(types).find(type=>files.every(file=>fileType(file,types[type])))||'attachment';
        if(!this.editor.canInsert(kind)){return;}
        let dialog = this.editor.openInsertDialog(kind,'upload');
        if(!dialog){return;}
        let input = dialog.querySelector('[name="file"]');
        let transfer = new DataTransfer();
        files.forEach(file=>transfer.items.add(file));
        input.files = transfer.files;
        input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    clean(html){
        let template = document.createElement('template');
        template.innerHTML = html;
        let list = null;
        let previous = null;
        let listId;
        // Word 的列表常以带 mso-list 的段落表示，先还原列表再交给统一清理。
        template.content.querySelectorAll('p').forEach(paragraph=>{
            let rule = paragraph.getAttribute('style')?.match(/mso-list\s*:\s*([^;]+)/i)?.[1];
            if(!rule||/^none\b/i.test(rule)){list = null;previous = null;return;}
            let text = paragraph.textContent.trim();
            let ordered = /^(?:\d+|[a-zA-Z])[.)]\s/.test(text);
            let tag = ordered?'ol':'ul';
            if(!list||list.localName!==tag||rule!==listId||previous?.nextElementSibling!==paragraph){
                list = document.createElement(tag);
                paragraph.before(list);
                listId = rule;
            }
            let marker = paragraph.querySelector('[style*="Ignore"],[style*="ignore"]');
            if(marker){marker.remove();}
            else{
                let walker = document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT);
                let first = walker.nextNode();
                if(first){first.data = first.data.replace(/^\s*(?:\d+[.)]|[a-zA-Z][.)]|[•·●○▪o])\s+/, '');}
            }
            let item = document.createElement('li');
            item.append(...paragraph.childNodes);
            list.appendChild(item);
            previous = list;
            paragraph.remove();
        });
        return template.innerHTML;
    }
}
