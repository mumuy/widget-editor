import features from './feature/index.js';
import {insertFeatures} from './feature/insert.js';
import EditorDropdown from './dropdown.js';
import {renderIcon,undo,redo,fullscreen} from './icon.js';

const controls = [
    {name:'undo',label:'撤销',icon:undo,execute:editor=>editor.history.move(-1)},
    {name:'redo',label:'重做',icon:redo,execute:editor=>editor.history.move(1)},
    ...features,
    {name:'fullscreen',label:'全屏',icon:fullscreen,type:'button',view:true,
        execute:editor=>editor.fullscreen.state?editor.fullscreen.close():editor.fullscreen.open(),
        active:editor=>!!editor.fullscreen?.state},
    ...insertFeatures.map(feature=>({...feature,insertion:true}))
];

// 功能注册、工具栏渲染和命令可用状态共用一份配置。
export default class EditorToolbar {
    constructor(editor){
        this.editor = editor;
    }
    get(name){
        return this.features.get(String(name).toLowerCase());
    }
    render(){
        let editor = this.editor;
        this.features = new Map(controls.map(feature=>[
            feature.name.toLowerCase(),
            typeof feature.options==='function'?{...feature,options:feature.options(editor)}:feature
        ]));
        let names = editor.config.list('custom').filter(name=>!['undo','redo'].includes(name));
        this.items = ['undo','redo',...names].map(name=>this.get(name)).filter(Boolean);
        return this.items.map(feature=>{
            if(feature.type==='dropdown'){
                return feature.options.length?EditorDropdown.render(feature):'';
            }
            if(feature.type==='color'){
                return feature.render();
            }
            return this.renderButton(feature);
        }).join('');
    }
    renderButton(feature,className=''){
        return `<button type="button" class="tool tool-button ${className}" data-action="${feature.name}" aria-label="${feature.label}">${renderIcon(feature.icon)}</button>`;
    }
    renderView(){
        return Array.from(this.features.values()).filter(feature=>feature.view).map(feature=>this.renderButton(feature,feature.name+'-button')).join('');
    }
    get views(){
        return this.editor.config.list('view').map(name=>this.get(name)).filter(feature=>feature?.view);
    }
    canView(name){
        return this.views.some(feature=>feature.name===name)||this.items.some(feature=>feature.name===name);
    }
    updateView(){
        let editor = this.editor;
        let names = this.views.map(feature=>feature.name);
        editor.footer.querySelectorAll('[data-action]').forEach(button=>{
            button.hidden = !names.includes(button.dataset.action);
        });
        names.forEach(name=>editor.wordCount.before(editor.footer.querySelector('[data-action="'+name+'"]')));
        if(!this.canView('mobile')){editor.mobile?.close();}
        if(!this.canView('fullscreen')){editor.fullscreen?.close();}
        if(editor.source&&!this.canView('source')){editor.toggleSource();}
    }
    canInsert(name){
        let feature = this.get(name);
        if(!feature?.insertion||this.editor.config.methods(feature.name)?.length===0){
            return false;
        }
        return this.editor.bindings.has(feature.name)||this.items.some(item=>item===feature||item.name==='insert'&&item.options.some(option=>option.value===feature.name));
    }
    disabled(feature,inCode=!!this.editor.codes?.selected()){
        if(!feature){return true;}
        let editor = this.editor;
        let name = feature.name;
        if(editor.formControl.disabled){return true;}
        if(feature.view&&!this.canView(name)){return true;}
        if(editor.source&&!['source','fullscreen','mobile'].includes(name)){return true;}
        if(inCode&&!['undo','redo','source','fullscreen','mobile','format'].includes(name)){return true;}
        if(name==='undo'){return !editor.history.canUndo;}
        if(name==='redo'){return !editor.history.canRedo;}
        return feature.type==='dropdown'&&!feature.options.length||!!feature.insertion&&!this.canInsert(name);
    }
    update(){
        let editor = this.editor;
        let inCode = !!editor.codes?.selected();
        editor.panel.querySelectorAll('[data-action]').forEach(control=>{
            let feature = this.get(control.dataset.action);
            control.disabled = this.disabled(feature,inCode);
            if(!feature){return;}
            if(feature.type==='dropdown'){
                editor.dropdown.update(feature,feature.value?.(editor));
            }else if(feature.type==='color'){
                feature.update(editor,feature.value(editor));
            }else if(feature.active){
                let active = feature.active(editor);
                control.classList.toggle('active',active);
                control.setAttribute('aria-pressed',String(active));
            }
        });
    }
}
