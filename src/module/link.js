import {unlink,renderIcon} from './icon.js';

// 链接操作使用独立浮层，不向编辑内容添加节点。
export default class EditorLink {
    constructor(editor){
        this.editor = editor;
        this.target = null;
        this.hover = null;
        this.blocked = null;
        this.point = null;
        this.dragging = false;
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'link-toolbar';
        this.toolbar.hidden = true;
        this.toolbar.setAttribute('popover','manual');
        this.toolbar.setAttribute('role','toolbar');
        this.toolbar.setAttribute('aria-label','超链接');
        this.toolbar.innerHTML = `<button type="button" data-link-action="unlink" aria-label="取消超链接">${renderIcon(unlink)}<span>取消超链接</span></button>`;
        editor.shadowRoot.appendChild(this.toolbar);
        editor.locale.apply(this.toolbar);
        this.onHover = event=>{
            let link = this.link(event.target);
            if(!link||event.buttons===1){
                return;
            }
            clearTimeout(this.timer);
            this.hover = link;
            this.blocked = null;
            this.point = {x:event.clientX,y:event.clientY};
            this.refresh();
        };
        this.onLeave = event=>{
            let next = event.relatedTarget;
            if(next instanceof Node&&(this.toolbar.contains(next)||this.target?.contains(next))){
                return;
            }
            clearTimeout(this.timer);
            // 留出从链接移动到浮层的时间。
            this.timer = setTimeout(()=>{
                this.hover = null;
                this.point = null;
                this.refresh();
            },180);
        };
        this.onEnter = ()=>clearTimeout(this.timer);
        this.onSelect = event=>{
            if(event.key==='Escape'){
                return;
            }
            this.hover = null;
            this.point = null;
            this.blocked = null;
            this.refresh();
        };
        this.onDown = event=>{
            if(event.button===0){
                this.dragging = true;
                this.dismiss();
            }
        };
        this.onUp = event=>{
            if(this.dragging){
                this.dragging = false;
                this.onSelect(event);
            }
        };
        this.onOutside = event=>{
            let path = event.composedPath();
            if(!path.includes(this.toolbar)&&!path.some(node=>this.link(node))){
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
        this.onKey = event=>{
            if(event.key==='Escape'&&!this.toolbar.hidden){
                event.preventDefault();
                this.dismiss();
                if(this.toolbar.contains(event.target)){
                    editor.restoreSelection();
                }
            }
        };
        this.toolbar.addEventListener('pointerdown',event=>{
            editor.saveSelection();
            event.preventDefault();
        });
        this.toolbar.addEventListener('click',event=>{
            if(event.target.closest('button')){
                this.unlink();
            }
        });
    }
    connect(){
        this.editor.content.addEventListener('pointerover',this.onHover);
        this.editor.content.addEventListener('pointerout',this.onLeave);
        this.editor.content.addEventListener('pointerdown',this.onDown);
        this.editor.content.addEventListener('keyup',this.onSelect);
        this.toolbar.addEventListener('pointerover',this.onEnter);
        this.toolbar.addEventListener('pointerout',this.onLeave);
        this.editor.shadowRoot.addEventListener('keydown',this.onKey);
        document.addEventListener('pointerdown',this.onOutside);
        document.addEventListener('pointerup',this.onUp);
        document.addEventListener('focusin',this.onFocus);
        window.addEventListener('scroll',this.onScroll,true);
        window.addEventListener('resize',this.onScroll);
    }
    disconnect(){
        this.dismiss();
        this.dragging = false;
        this.editor.content.removeEventListener('pointerover',this.onHover);
        this.editor.content.removeEventListener('pointerout',this.onLeave);
        this.editor.content.removeEventListener('pointerdown',this.onDown);
        this.editor.content.removeEventListener('keyup',this.onSelect);
        this.toolbar.removeEventListener('pointerover',this.onEnter);
        this.toolbar.removeEventListener('pointerout',this.onLeave);
        this.editor.shadowRoot.removeEventListener('keydown',this.onKey);
        document.removeEventListener('pointerdown',this.onOutside);
        document.removeEventListener('pointerup',this.onUp);
        document.removeEventListener('focusin',this.onFocus);
        window.removeEventListener('scroll',this.onScroll,true);
        window.removeEventListener('resize',this.onScroll);
    }
    link(node){
        let link = (node?.nodeType===Node.TEXT_NODE?node.parentElement:node)?.closest?.('a[href]:not([download])');
        return link&&this.editor.content.contains(link)?link:null;
    }
    selected(){
        let range = this.editor.selection.current();
        if(!range){
            return null;
        }
        let first = this.link(range.startContainer);
        return first&&first===this.link(range.endContainer)?first:null;
    }
    dismiss(){
        clearTimeout(this.timer);
        this.blocked = this.selected()?this.editor.selection.current().cloneRange():null;
        this.hover = null;
        this.target = null;
        this.point = null;
        if(this.toolbar.hidePopover&&this.toolbar.matches(':popover-open')){
            this.toolbar.hidePopover();
        }
        this.toolbar.hidden = true;
    }
    refresh(){
        if(this.editor.formControl.disabled){this.dismiss();return;}
        let editor = this.editor;
        let selected = this.selected();
        let current = editor.selection.current();
        if(!selected||this.blocked&&(current.startContainer!==this.blocked.startContainer||current.startOffset!==this.blocked.startOffset||current.endContainer!==this.blocked.endContainer||current.endOffset!==this.blocked.endOffset)){
            this.blocked = null;
        }
        let link = this.link(this.hover)||selected;
        if(!editor.isConnected||editor.source||editor.painter||editor._dialog?.open||editor.dropdown.opened||this.dragging||editor.table?.dragging||editor.table?.bounds()?.area.items.length>1||!link||this.blocked){
            this.dismiss();
            return;
        }
        let range = selected===link&&!this.hover?editor.selection.current():null;
        let rects = Array.from(range?.getClientRects()||link.getClientRects());
        let rect = this.point?rects.find(rect=>this.point.y>=rect.top&&this.point.y<=rect.bottom):rects.at(-1);
        rect ||= link.getBoundingClientRect();
        let body = editor.body.getBoundingClientRect();
        let width = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight;
        if(rect.bottom<=Math.max(0,body.top)||rect.top>=Math.min(height,body.bottom)){
            this.dismiss();
            return;
        }
        this.target = link;
        editor.table?.hide();
        this.toolbar.hidden = false;
        if(this.toolbar.showPopover&&!this.toolbar.matches(':popover-open')){
            this.toolbar.showPopover();
        }
        let size = this.toolbar.getBoundingClientRect();
        let top = rect.bottom+8;
        if(top+size.height>height-8){
            top = rect.top-size.height-8;
        }
        this.toolbar.style.left = Math.max(8,Math.min(rect.left,width-size.width-8))+'px';
        this.toolbar.style.top = Math.max(8,Math.min(top,height-size.height-8))+'px';
    }
    unlink(){
        let editor = this.editor;
        let link = this.link(this.target);
        if(!link||editor.source){
            this.dismiss();
            return;
        }
        editor.saveSelection();
        editor.history.record();
        editor.transaction(()=>{
            let range = editor.getRange().cloneRange();
            let offset = (node,value)=>{
                if(!link.contains(node)){
                    return null;
                }
                let part = document.createRange();
                part.selectNodeContents(link);
                part.setEnd(node,value);
                return part.toString().length;
            };
            let start = offset(range.startContainer,range.startOffset);
            let end = offset(range.endContainer,range.endOffset);
            let text = document.createTextNode(link.textContent);
            this.dismiss();
            link.replaceWith(text);
            if(start!==null){
                range.setStart(text,start);
            }
            if(end!==null){
                range.setEnd(text,end);
            }
            let selection = editor.shadowRoot.getSelection?.()||window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            editor.selection.range = range.cloneRange();
            if(start!==null&&end!==null){
                document.execCommand('removeFormat');
            }
        });
    }
}
