// 共用工具栏的伪元素显示提示，不创建额外节点。
export default class EditorTooltip {
    constructor(editor){
        this.toolbars = [editor.toolbar,editor.footer,editor.table?.toolbar].filter(Boolean);
        this.button = null;
        this.toolbar = null;
        this.onPointer = event=>{
            let button = event.target.closest?.('button[data-action],button[data-table-action]');
            if(event.pointerType==='touch'||!button){
                this.hide();
            }else{
                this.show(button);
            }
        };
        this.onFocus = event=>{
            let button = event.target.closest?.('button[data-action],button[data-table-action]');
            if(button?.matches(':focus-visible')){
                this.show(button);
            }else{
                this.hide();
            }
        };
        this.onLeave = event=>{
            if(this.button&&!this.button.contains(event.relatedTarget)){
                this.hide();
            }
        };
        this.onHide = ()=>this.hide();
        this.onKey = event=>{
            if(event.key==='Escape'){
                this.hide();
            }
        };
    }
    connect(){
        this.toolbars.forEach(toolbar=>{
            toolbar.addEventListener('pointerover',this.onPointer);
            toolbar.addEventListener('pointerout',this.onLeave);
            toolbar.addEventListener('pointerdown',this.onHide);
            toolbar.addEventListener('focusin',this.onFocus);
            toolbar.addEventListener('focusout',this.onHide);
            toolbar.addEventListener('keydown',this.onKey);
        });
        window.addEventListener('resize',this.onHide);
        window.addEventListener('scroll',this.onHide,true);
    }
    disconnect(){
        this.hide();
        this.toolbars.forEach(toolbar=>{
            toolbar.removeEventListener('pointerover',this.onPointer);
            toolbar.removeEventListener('pointerout',this.onLeave);
            toolbar.removeEventListener('pointerdown',this.onHide);
            toolbar.removeEventListener('focusin',this.onFocus);
            toolbar.removeEventListener('focusout',this.onHide);
            toolbar.removeEventListener('keydown',this.onKey);
        });
        window.removeEventListener('resize',this.onHide);
        window.removeEventListener('scroll',this.onHide,true);
    }
    show(button){
        let toolbar = this.toolbars.find(toolbar=>toolbar.contains(button));
        let label = button.getAttribute('aria-label');
        if(!toolbar||toolbar.hidden||!button.isConnected||!label||button.getAttribute('aria-expanded')==='true'){
            this.hide();
            return;
        }
        if(this.toolbar!==toolbar){
            this.hide();
        }
        this.button = button;
        this.toolbar = toolbar;
        toolbar.dataset.tooltip = label;
        let style = window.getComputedStyle(toolbar,'::after');
        let width = parseFloat(style.width);
        let height = parseFloat(style.height);
        let rect = button.getBoundingClientRect();
        let left = Math.max(8,Math.min(rect.left+(rect.width-width)/2,window.innerWidth-width-8));
        let top = rect.bottom+7;
        if(top+height>window.innerHeight-8){
            top = Math.max(8,rect.top-height-7);
        }
        toolbar.style.setProperty('--tooltip-left',left+'px');
        toolbar.style.setProperty('--tooltip-top',top+'px');
    }
    refresh(){
        if(this.button){
            this.show(this.button);
        }
    }
    hide(){
        if(this.toolbar){
            this.toolbar.removeAttribute('data-tooltip');
            this.toolbar.style.removeProperty('--tooltip-left');
            this.toolbar.style.removeProperty('--tooltip-top');
        }
        this.button = null;
        this.toolbar = null;
    }
}
