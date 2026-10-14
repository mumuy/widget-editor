import {unlink,renderIcon} from './icon.js';
import {safeURL,escapeHTML,setLinkTarget} from './method/sanitize.js';

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
        this.toolbar.setAttribute('role','dialog');
        this.toolbar.setAttribute('aria-label','编辑超链接');
        this.toolbar.innerHTML = `<form class="link-form">
            <div class="dialog-fields">
                <label class="field"><span>链接地址</span><input type="text" name="url" required placeholder="https://example.com"></label>
                <label class="field"><span>显示文字</span><input type="text" name="text" placeholder="留空时使用链接地址"></label>
                <label class="field field-checkbox"><span>在新窗口打开</span><input type="checkbox" name="newWindow"></label>
            </div>
            <p class="dialog-notice" role="status" aria-live="polite"></p>
            <div class="link-actions">
                <button type="button" class="btn" data-link-action="unlink">${renderIcon(unlink)}<span>取消超链接</span></button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>`;
        this.form = this.toolbar.querySelector('form');
        this.notice = this.toolbar.querySelector('.dialog-notice');
        editor.shadowRoot.appendChild(this.toolbar);
        editor.locale.apply(this.toolbar);
        this.onHover = event=>{
            if(this.focused()){return;}
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
                if(this.focused()){return;}
                this.hover = null;
                this.point = null;
                this.refresh();
            },180);
        };
        this.onEnter = ()=>clearTimeout(this.timer);
        this.onSelect = event=>{
            if(event.key==='Escape'||event.key==='Enter'&&this.blocked){
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
                if(this.toolbar.contains(event.target)){
                    editor.restoreSelection();
                }
                this.dismiss();
            }
        };
        this.toolbar.addEventListener('pointerdown',event=>{
            if(!this.focused()){editor.saveSelection();}
            if(event.target.closest('button')){event.preventDefault();}
        });
        this.toolbar.addEventListener('click',event=>{
            if(event.target.closest('[data-link-action="unlink"]')){
                this.unlink();
            }
        });
        this.form.addEventListener('input',()=>editor.locale.set(this.notice,''));
        this.form.addEventListener('submit',event=>{
            event.preventDefault();
            if(this.toolbar.hidden||!this.link(this.target)||!this.form.reportValidity()){return;}
            if(!this.apply({url:this.form.elements.url.value,text:this.form.elements.text.value,
                newWindow:this.form.elements.newWindow.checked},this.target)){
                editor.locale.set(this.notice,'请输入有效的链接地址');
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
        let range = this.focused()?this.editor.selection.range:this.editor.selection.current();
        if(!range){
            return null;
        }
        let first = this.link(range.startContainer);
        return first&&first===this.link(range.endContainer)?first:null;
    }
    focused(){
        return this.toolbar.contains(this.editor.shadowRoot.activeElement);
    }
    openDialog(){
        let editor = this.editor;
        let range = editor.getRange();
        let link = this.link(editor.selectedElement());
        if(link&&range&&!range.collapsed&&this.link(range.endContainer)!==link){link = null;}
        editor.openDialog({
            title:link?'编辑超链接':'超链接',
            fields:[
                {name:'url',label:'链接地址',type:'text',value:link?.getAttribute('href')||'',
                    required:true,placeholder:'https://example.com'},
                {name:'text',label:'显示文字',type:'text',value:link?link.textContent:range?.toString()||'',
                    placeholder:'留空时使用链接地址'},
                {name:'newWindow',label:'在新窗口打开',type:'checkbox',value:link?.getAttribute('target')!=='_self'}
            ],
            submitLabel:'确定',
            onSubmit:(values,dialog)=>{
                if(!this.apply(values,link,range)){
                    dialog.message('请输入有效的链接地址');
                    return false;
                }
                return true;
            }
        });
    }
    apply(values,link=null,range=this.editor.getRange()){
        let editor = this.editor;
        let url = safeURL(String(values.url||'').trim());
        if(!url||editor.source||editor.readOnly||link&&!this.link(link)){return false;}
        let text = String(values.text||'').trim()||url;
        editor.history.record();
        if(link){
            editor.transaction(()=>{
                link.setAttribute('href',url);
                setLinkTarget(link,values.newWindow);
                if(text!==link.textContent){
                    link.textContent = text;
                    let selection = document.createRange();
                    selection.selectNodeContents(link);
                    selection.collapse(false);
                    editor.selection.range = selection;
                    editor.restoreSelection();
                }
                this.dismiss();
            });
        }else if(range&&!range.collapsed&&text===range.toString()){
            editor.transaction(()=>{
                document.execCommand('createLink',false,url);
                let selected = editor.selection.current();
                editor.content.querySelectorAll('a[href]:not([download])').forEach(node=>{
                    if(selected?.intersectsNode(node)){setLinkTarget(node,values.newWindow);}
                });
                this.dismiss();
            });
        }else{
            editor.insertHTML('<a href="'+escapeHTML(url)+'" target="'+(values.newWindow?'_blank':'_self')+'">'+escapeHTML(text)+'</a>');
        }
        return true;
    }
    dismiss(){
        clearTimeout(this.timer);
        let range = this.focused()?this.editor.selection.range:this.editor.selection.current();
        this.blocked = this.selected()&&range?range.cloneRange():null;
        this.hover = null;
        this.target = null;
        this.point = null;
        if(this.toolbar.hidePopover&&this.toolbar.matches(':popover-open')){
            this.toolbar.hidePopover();
        }
        this.toolbar.hidden = true;
    }
    refresh(){
        if(this.editor.readOnly){this.dismiss();return;}
        let editor = this.editor;
        let selected = this.selected();
        let current = this.focused()?editor.selection.range:editor.selection.current();
        if(!selected||this.blocked&&(current.startContainer!==this.blocked.startContainer||current.startOffset!==this.blocked.startOffset||current.endContainer!==this.blocked.endContainer||current.endOffset!==this.blocked.endOffset)){
            this.blocked = null;
        }
        let link = this.focused()?this.link(this.target):this.link(this.hover)||selected;
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
        if(this.target!==link){
            this.form.elements.url.value = link.getAttribute('href');
            this.form.elements.text.value = link.textContent;
            this.form.elements.newWindow.checked = link.getAttribute('target')!=='_self';
            editor.locale.set(this.notice,'');
        }
        this.target = link;
        editor.table?.hide();
        this.toolbar.hidden = false;
        if(this.toolbar.showPopover&&!this.toolbar.matches(':popover-open')){
            this.toolbar.showPopover();
        }
        if(this.focused()){return;}
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
        if(!link||editor.source||editor.readOnly){
            this.dismiss();
            return;
        }
        if(!this.focused()){editor.saveSelection();}
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
