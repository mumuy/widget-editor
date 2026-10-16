import {safeURL} from './method/sanitize.js';
import {imageAlignment} from './commands/media.js';

// 图片属性在独立浮层中编辑，编辑器正文只保留可输出的图片和样式。
export default class EditorImage {
    constructor(editor){
        this.editor = editor;
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'image-toolbar';
        this.toolbar.hidden = true;
        this.toolbar.setAttribute('popover','manual');
        this.toolbar.setAttribute('role','dialog');
        this.toolbar.setAttribute('aria-label','编辑图片');
        this.toolbar.innerHTML = `<form class="image-form">
            <div class="dialog-fields">
                <label class="field"><span>图片地址</span><input name="url" type="text" required></label>
                <label class="field"><span>图片描述</span><input name="alt" type="text"></label>
                <label class="field"><span>图片宽度</span><input name="width" type="number" min="1" max="4096" placeholder="自动"></label>
                <div class="image-align" role="group" aria-label="对齐方式">${['默认','左对齐','居中对齐','右对齐'].map((label,index)=>`<button type="button" data-image-align="${index}" aria-pressed="false">${label}</button>`).join('')}</div>
            </div>
            <div class="image-actions"><button type="button" class="btn" data-image-replace>替换图片</button><button type="submit" class="btn btn-primary">保存</button></div>
        </form>`;
        this.form = this.toolbar.querySelector('form');
        editor.shadowRoot.appendChild(this.toolbar);
        editor.locale.apply(this.toolbar);
        this.onSelect = event=>{
            let image = event.target.closest?.('img');
            if(!image||!editor.content.contains(image)||editor.formControl.disabled){return;}
            let range = document.createRange();
            range.selectNode(image);
            editor.blocks.select(range);
            this.target = image;
            this.fill();
            this.refresh();
        };
        this.onOutside = event=>{
            let path = event.composedPath();
            if(!path.includes(this.toolbar)&&!path.includes(this.target)){this.dismiss();}
        };
        this.onScroll = ()=>this.refresh();
        this.onKey = event=>{
            if(event.isComposing||editor._composing){return;}
            if(event.key==='Escape'&&!this.toolbar.hidden){
                event.preventDefault();
                this.dismiss();
                editor.restoreSelection();
            }
        };
        this.toolbar.addEventListener('click',event=>{
            let align = event.target.closest('[data-image-align]');
            if(align){this.setAlign(Number(align.dataset.imageAlign));}
            if(event.target.closest('[data-image-replace]')){
                let image = this.target;
                if(!image?.isConnected){return;}
                let range = document.createRange();
                range.selectNode(image);
                editor.blocks.select(range);
                this.dismiss();
                editor.openInsertDialog('image');
            }
        });
        this.form.addEventListener('submit',event=>{
            event.preventDefault();
            let image = this.target;
            let src = safeURL(this.form.elements.url.value,'image');
            this.form.elements.url.setCustomValidity(src?'':editor.t('请输入有效的图片地址'));
            if(!image?.isConnected||!this.form.reportValidity()){return;}
            editor.command('updateImage',{
                image,url:src,alt:this.form.elements.alt.value,
                width:this.form.elements.width.value,alignment:this.align
            });
            this.dismiss();
        });
        this.form.elements.url.addEventListener('input',()=>this.form.elements.url.setCustomValidity(''));
    }
    connect(){
        this.editor.content.addEventListener('pointerup',this.onSelect);
        document.addEventListener('pointerdown',this.onOutside);
        this.editor.shadowRoot.addEventListener('keydown',this.onKey);
        window.addEventListener('scroll',this.onScroll,true);
        window.addEventListener('resize',this.onScroll);
    }
    disconnect(){
        this.dismiss();
        this.editor.content.removeEventListener('pointerup',this.onSelect);
        document.removeEventListener('pointerdown',this.onOutside);
        this.editor.shadowRoot.removeEventListener('keydown',this.onKey);
        window.removeEventListener('scroll',this.onScroll,true);
        window.removeEventListener('resize',this.onScroll);
    }
    setAlign(value){
        this.align = value;
        this.toolbar.querySelectorAll('[data-image-align]').forEach(button=>{
            button.setAttribute('aria-pressed',String(Number(button.dataset.imageAlign)===value));
        });
    }
    fill(){
        let image = this.target;
        this.form.elements.url.value = image.getAttribute('src');
        this.form.elements.url.setCustomValidity('');
        this.form.elements.alt.value = image.alt;
        this.form.elements.width.value = image.getAttribute('width')||'';
        this.setAlign(imageAlignment(image));
        this.toolbar.querySelector('[data-image-replace]').disabled = !this.editor.config.methods('image').length;
    }
    refresh(){
        let editor = this.editor;
        let image = this.target;
        if(!image||!editor.content.contains(image)||editor.source||editor.formControl.disabled||editor._dialog){this.dismiss();return;}
        let range = editor.selection.current();
        let focused = this.toolbar.contains(editor.shadowRoot.activeElement);
        if(!focused&&range&&!range.intersectsNode(image)){this.dismiss();return;}
        this.toolbar.hidden = false;
        if(!this.toolbar.matches(':popover-open')){this.toolbar.showPopover();}
        let rect = image.getBoundingClientRect();
        let box = this.toolbar.getBoundingClientRect();
        this.toolbar.style.left = Math.max(8,Math.min(rect.right-box.width,window.innerWidth-box.width-8))+'px';
        let top = rect.top-box.height-8;
        if(top<8){top = rect.bottom+8;}
        this.toolbar.style.top = Math.max(8,Math.min(top,window.innerHeight-box.height-8))+'px';
    }
    dismiss(){
        this.target = null;
        this.toolbar.hidden = true;
        if(this.toolbar.matches(':popover-open')){this.toolbar.hidePopover();}
    }
}
