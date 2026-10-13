// 原生输入与模块操作共享历史，避免插入图片、表格后无法撤销。
export default class EditorHistory {
    constructor(editor){
        this.editor = editor;
        this.entries = [];
        this.index = -1;
    }
    reset(){
        this.entries = [];
        this.index = -1;
        this.record();
    }
    record(){
        let entry = {value:this.editor.contentHTML(),selection:this.editor.selection.bookmark()};
        if(this.entries[this.index]?.value===entry.value){
            this.entries[this.index].selection = entry.selection;
            return;
        }
        this.entries.splice(this.index+1);
        this.entries.push(entry);
        if(this.entries.length>100){
            this.entries.shift();
        }
        this.index = this.entries.length-1;
    }
    move(offset){
        let index = this.index+offset;
        if(index<0||index>=this.entries.length){
            return;
        }
        this.index = index;
        let entry = this.entries[index];
        this.editor.content.innerHTML = entry.value;
        this.editor.normalizeContent(false,null);
        this.editor.codes?.normalize(null);
        this.editor.selection.fromBookmark(entry.selection);
        this.editor.restoreSelection();
        this.editor.update(false);
    }
    get canUndo(){
        return this.index>0;
    }
    get canRedo(){
        return this.index<this.entries.length-1;
    }
}
