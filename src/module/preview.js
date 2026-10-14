// 保留编辑节点与内容，只切换手机视口和只读状态。
export default class EditorPreview {
    constructor(editor){
        this.editor = editor;
        this.active = false;
        this.scroll = 0;
        this.button = editor.footer.querySelector('[data-action="preview"]');
        this.observer = new ResizeObserver(()=>this.fit());
        this.button.addEventListener('pointerdown',event=>{
            editor.saveSelection();
            event.preventDefault();
        });
        this.button.addEventListener('click',()=>editor.execute('preview'));
        this.onKey = event=>{
            if(event.key==='Escape'&&!event.defaultPrevented&&this.active){
                event.preventDefault();
                event.stopPropagation();
                this.close();
            }
        };
    }
    connect(){
        [this.editor.panel,this.editor.toolbar.parentElement,this.editor.footer].forEach(node=>this.observer.observe(node));
        this.editor.shadowRoot.addEventListener('keydown',this.onKey,true);
    }
    disconnect(){
        this.observer.disconnect();
        this.editor.shadowRoot.removeEventListener('keydown',this.onKey,true);
        this.close();
    }
    toggle(){
        this.active?this.close():this.open();
    }
    open(){
        let editor = this.editor;
        if(this.active||editor.formControl.disabled||!editor.isConnected){return;}
        if(editor.source){editor.toggleSource();}
        editor._dialog?.dismiss();
        editor.dropdown.close();
        editor.cancelPainter();
        editor.saveSelection();
        editor.table?.dismiss();
        editor.links.dismiss();
        editor.codes.dismiss();
        editor.tooltip.hide();
        this.scroll = editor.body.scrollTop;
        this.range = editor.selection.range?.cloneRange();
        this.active = true;
        editor.panel.classList.add('mobile-preview');
        editor.formControl.updateEditing();
        if(editor.selection.current()){
            (editor.shadowRoot.getSelection?.()||window.getSelection()).removeAllRanges();
        }
        this.fit();
        editor.body.scrollTop = 0;
        editor.updateToolbar();
    }
    close(){
        if(!this.active){return;}
        let editor = this.editor;
        this.active = false;
        editor.panel.classList.remove('mobile-preview');
        editor.panel.style.removeProperty('--preview-scale');
        editor.formControl.updateEditing();
        editor.selection.range = this.range||null;
        this.range = null;
        if(editor.isConnected&&!editor.formControl.disabled){editor.selection.restore();}
        editor.body.scrollTop = this.scroll;
        editor.updateToolbar();
    }
    fit(){
        if(!this.active){return;}
        let editor = this.editor;
        let width = editor.panel.clientWidth-32;
        let height = editor.fullscreen?.state?
            editor.panel.clientHeight-editor.toolbar.parentElement.offsetHeight-editor.footer.offsetHeight-32:Infinity;
        let scale = Math.max(.1,Math.min(1,width/375,height/667));
        editor.panel.style.setProperty('--preview-scale',String(scale));
    }
    update(){
        [this.button,...this.editor.toolbar.querySelectorAll('[data-action="preview"]')].forEach(button=>{
            this.editor.locale.set(button,this.active?'退出手机预览':'手机预览',{},'aria-label');
        });
    }
}
