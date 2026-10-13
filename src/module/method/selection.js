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
    children(node){
        return Array.from(node.childNodes).filter(child=>!this.editor.blocks.boundary(child));
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
    ensureVisible(){
        let editor = this.editor;
        let range = this.current();
        if(!range?.collapsed||editor.shadowRoot.activeElement!==editor.content){return;}
        let rect = range.getBoundingClientRect();
        if(!rect.height){
            let node = range.startContainer;
            rect = (node.nodeType===Node.TEXT_NODE?node.parentElement:node).getBoundingClientRect();
        }
        let body = editor.body.getBoundingClientRect();
        let top = Math.max(0,body.top)+4;
        let bottom = Math.min(document.documentElement.clientHeight,body.bottom)-4;
        if(!rect.height||rect.height>bottom-top){return;}
        let offset = rect.top<top?rect.top-top:rect.bottom>bottom?rect.bottom-bottom:0;
        if(offset){editor.body.scrollBy({top:offset,behavior:'instant'});}
    }
    bookmark(){
        let range = this.current()||this.range;
        let root = this.editor.content;
        if(!range||!root.contains(range.commonAncestorContainer)){
            return null;
        }
        let path = node=>{
            let result = [];
            while(node!==root){
                result.unshift(this.children(node.parentNode).indexOf(node));
                node = node.parentNode;
            }
            return result;
        };
        let point = (node,offset)=>{
            let element = node.nodeType===Node.TEXT_NODE?node.parentElement:node;
            let boundary = element.closest?.('[data-block-boundary]');
            if(this.editor.blocks.boundary(boundary)){
                return {path:path(boundary.previousElementSibling),offset:0,boundary:true};
            }
            if(node.nodeType!==Node.TEXT_NODE){
                offset = Array.from(node.childNodes).slice(0,offset).filter(child=>!this.editor.blocks.boundary(child)).length;
            }
            return {path:path(node),offset};
        };
        let start = point(range.startContainer,range.startOffset);
        let end = point(range.endContainer,range.endOffset);
        return {start:start.path,startOffset:start.offset,startBoundary:start.boundary,end:end.path,endOffset:end.offset,endBoundary:end.boundary};
    }
    fromBookmark(bookmark){
        this.range = null;
        if(!bookmark){
            return;
        }
        let root = this.editor.content;
        let find = path=>path.reduce((node,index)=>node&&this.children(node)[index],root);
        let point = (path,offset,boundary)=>{
            let node = find(path);
            if(boundary){node = node?.nextElementSibling;}
            if(!node){return null;}
            if(node.nodeType===Node.TEXT_NODE){
                offset = Math.min(offset,node.length);
            }else{
                let child = this.children(node)[offset];
                offset = child?Array.prototype.indexOf.call(node.childNodes,child):node.childNodes.length;
            }
            return [node,offset];
        };
        let start = point(bookmark.start,bookmark.startOffset,bookmark.startBoundary);
        let end = point(bookmark.end,bookmark.endOffset,bookmark.endBoundary);
        if(start&&end){
            let range = document.createRange();
            range.setStart(...start);
            range.setEnd(...end);
            this.range = range;
        }
    }
}
