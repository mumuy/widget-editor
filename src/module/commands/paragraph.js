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

export function blockquote(editor){
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
        editor.selection.select(range);
    });
}

export function quoted(editor){
    let range = editor.getRange();
    if(!range){
        return false;
    }
    let node = boundary(range.startContainer,range.startOffset).node;
    let quote = (node.nodeType===Node.ELEMENT_NODE?node:node.parentElement).closest('blockquote');
    return !!quote&&editor.content.contains(quote);
}

function blocks(editor){
    let range = editor.getRange();
    if(!range||range.collapsed){
        let block = editor.selectedElement()?.closest('p,h1,h2,h3,h4,h5,h6,li,td,th');
        return block&&editor.content.contains(block)?[block]:[];
    }
    let selected = editor.selectedBlocks().filter(block=>block.tagName!=='DIV');
    return selected.filter(block=>!selected.some(other=>other!==block&&block.contains(other)));
}

function indented(block){
    return parseFloat(window.getComputedStyle(block).textIndent)>0;
}

export function indentation(editor){
    editor.transaction(()=>{
        let selected = blocks(editor);
        let remove = selected.length>0&&selected.every(indented);
        selected.forEach(block=>{
            if(remove){
                block.style.removeProperty('text-indent');
                // 对继承的缩进使用零值覆盖，只取消当前段落的缩进。
                if(indented(block)){
                    block.style.textIndent = '0px';
                }
                if(!block.style.length){
                    block.removeAttribute('style');
                }
            }else{
                block.style.textIndent = '2em';
            }
        });
    });
}

export function indentedSelection(editor){
    let selected = blocks(editor);
    return selected.length>0&&selected.every(indented);
}

