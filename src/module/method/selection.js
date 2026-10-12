export default class EditorSelection {
    constructor(editor){
        this.editor = editor;
        this.range = null;
    }
    current(){
        let root = this.editor.shadowRoot;
        let selection = root.getSelection?root.getSelection():window.getSelection();
        if(selection&&selection.rangeCount){
            let range = selection.getRangeAt(0);
            if(this.editor.content.contains(range.commonAncestorContainer)){
                return range;
            }
        }
        return null;
    }
    save(){
        let range = this.current();
        if(range){
            this.range = range.cloneRange();
        }
        return this.range;
    }
    restore(){
        let content = this.editor.content;
        // focus 事件会更新选区，恢复前先保留原来的范围。
        let range = this.range?.cloneRange();
        content.focus({preventScroll:true});
        if(!range||!content.contains(range.commonAncestorContainer)){
            range = document.createRange();
            let last = content.lastElementChild;
            range.selectNodeContents(last?.matches('p,h1,h2,h3,h4,h5,h6')?last:content);
            range.collapse(false);
        }
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        this.range = range.cloneRange();
        return range;
    }
    bookmark(){
        let range = this.current()||this.range;
        let root = this.editor.content;
        if(!range||!root.contains(range.commonAncestorContainer)){
            return null;
        }
        let path = function(node){
            let result = [];
            while(node!==root){
                result.unshift(Array.prototype.indexOf.call(node.parentNode.childNodes,node));
                node = node.parentNode;
            }
            return result;
        };
        return {start:path(range.startContainer),startOffset:range.startOffset,end:path(range.endContainer),endOffset:range.endOffset};
    }
    fromBookmark(bookmark){
        this.range = null;
        if(!bookmark){
            return;
        }
        let root = this.editor.content;
        let find = path=>path.reduce((node,index)=>node&&node.childNodes[index],root);
        let start = find(bookmark.start);
        let end = find(bookmark.end);
        if(start&&end){
            let range = document.createRange();
            range.setStart(start,Math.min(bookmark.startOffset,start.nodeType===3?start.length:start.childNodes.length));
            range.setEnd(end,Math.min(bookmark.endOffset,end.nodeType===3?end.length:end.childNodes.length));
            this.range = range;
        }
    }
}
