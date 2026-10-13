import {languages} from './language.js';
import {codeText,codeOffset,codePoint,renderCode,normalizeCode} from './content.js';
import {code as icon,chevron,renderIcon} from '../icon.js';

export default class EditorCode {
    constructor(editor){
        this.editor = editor;
        this.target = null;
        this.blocked = null;
        this.dragging = false;
        this.opened = false;
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'code-toolbar';
        this.toolbar.hidden = true;
        this.toolbar.setAttribute('popover','manual');
        this.toolbar.setAttribute('role','toolbar');
        this.toolbar.setAttribute('aria-label','代码块');
        this.toolbar.innerHTML = `<button type="button" class="code-language-trigger" aria-label="编程语言" aria-haspopup="listbox" aria-expanded="false">${renderIcon(icon)}<span class="code-language-label"></span>${renderIcon(chevron,true)}</button>
            <div class="code-language-menu" role="listbox" aria-label="编程语言" hidden>${languages.map(([name,label])=>`<button type="button" role="option" data-language="${name}" aria-selected="false">${label}</button>`).join('')}</div>`;
        editor.shadowRoot.appendChild(this.toolbar);
        this.trigger = this.toolbar.querySelector('.code-language-trigger');
        this.menu = this.toolbar.querySelector('.code-language-menu');
        editor.locale.apply(this.toolbar);
        this.onDown = event=>{
            if(event.button===0){
                this.dragging = true;
                this.dismiss();
            }
        };
        this.onUp = ()=>{
            if(this.dragging){
                this.dragging = false;
                this.blocked = null;
                this.refresh();
            }
        };
        this.onOutside = event=>{
            let path = event.composedPath();
            if(!path.includes(this.toolbar)&&!path.some(node=>node?.closest?.('pre')&&editor.content.contains(node))){
                this.dismiss();
            }
        };
        this.onFocus = event=>{
            if(!event.composedPath().includes(editor)){
                this.dismiss();
            }
        };
        this.onScroll = event=>{
            if(!(event.target instanceof Node)||!this.toolbar.contains(event.target)){
                this.dismiss();
            }
        };
        this.onPaste = event=>{
            if(this.selected()){
                event.preventDefault();
                event.stopImmediatePropagation();
                this.write(event.clipboardData.getData('text/plain'));
            }
        };
        this.onKey = event=>{
            let code = this.selected();
            if(!code||event.isComposing){return;}
            let range = this.range();
            let end = codeOffset(code,range.endContainer,range.endOffset);
            let text = codeText(code);
            if(event.key==='Tab'){
                event.preventDefault();
                this.indent(event.shiftKey);
            }else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
                event.preventDefault();
                this.exit();
            }else if(range.collapsed&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&
                (event.key==='ArrowRight'&&end===text.length||event.key==='ArrowDown'&&end>=text.lastIndexOf('\n')+1)){
                event.preventDefault();
                this.exit();
            }else if(event.key==='Escape'){
                event.preventDefault();
                this.dismiss();
            }
        };
        this.toolbar.addEventListener('pointerdown',event=>{
            editor.saveSelection();
            event.preventDefault();
        });
        this.trigger.addEventListener('click',()=>this.toggle(!this.opened));
        this.menu.addEventListener('click',event=>{
            let button = event.target.closest('[data-language]');
            if(button){this.choose(button.dataset.language);}
        });
        this.toolbar.addEventListener('keydown',event=>{
            if(event.key==='Escape'){
                event.preventDefault();
                if(this.opened){this.toggle(false);}else{this.dismiss();}
                editor.restoreSelection();
            }else if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
                event.preventDefault();
                let opening = !this.opened;
                this.toggle(true);
                let buttons = Array.from(this.menu.children);
                let current = opening?buttons.findIndex(button=>button.getAttribute('aria-selected')==='true'):buttons.indexOf(this.toolbar.getRootNode().activeElement);
                current = Math.max(0,current);
                let next = opening?current:event.key==='Home'?0:event.key==='End'?buttons.length-1:
                    Math.max(0,Math.min(buttons.length-1,current+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)));
                buttons[next].focus({preventScroll:true});
            }
        });
    }
    connect(){
        this.editor.content.addEventListener('pointerdown',this.onDown);
        this.editor.content.addEventListener('keydown',this.onKey,true);
        this.editor.content.addEventListener('paste',this.onPaste,true);
        document.addEventListener('pointerup',this.onUp);
        document.addEventListener('pointerdown',this.onOutside);
        document.addEventListener('focusin',this.onFocus);
        window.addEventListener('scroll',this.onScroll,true);
        window.addEventListener('resize',this.onScroll);
        this.editor.shadowRoot.addEventListener('scroll',this.onScroll,true);
    }
    disconnect(){
        this.dismiss();
        this.dragging = false;
        this.editor.content.removeEventListener('pointerdown',this.onDown);
        this.editor.content.removeEventListener('keydown',this.onKey,true);
        this.editor.content.removeEventListener('paste',this.onPaste,true);
        document.removeEventListener('pointerup',this.onUp);
        document.removeEventListener('pointerdown',this.onOutside);
        document.removeEventListener('focusin',this.onFocus);
        window.removeEventListener('scroll',this.onScroll,true);
        window.removeEventListener('resize',this.onScroll);
        this.editor.shadowRoot.removeEventListener('scroll',this.onScroll,true);
    }
    range(){
        return this.editor.selection.current()||(this.toolbar.contains(this.editor.shadowRoot.activeElement)?this.editor.selection.range:null);
    }
    selected(){
        let range = this.range();
        let find = node=>{
            let element = node?.nodeType===Node.TEXT_NODE?node.parentElement:node;
            return element?.closest?.('pre')?.querySelector('code');
        };
        let code = range&&find(range.startContainer);
        return code&&this.editor.content.contains(code)&&code===find(range.endContainer)?code:null;
    }
    normalize(range=this.editor.getRange()){
        let editor = this.editor;
        if(range&&!editor.content.contains(range.commonAncestorContainer)){range = null;}
        if(normalizeCode(editor.content,true,range)&&range){
            this.select(range);
        }
        editor.content.querySelectorAll('[data-code-boundary]').forEach(paragraph=>{
            if(!this.empty(paragraph)||paragraph.previousElementSibling?.tagName!=='PRE'||paragraph.nextElementSibling){
                paragraph.removeAttribute('data-code-boundary');
            }
        });
        editor.content.querySelectorAll('pre').forEach(pre=>{
            if(!pre.nextSibling){
                let paragraph = document.createElement('p');
                paragraph.setAttribute('data-code-boundary','');
                paragraph.appendChild(document.createElement('br'));
                pre.after(paragraph);
            }
        });
    }
    empty(paragraph){
        return !paragraph.textContent&&!paragraph.querySelector('img,video,audio,table,hr,pre')&&paragraph.querySelectorAll('br').length<=1;
    }
    select(range){
        let selection = this.editor.shadowRoot.getSelection?.()||window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        this.editor.selection.range = range.cloneRange();
    }
    beforeInput(event){
        let code = this.selected();
        if(!code){
            let range = this.range();
            if(!event.isComposing&&range&&!range.collapsed&&['deleteContentBackward','deleteContentForward','deleteByCut'].includes(event.inputType)){
                let blocks = Array.from(this.editor.content.querySelectorAll('pre')).filter(pre=>{
                    let start = codeOffset(pre,range.startContainer,range.startOffset);
                    let end = codeOffset(pre,range.endContainer,range.endOffset);
                    return (start===0||range.comparePoint(pre,0)===0)&&
                        (end===codeText(pre).length||range.comparePoint(pre,pre.childNodes.length)===0);
                });
                if(blocks.length){
                    event.preventDefault();
                    this.editor.history.record();
                    this.editor.transaction(()=>{
                        range.deleteContents();
                        blocks.forEach(pre=>pre.remove());
                        this.editor.normalizeContent(true,range);
                        this.select(range);
                        this.dismiss();
                    });
                    return true;
                }
            }
            let node = range?.startContainer;
            let paragraph = (node?.nodeType===Node.TEXT_NODE?node.parentElement:node)?.closest?.('p');
            let pre = paragraph?.previousElementSibling;
            if(!event.isComposing&&event.inputType==='deleteContentBackward'&&range?.collapsed&&
                this.editor.content.contains(paragraph)&&this.empty(paragraph)&&pre?.tagName==='PRE'){
                event.preventDefault();
                this.remove(pre,paragraph);
                return true;
            }
            return false;
        }
        if(!event.isComposing){
            let range = this.editor.getRange();
            let start = codeOffset(code,range.startContainer,range.startOffset);
            if(['insertParagraph','insertLineBreak'].includes(event.inputType)){
                event.preventDefault();
                this.write('\n');
            }else if(range.collapsed&&(event.inputType==='deleteContentBackward'&&start===0||event.inputType==='deleteContentForward'&&start===codeText(code).length)){
                event.preventDefault();
                if(!codeText(code)){this.remove(code.closest('pre'));}
            }
        }
        return true;
    }
    remove(pre,paragraph){
        let editor = this.editor;
        editor.history.record();
        editor.transaction(()=>{
            if(!paragraph){
                paragraph = pre.nextElementSibling;
                if(!paragraph?.matches('p,h1,h2,h3,h4,h5,h6')){
                    paragraph = document.createElement('p');
                    paragraph.appendChild(document.createElement('br'));
                    pre.after(paragraph);
                }
            }
            paragraph.removeAttribute('data-code-boundary');
            pre.remove();
            let range = document.createRange();
            range.selectNodeContents(paragraph);
            range.collapse(true);
            this.select(range);
            this.dismiss();
        });
    }
    edit(callback){
        let code = this.selected();
        if(!code||this.editor.source){return;}
        let range = this.editor.getRange();
        let result = callback(codeText(code),codeOffset(code,range.startContainer,range.startOffset),codeOffset(code,range.endContainer,range.endOffset));
        this.editor.history.record();
        this.editor.transaction(()=>{
            code.textContent = result.text;
            delete code._highlight;
            renderCode(code,true);
            range = document.createRange();
            range.setStart(...codePoint(code,result.start));
            range.setEnd(...codePoint(code,result.end));
            this.select(range);
            this.blocked = null;
        });
    }
    write(value){
        value = String(value).replace(/\r\n?/g,'\n');
        this.edit((text,start,end)=>({text:text.slice(0,start)+value+text.slice(end),start:start+value.length,end:start+value.length}));
    }
    indent(reverse){
        this.edit((text,start,end)=>{
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
    insert(){
        let editor = this.editor;
        let previous = new Set(editor.content.querySelectorAll('pre code'));
        let pre = document.createElement('pre');
        let code = document.createElement('code');
        code.setAttribute('data-language','javascript');
        code.textContent = editor.getRange()?.toString()||'';
        pre.appendChild(code);
        renderCode(code);
        editor.history.record();
        editor.transaction(()=>{
            document.execCommand('insertHTML',false,pre.outerHTML);
        });
        code = Array.from(editor.content.querySelectorAll('pre code')).find(node=>!previous.has(node));
        if(code){
            let range = document.createRange();
            range.setStart(...codePoint(code,codeText(code).length));
            range.collapse(true);
            this.select(range);
            editor.history.record();
            editor.updateToolbar();
        }
    }
    exit(){
        let code = this.selected();
        if(!code){return;}
        let pre = code.closest('pre');
        let paragraph = pre.nextElementSibling;
        this.editor.history.record();
        this.editor.transaction(()=>{
            if(!paragraph?.matches('p,h1,h2,h3,h4,h5,h6')){
                paragraph = document.createElement('p');
                paragraph.appendChild(document.createElement('br'));
                pre.after(paragraph);
            }
            let range = document.createRange();
            range.selectNodeContents(paragraph);
            range.collapse(true);
            this.select(range);
            this.dismiss();
        });
    }
    choose(language){
        let code = this.target;
        if(!code||!this.editor.content.contains(code)||this.editor.source){return;}
        this.editor.history.record();
        this.editor.transaction(()=>{
            code.setAttribute('data-language',language);
            this.toggle(false);
            this.blocked = null;
        });
    }
    toggle(opened){
        this.opened = opened;
        this.menu.hidden = !opened;
        this.trigger.setAttribute('aria-expanded',String(opened));
        this.refresh();
    }
    dismiss(){
        this.blocked = this.selected()?this.range().cloneRange():null;
        this.target = null;
        this.opened = false;
        this.menu.hidden = true;
        this.trigger.setAttribute('aria-expanded','false');
        if(this.toolbar.hidePopover&&this.toolbar.matches(':popover-open')){this.toolbar.hidePopover();}
        this.toolbar.hidden = true;
    }
    refresh(){
        let editor = this.editor;
        let code = this.selected();
        let range = this.range();
        if(!code||this.blocked&&['startContainer','startOffset','endContainer','endOffset'].some(name=>range[name]!==this.blocked[name])){
            this.blocked = null;
        }
        if(!editor.isConnected||editor.source||editor._dialog?.open||editor.dropdown.opened||this.dragging||editor.table?.dragging||editor.table?.bounds()?.area.items.length>1||!code||this.blocked){
            this.dismiss();
            return;
        }
        let rect = range.getBoundingClientRect();
        if(!rect.height){rect = code.getBoundingClientRect();}
        let body = editor.body.getBoundingClientRect();
        let width = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight;
        if(rect.bottom<=Math.max(0,body.top)||rect.top>=Math.min(height,body.bottom)){
            this.dismiss();
            return;
        }
        this.target = code;
        editor.table?.hide();
        editor.links?.dismiss();
        let language = code.getAttribute('data-language');
        editor.locale.set(this.toolbar.querySelector('.code-language-label'),languages.find(item=>item[0]===language)?.[1]||'纯文本');
        Array.from(this.menu.children).forEach(button=>button.setAttribute('aria-selected',String(button.dataset.language===language)));
        this.toolbar.hidden = false;
        if(this.toolbar.showPopover&&!this.toolbar.matches(':popover-open')){this.toolbar.showPopover();}
        let size = this.toolbar.getBoundingClientRect();
        let top = rect.bottom+8;
        if(top+size.height>height-8){top = rect.top-size.height-8;}
        this.toolbar.style.left = Math.max(8,Math.min(rect.left,width-size.width-8))+'px';
        this.toolbar.style.top = Math.max(8,Math.min(top,height-size.height-8))+'px';
    }
}
