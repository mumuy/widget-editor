// 保留编辑节点与操作，只切换手机视口尺寸。
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
            if(event.key==='Escape'&&!event.defaultPrevented&&this.active&&!editor._dialog?.open&&
                !editor.dropdown.opened&&editor.table?.toolbar.hidden!==false&&editor.links.toolbar.hidden&&
                editor.codes.toolbar.hidden&&!editor.painter){
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
        if(this.active||editor.formControl.disabled||!editor.isConnected||!editor.tools.canView('preview')){return;}
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
        this.value = editor.value;
        this.active = true;
        editor.panel.classList.add('mobile-preview');
        this.fit();
        editor.selection.ensureVisible();
        editor.updateToolbar();
    }
    close(){
        if(!this.active){return;}
        let editor = this.editor;
        editor.saveSelection();
        this.active = false;
        editor.panel.classList.remove('mobile-preview');
        editor.panel.style.removeProperty('--preview-scale');
        if(editor.isConnected&&!editor.formControl.disabled){editor.selection.restore();}
        if(editor.value===this.value){
            editor.body.scrollTop = this.scroll;
        }
        editor.selection.ensureVisible();
        this.value = null;
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
