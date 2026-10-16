import normalizeParagraphs from './method/normalizeParagraphs.js';

// 只遍历实际变动的分支；直接修改正文 DOM 也会被同一观察器捕获。
export default class EditorNormalizer {
    constructor(editor){
        this.editor = editor;
        this.dirty = new Set();
        this.observer = new MutationObserver(records=>this.mark(records));
    }
    connect(){
        this.full = true;
        this.observer.observe(this.editor.content,{subtree:true,childList:true,characterData:true,attributes:true});
    }
    disconnect(){
        this.observer.disconnect();
        this.dirty.clear();
        this.full = true;
    }
    mark(records){
        let content = this.editor.content;
        records.forEach(record=>{
            for(let node=record.target;node&&node!==content.parentNode;node=node.parentNode){this.dirty.add(node);}
            record.addedNodes.forEach(node=>{
                this.dirty.add(node);
                node.querySelectorAll?.('*').forEach(child=>this.dirty.add(child));
            });
        });
    }
    collect(){
        this.mark(this.observer.takeRecords());
        return this.full?null:this.dirty;
    }
    normalize(range,ensure){
        let content = this.editor.content;
        let dirty = this.collect();
        let changed = false;
        if(!dirty||dirty.size||ensure&&!content.childNodes.length){
            changed = normalizeParagraphs(content,range,ensure,dirty);
        }
        this.full = false;
        this.dirty.clear();
        this.observer.takeRecords();
        return changed;
    }
}
