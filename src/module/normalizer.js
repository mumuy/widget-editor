import normalizeParagraphs from './method/normalizeParagraphs.js';

// 只遍历实际变动的分支；直接修改正文 DOM 也会被同一观察器捕获。
export default class EditorNormalizer {
    constructor(editor){
        this.editor = editor;
        this.records = [];
        this.observer = new MutationObserver(records=>this.records.push(...records));
    }
    connect(){
        this.full = true;
        this.observer.observe(this.editor.content,{subtree:true,childList:true,characterData:true,attributes:true});
    }
    disconnect(){
        this.observer.disconnect();
        this.records = [];
        this.full = true;
    }
    normalize(range,ensure){
        let content = this.editor.content;
        let records = this.records.splice(0).concat(this.observer.takeRecords());
        let dirty = new Set();
        records.forEach(record=>{
            for(let node=record.target;node&&node!==content.parentNode;node=node.parentNode){dirty.add(node);}
            record.addedNodes.forEach(node=>{
                dirty.add(node);
                node.querySelectorAll?.('*').forEach(child=>dirty.add(child));
            });
        });
        let changed = false;
        if(this.full||dirty.size||ensure&&!content.childNodes.length){
            changed = normalizeParagraphs(content,range,ensure,this.full?null:dirty);
        }
        this.full = false;
        this.observer.takeRecords();
        return changed;
    }
}
