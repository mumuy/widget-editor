// 原生输入与模块操作共享历史，避免插入图片、表格后无法撤销。
export default class EditorHistory {
    constructor(editor){
        this.editor = editor;
        this.entries = [];
        this.index = -1;
        this.group = null;
    }
    reset(){
        this.cutoff();
        this.entries = [];
        this.index = -1;
        this.record();
    }
    cutoff(){
        this.group = null;
        this.pending = null;
    }
    capture(inputType){
        let key = /^(insertText|deleteContentBackward|deleteContentForward)$/.test(inputType)?inputType:'';
        let selection = JSON.stringify(this.editor.selection.bookmark());
        let value = this.editor.contentHTML();
        this.pending = {key,merge:!!key&&this.group?.key===key&&
            Date.now()-this.group.time<1000&&this.group.selection===selection&&this.index===this.entries.length-1&&this.entries[this.index]?.value===value};
        this.record(value,'capture');
    }
    record(value=this.editor.contentHTML(),inputType=''){
        let pending = this.pending;
        if(inputType!=='capture'){
            this.pending = null;
            if(!inputType){this.cutoff();}
        }
        let entry = {value,selection:this.editor.selection.bookmark()};
        if(this.entries[this.index]?.value===entry.value){
            this.entries[this.index].selection = entry.selection;
            return;
        }
        this.entries.splice(this.index+1);
        if(inputType&&inputType!=='capture'&&pending?.merge){
            this.entries[this.index] = entry;
        }else{
            this.entries.push(entry);
        }
        if(inputType&&inputType!=='capture'){
            this.group = pending?.key?{key:pending.key,time:Date.now(),selection:JSON.stringify(entry.selection)}:null;
        }
        let bytes = this.entries.reduce((size,item)=>size+item.value.length*2,0);
        while(this.entries.length>2&&(this.entries.length>100||bytes>8*1024*1024)){
            bytes -= this.entries[0].value.length*2;
            this.entries.shift();
        }
        this.index = this.entries.length-1;
    }
    move(offset){
        if(this.editor.formControl.disabled||this.editor._composing){return;}
        this.cutoff();
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
