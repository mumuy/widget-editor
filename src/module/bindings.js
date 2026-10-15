import {mediaAttributes} from './config.js';

// 在组件所在的文档或 ShadowRoot 委托事件，兼容后加入及替换的外部节点。
export default class EditorBindings {
    constructor(editor){
        this.editor = editor;
        this.onPointer = event=>{
            if(this.feature(event)){editor.saveSelection();}
        };
        this.onClick = event=>{
            let name = this.feature(event);
            if(!name||event.defaultPrevented){return;}
            event.preventDefault();
            editor.execute(name,null,event);
        };
    }
    has(name){
        return mediaAttributes.includes(name)&&!!this.editor.config.get(name+'-bind').trim();
    }
    feature(event){
        let path = event.composedPath();
        return mediaAttributes.find(name=>{
            let id = this.editor.config.get(name+'-bind').trim();
            let node = id&&this.root.getElementById(id);
            return node&&path.includes(node);
        });
    }
    connect(){
        this.disconnect();
        this.root = this.editor.getRootNode();
        this.root.addEventListener('pointerdown',this.onPointer);
        this.root.addEventListener('click',this.onClick);
    }
    disconnect(){
        this.root?.removeEventListener('pointerdown',this.onPointer);
        this.root?.removeEventListener('click',this.onClick);
        this.root = null;
    }
}
