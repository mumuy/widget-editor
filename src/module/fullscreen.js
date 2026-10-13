import {fullscreen,fullscreenExit,renderIcon} from './icon.js';

let active = null;

// 使用组件自身的顶层面板铺满视口，不进入浏览器的屏幕全屏。
export default class EditorFullscreen {
    constructor(editor){
        this.editor = editor;
        this.panel = editor.panel;
        this.button = editor.footer.querySelector('[data-action="fullscreen"]');
        this.state = null;
        this.button.addEventListener('pointerdown',event=>{
            editor.saveSelection();
            event.preventDefault();
        });
        this.button.addEventListener('click',()=>this.state?this.close():this.open());
        this.onKey = event=>{
            if(event.key==='Escape'&&this.state&&!editor._dialog?.open&&!editor.dropdown.opened&&editor.table?.toolbar.hidden!==false&&editor.links.toolbar.hidden&&!editor.painter){
                event.preventDefault();
                event.stopPropagation();
                this.close();
            }
        };
    }
    connect(){
        this.editor.shadowRoot.addEventListener('keydown',this.onKey,true);
    }
    disconnect(){
        this.close();
        this.editor.shadowRoot.removeEventListener('keydown',this.onKey,true);
    }
    open(){
        if(this.state||!this.editor.isConnected){
            return;
        }
        active?.close();
        let editor = this.editor;
        editor.saveSelection();
        editor.dropdown.close();
        editor.table?.dismiss();
        editor.links.dismiss();
        editor.tooltip.hide();
        this.state = {
            x:window.scrollX,
            y:window.scrollY,
            height:editor.style.getPropertyValue('height'),
            priority:editor.style.getPropertyPriority('height'),
            scroll:editor.body.scrollTop,
            styles:[document.documentElement,document.body].flatMap(element=>['overflow-x','overflow-y'].map(name=>({
                element,name,
                value:element.style.getPropertyValue(name),
                priority:element.style.getPropertyPriority(name)
            })))
        };
        editor.style.setProperty('height',editor.getBoundingClientRect().height+'px','important');
        this.state.styles.forEach(({element,name})=>element.style.setProperty(name,'hidden','important'));
        this.panel.classList.add('fullscreen');
        if(this.panel.showPopover){
            this.panel.setAttribute('popover','manual');
            this.panel.showPopover();
        }
        active = this;
        this.update(true);
    }
    close(){
        if(!this.state){
            return;
        }
        let state = this.state;
        let editor = this.editor;
        editor.dropdown.close();
        editor.table?.dismiss();
        editor.links.dismiss();
        editor.tooltip?.hide();
        editor._dialog?.dismiss();
        if(this.panel.hasAttribute('popover')){
            if(this.panel.matches(':popover-open')){
                this.panel.hidePopover();
            }
            this.panel.removeAttribute('popover');
        }
        this.panel.classList.remove('fullscreen');
        if(state.height){
            editor.style.setProperty('height',state.height,state.priority);
        }else{
            editor.style.removeProperty('height');
        }
        state.styles.forEach(({element,name,value,priority})=>{
            if(value){
                element.style.setProperty(name,value,priority);
            }else{
                element.style.removeProperty(name);
            }
        });
        editor.body.scrollTop = state.scroll;
        window.scrollTo({left:state.x,top:state.y,behavior:'instant'});
        this.state = null;
        active = null;
        this.update(false);
    }
    update(enabled){
        [this.button,...this.editor.toolbar.querySelectorAll('[data-action="fullscreen"]')].forEach(button=>{
            let icon = enabled?fullscreenExit:fullscreen;
            if(button._icon!==icon){
                button.innerHTML = renderIcon(icon);
                button._icon = icon;
            }
            button.classList.toggle('active',enabled);
            button.setAttribute('aria-pressed',String(enabled));
            this.editor.locale.set(button,enabled?'退出全屏':'全屏',{},'aria-label');
        });
    }
}
