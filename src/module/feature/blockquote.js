import {blockquote as icon} from '../icon.js';

function boundary(node,offset,end=false){
    if(node.nodeType===Node.ELEMENT_NODE){
        let child = node.childNodes[end?offset-1:offset];
        if(child){
            node = child;
            while(node.nodeType===Node.ELEMENT_NODE&&node.childNodes.length){
                node = end?node.lastChild:node.firstChild;
            }
            offset = end?(node.nodeType===Node.TEXT_NODE?node.length:node.childNodes.length):0;
        }
    }
    return {node,offset};
}

export default {
    'name':'blockquote',
    'icon':icon,
    'label':'块引用',
    'type':'button',
    execute(editor){
        editor.transaction(()=>{
            let range = editor.getRange();
            let first = boundary(range.startContainer,range.startOffset);
            let last = boundary(range.endContainer,range.endOffset,true);
            let start = first.node;
            let end = last.node;
            let quote = (start.nodeType===Node.ELEMENT_NODE?start:start.parentElement).closest('blockquote');
            if(quote&&editor.content.contains(quote)&&quote.contains(end)){
                quote.replaceWith(...quote.childNodes);
            }else{
                let container = range.commonAncestorContainer;
                if(container.nodeType!==Node.ELEMENT_NODE){
                    container = container.parentElement;
                }
                let block = container.closest('p,h1,h2,h3,h4,h5,h6,li,td,th');
                if(block&&editor.content.contains(block)){
                    container = block.matches('li,td,th')?block:block.parentElement;
                }
                let blocks = Array.from(container.childNodes).filter(node=>range.intersectsNode(node)&&
                    !editor.blocks.boundary(node)&&(node.nodeType!==Node.TEXT_NODE||node.textContent.trim()));
                quote = document.createElement('blockquote');
                if(blocks.length&&blocks.every(node=>node.nodeName==='BLOCKQUOTE')){
                    blocks.forEach(node=>node.replaceWith(...node.childNodes));
                }else if(blocks.length){
                    blocks[0].before(quote);
                    blocks.forEach(node=>{
                        if(node.nodeName==='BLOCKQUOTE'){
                            quote.append(...node.childNodes);
                            node.remove();
                        }else{
                            quote.appendChild(node);
                        }
                    });
                }else{
                    quote.innerHTML = '<p><br></p>';
                    container.appendChild(quote);
                }
            }
            // 移动节点后恢复选区，便于继续输入以及撤销、重做。
            if(start!==editor.content&&end!==editor.content&&start.isConnected&&end.isConnected){
                range.setStart(start,first.offset);
                range.setEnd(end,last.offset);
            }else{
                range.selectNodeContents(quote.isConnected?quote:editor.content);
                range.collapse(false);
            }
            let selection = editor.content.getRootNode().getSelection?.()||window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    },
    active(editor){
        let range = editor.getRange();
        if(!range){
            return false;
        }
        let node = boundary(range.startContainer,range.startOffset).node;
        let quote = (node.nodeType===Node.ELEMENT_NODE?node:node.parentElement).closest('blockquote');
        return !!quote&&editor.content.contains(quote);
    }
};
