const paragraphTags = 'p,h1,h2,h3,h4,h5,h6';
const blockTags = 'pre,table,hr,video,audio,iframe';
const containerTags = 'blockquote,ul,ol';
const mediaTags = 'img,video,audio,iframe';

export default class EditorBlocks {
    constructor(editor){
        this.editor = editor;
    }
    empty(node){
        return !node.textContent&&!node.querySelector(mediaTags+',table,hr,pre')&&node.querySelectorAll('br').length<=1;
    }
    block(node){
        return node?.matches?.(blockTags)||node?.matches?.(paragraphTags)&&
            !node.textContent.trim()&&!!node.querySelector(mediaTags)&&!node.querySelector('table,pre,hr');
    }
    boundary(node){
        let previous = node?.previousElementSibling;
        return node?.hasAttribute?.('data-block-boundary')&&this.empty(node)&&
            (this.block(previous)||previous?.matches(containerTags))&&
            (!node.nextElementSibling||this.block(node.nextElementSibling));
    }
    sibling(node,backward=false){
        do{
            node = backward?node.previousElementSibling:node.nextElementSibling;
        }while(this.boundary(node));
        return node;
    }
    normalize(){
        let content = this.editor.content;
        let range = this.editor.getRange();
        content.querySelectorAll('[data-block-boundary]').forEach(node=>{
            if(!this.boundary(node)&&this.empty(node)&&!node.contains(range?.commonAncestorContainer)){
                node.remove();
            }
        });
        content.querySelectorAll('[data-block-boundary]').forEach(node=>{
            if(!this.boundary(node)){node.removeAttribute('data-block-boundary');}
        });
        content.querySelectorAll(blockTags+','+containerTags+','+paragraphTags).forEach(node=>{
            let parent = node.parentElement;
            if(parent!==content&&!parent?.matches('blockquote,li,td,th')){return;}
            let next = node.nextElementSibling;
            if((this.block(node)&&(!next||this.block(next)))||node.matches(containerTags)&&!next){
                node.after(this.paragraph(true));
            }
        });
    }
    paragraph(boundary=false){
        let paragraph = document.createElement('p');
        if(boundary){paragraph.setAttribute('data-block-boundary','');}
        paragraph.appendChild(document.createElement('br'));
        return paragraph;
    }
    select(range){
        this.editor.selection.select(range);
    }
    range(){
        let editor = this.editor;
        let range = editor.selection.current();
        let saved = editor.selection.range;
        return range||(editor.shadowRoot.activeElement===editor.content&&editor.content.contains(saved?.commonAncestorContainer)?saved:null);
    }
    focus(node,end=false){
        let range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(!end);
        this.select(range);
    }
    dismiss(){
        this.editor.table?.clear();
        this.editor.links?.dismiss();
        this.editor.images?.dismiss();
        this.editor.codes?.dismiss();
    }
    exit(block){
        let paragraph = block.nextElementSibling;
        this.editor.transaction(()=>{
            if(!paragraph?.matches(paragraphTags)){
                paragraph = this.paragraph();
                block.after(paragraph);
            }
            this.focus(paragraph);
            this.dismiss();
        });
    }
    remove(block,paragraph,end=false){
        let editor = this.editor;
        let range = editor.getRange()?.cloneRange();
        editor.transaction(()=>{
            if(!paragraph){
                paragraph = this.sibling(block);
                if(!paragraph?.matches(paragraphTags)){
                    paragraph = this.paragraph();
                    block.after(paragraph);
                }
            }
            block.remove();
            if(range&&paragraph.contains(range.commonAncestorContainer)){
                this.select(range);
            }else{
                this.focus(paragraph,end);
            }
            this.dismiss();
        });
    }
    join(left,right){
        let editor = this.editor;
        editor.transaction(()=>{
            let range = document.createRange();
            if(right.matches('p')){
                if(this.empty(left)){left.replaceChildren();}
                let offset = left.childNodes.length;
                if(!this.empty(right)){left.append(...right.childNodes);}
                if(!left.childNodes.length){left.appendChild(document.createElement('br'));}
                right.remove();
                range.setStart(left,offset);
                left.normalize();
            }else{
                range.setStartBefore(right);
                left.remove();
            }
            range.collapse(true);
            this.select(range);
            this.dismiss();
        });
    }
    unwrap(paragraph){
        let editor = this.editor;
        let quote = paragraph.parentElement;
        let range = editor.getRange().cloneRange();
        let node = range.startContainer;
        let offset = range.startOffset;
        editor.transaction(()=>{
            let tail = quote.cloneNode(false);
            while(paragraph.nextSibling){
                tail.appendChild(paragraph.nextSibling);
            }
            quote.after(paragraph);
            if(tail.children.length){paragraph.after(tail);}
            if(!quote.children.length){quote.remove();}
            range.setStart(node,offset);
            range.collapse(true);
            this.select(range);
        });
    }
    edge(node,range,end=false){
        if(!node.contains(range.startContainer)){return false;}
        let part = document.createRange();
        part.selectNodeContents(node);
        if(end){
            part.setStart(range.startContainer,range.startOffset);
        }else{
            part.setEnd(range.startContainer,range.startOffset);
        }
        let content = part.cloneContents();
        return !content.textContent&&!content.querySelector(mediaTags+',table,hr,pre');
    }
    covers(node,range){
        // 在表格或代码块内部选中文字时保留结构；跨越整个块才删除块本身。
        if(node.contains(range.startContainer)&&node.contains(range.endContainer)){return false;}
        let start = range.cloneRange();
        start.collapse(true);
        let end = range.cloneRange();
        end.collapse(false);
        return (range.comparePoint(node,0)===0||this.edge(node,start))&&
            (range.comparePoint(node,node.childNodes.length)===0||this.edge(node,end,true));
    }
    beforeInput(event){
        let editor = this.editor;
        let range = this.range();
        if(event.isComposing||!range||editor.source){return false;}
        let node = range.startContainer;
        let element = node.nodeType===Node.TEXT_NODE?node.parentElement:node;
        let paragraph = element.closest(paragraphTags);
        let quote = paragraph?.parentElement;
        if(range.collapsed&&event.inputType==='deleteContentBackward'){
            let block = element.closest(blockTags+','+containerTags);
            if(block&&this.edge(block,range)){
                let previous = this.sibling(block,true);
                if(previous?.matches('p')&&!this.boundary(previous)){
                    event.preventDefault();
                    this.join(previous,block);
                    return true;
                }
            }
        }
        if(range.collapsed&&quote?.matches('blockquote')&&
            (event.inputType==='insertParagraph'&&this.empty(paragraph)||
                event.inputType==='deleteContentBackward'&&(this.empty(paragraph)||this.edge(quote,range))||
                event.inputType==='deleteContentForward'&&this.empty(paragraph))){
            event.preventDefault();
            this.unwrap(paragraph);
            return true;
        }
        if(['insertParagraph','insertLineBreak'].includes(event.inputType)){
            element.closest('[data-block-boundary]')?.removeAttribute('data-block-boundary');
        }
        if(!event.inputType?.startsWith('delete')){return false;}
        if(!range.collapsed){
            let blocks = Array.from(editor.content.querySelectorAll(blockTags+','+containerTags)).filter(node=>this.covers(node,range));
            if(!blocks.length){return false;}
            event.preventDefault();
            editor.transaction(()=>{
                range.deleteContents();
                blocks.forEach(node=>node.remove());
                editor.normalizeContent(true,range);
                this.select(range);
                this.dismiss();
            });
            return true;
        }
        let backward = event.inputType==='deleteContentBackward';
        if(!backward&&event.inputType!=='deleteContentForward'){return false;}
        let block;
        if(paragraph&&this.edge(paragraph,range,!backward)){
            block = this.sibling(paragraph,backward);
        }else if(node.nodeType===Node.ELEMENT_NODE){
            block = node.childNodes[range.startOffset-(backward?1:0)];
        }
        // 自动补出的光标停留点不属于内容，跨段删除时跳过它。
        if(this.boundary(block)){block = this.sibling(block,backward);}
        if(!block?.matches){return false;}
        let left = backward?block:paragraph;
        let right = backward?paragraph:block;
        if(!paragraph||this.boundary(paragraph)){
            left = backward?block:this.sibling(block,true);
            right = backward?this.sibling(block):block;
        }
        // 相邻 p 删除换行后合并，其他块保留自身并删除前面的 p。
        if(left?.matches('p')&&!this.boundary(left)&&right?.matches(paragraphTags+','+blockTags+','+containerTags)&&
            left.parentNode===right.parentNode){
            event.preventDefault();
            this.join(left,right);
            return true;
        }
        if(!this.block(block)&&!(backward&&block?.matches?.('blockquote')&&this.empty(block))){return false;}
        let end = false;
        if(!paragraph||this.boundary(paragraph)){
            let sibling = this.sibling(block,!backward);
            if(sibling?.matches(paragraphTags)){
                paragraph = sibling;
                end = !backward;
            }
        }
        // 同一段落中的多张图片仍是独立内容，边界删除只移除最近的媒体。
        let media = block.matches(paragraphTags)?block.querySelectorAll(mediaTags):[];
        if(media.length>1){
            paragraph = block;
            block = media[backward?media.length-1:0];
            end = backward;
        }
        event.preventDefault();
        this.remove(block,paragraph,end);
        return true;
    }
    keyDown(event){
        let editor = this.editor;
        if(event.defaultPrevented||event.isComposing||event.target!==editor.content){return;}
        let last = editor.content.lastElementChild;
        if(event.key==='End'&&(event.ctrlKey||event.metaKey)&&!event.shiftKey&&this.boundary(last)){
            event.preventDefault();
            this.focus(last);
            last.scrollIntoView({block:'nearest'});
            editor.updateToolbar();
            return;
        }
        let range = this.range();
        if(!range||editor.codes?.selected()){return;}
        // 原生媒体控件可能在边界阻止 beforeinput，键盘删除共用同一套处理。
        if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&['Backspace','Delete'].includes(event.key)&&this.beforeInput({
            inputType:event.key==='Backspace'?'deleteContentBackward':'deleteContentForward',
            preventDefault:()=>event.preventDefault()
        })){return;}
        if(!range.collapsed){return;}
        let node = range.startContainer;
        let element = node.nodeType===Node.TEXT_NODE?node.parentElement:node;
        let block = element.closest('table,'+containerTags);
        if(!block||!editor.content.contains(block)){return;}
        last = block.tagName==='TABLE'?Array.from(block.querySelectorAll('td,th')).filter(cell=>cell.closest('table')===block).at(-1):block;
        let enter = event.key==='Enter'&&(event.ctrlKey||event.metaKey);
        let arrow = !event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&
            ['ArrowRight','ArrowDown'].includes(event.key)&&last&&this.edge(last,range,true);
        if(enter||arrow){
            event.preventDefault();
            this.exit(block);
        }
    }
}
