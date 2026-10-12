const textBlocks = 'p,h1,h2,h3,h4,h5,h6,li,td,th';
const blockTags = new Set('P DIV H1 H2 H3 H4 H5 H6 LI TD TH TR TABLE THEAD TBODY TFOOT UL OL BLOCKQUOTE VIDEO AUDIO'.split(' '));
const containers = new Set('TABLE THEAD TBODY TFOOT TR UL OL BLOCKQUOTE'.split(' '));
const markerText = 'widget-editor-clear-format';

function intersect(range,scope){
    let result = scope.cloneRange();
    if(range.compareBoundaryPoints(Range.START_TO_START,scope)>0){
        result.setStart(range.startContainer,range.startOffset);
    }
    if(range.compareBoundaryPoints(Range.END_TO_END,scope)<0){
        result.setEnd(range.endContainer,range.endOffset);
    }
    return result;
}

function hasContent(fragment,spaces=false){
    let text = fragment.textContent.replace(/\u200b/g,'');
    return !!(spaces?text.length:text.trim().length)||!!fragment.querySelector('br,img,video,audio');
}

function boundaryBlock(node,offset,end=false){
    if(node.nodeType===Node.ELEMENT_NODE&&node.childNodes[offset-(end?1:0)]){
        node = node.childNodes[offset-(end?1:0)];
        while(node.firstChild){
            node = end?node.lastChild:node.firstChild;
        }
    }
    return (node.nodeType===Node.ELEMENT_NODE?node:node.parentElement)?.closest(textBlocks);
}

// 结构边界分段，br 分行；只提取文字，不将旧标签、属性或样式带入新段落。
function paragraphs(fragment){
    let lines = [];
    let text = '';
    let caret = null;
    let flush = (empty=false)=>{
        if(text||empty){
            lines.push(text);
            text = '';
        }
    };
    let visit = node=>{
        if(node.nodeType===Node.COMMENT_NODE&&node.data===markerText){
            caret = {line:lines.length,offset:text.length};
        }else if(node.nodeType===Node.TEXT_NODE){
            if(!node.data.trim()&&(containers.has(node.parentNode.nodeName)||node.parentNode.nodeName==='LI'&&Array.from(node.parentNode.children).some(child=>blockTags.has(child.nodeName)))){
                return;
            }
            text += node.data.replace(/\u200b/g,'');
        }else if(node.nodeName==='BR'){
            flush(true);
        }else{
            let block = blockTags.has(node.nodeName);
            if(block){
                flush();
            }
            let count = lines.length;
            node.childNodes.forEach(visit);
            if(block){
                flush(node.matches?.(textBlocks)&&lines.length===count);
            }
        }
    };
    fragment.childNodes.forEach(visit);
    flush();
    if(!lines.length||caret?.line===lines.length){
        lines.push('');
    }
    let nodes = lines.map(line=>{
        let paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode(line));
        return paragraph;
    });
    return {nodes,texts:nodes.map(node=>node.firstChild),caret};
}

export default function clearFormat(content,current){
    let range = current.cloneRange();
    let marker;
    if(range.collapsed){
        let node = range.startContainer.nodeType===Node.ELEMENT_NODE?range.startContainer:range.startContainer.parentElement;
        let block = node.closest(textBlocks);
        if(node===content){
            let end = range.startOffset===content.childNodes.length;
            block = boundaryBlock(content,range.startOffset,end)||content.childNodes[range.startOffset-(end?1:0)]||content;
            range.selectNodeContents(block);
            range.collapse(!end);
        }
        if(!block||!content.contains(block)){
            block = node;
            while(block.parentNode!==content&&block!==content){
                block = block.parentNode;
            }
        }
        marker = document.createComment(markerText);
        range.insertNode(marker);
        if(block===content){
            range.selectNodeContents(content);
        }else{
            range.selectNode(block);
        }
    }else{
        let start = boundaryBlock(range.startContainer,range.startOffset);
        let end = boundaryBlock(range.endContainer,range.endOffset,true);
        let scope = document.createRange();
        if(start&&content.contains(start)){
            scope.selectNodeContents(start);
            scope.setEnd(range.startContainer,range.startOffset);
            if(!hasContent(scope.cloneContents(),true)){
                range.setStartBefore(start);
            }else{
                scope.selectNodeContents(start);
                scope.setStart(range.startContainer,range.startOffset);
                if(!hasContent(scope.cloneContents(),true)){
                    range.setStartAfter(start);
                }
            }
        }
        if(end&&content.contains(end)){
            scope.selectNodeContents(end);
            scope.setStart(range.endContainer,range.endOffset);
            if(!hasContent(scope.cloneContents(),true)){
                range.setEndAfter(end);
            }else{
                scope.selectNodeContents(end);
                scope.setEnd(range.endContainer,range.endOffset);
                if(!hasContent(scope.cloneContents(),true)){
                    range.setEndBefore(end);
                }
            }
        }
    }
    let before = document.createRange();
    before.selectNodeContents(content);
    before.setEnd(range.startContainer,range.startOffset);
    let after = document.createRange();
    after.selectNodeContents(content);
    after.setStart(range.endContainer,range.endOffset);
    let plans = Array.from(content.childNodes).filter(node=>range.intersectsNode(node)).map(node=>{
        let scope = document.createRange();
        scope.selectNode(node);
        let selected = intersect(range,scope).cloneContents();
        let plain = paragraphs(selected);
        let complete = range.compareBoundaryPoints(Range.START_TO_START,scope)<=0&&range.compareBoundaryPoints(Range.END_TO_END,scope)>=0;
        if(!hasContent(selected,true)&&!plain.caret&&!complete){
            return null;
        }
        let prefix = intersect(before,scope).cloneContents();
        let suffix = intersect(after,scope).cloneContents();
        [prefix,suffix].forEach(fragment=>{
            Array.from(fragment.querySelectorAll('thead,tbody,tfoot,tr,ul,ol,li,blockquote')).reverse().forEach(element=>{
                if(!element.children.length&&!element.textContent.trim()){
                    element.remove();
                }
            });
        });
        let inline = node.nodeType===Node.ELEMENT_NODE&&node.matches('p,h1,h2,h3,h4,h5,h6');
        if(inline){
            [prefix,suffix].forEach(fragment=>{
                if(fragment.firstChild?.nodeName===node.nodeName){
                    fragment.replaceChildren(...fragment.firstChild.childNodes);
                }
            });
            if(hasContent(prefix,true)){
                plain.nodes[0].prepend(prefix);
            }
            if(hasContent(suffix,true)){
                plain.nodes[plain.nodes.length-1].append(suffix);
            }
        }
        plain.nodes.forEach(paragraph=>{
            if(!paragraph.textContent&&!paragraph.children.length){
                paragraph.appendChild(document.createElement('br'));
            }
        });
        return {node,plain,nodes:[...(!inline&&hasContent(prefix)?prefix.childNodes:[]),...plain.nodes,...(!inline&&hasContent(suffix)?suffix.childNodes:[])]};
    }).filter(Boolean);
    plans.forEach(plan=>plan.node.replaceWith(...plan.nodes));
    marker?.remove();
    let result = document.createRange();
    let caret = plans.find(plan=>plan.plain.caret)?.plain;
    if(caret){
        result.setStart(caret.texts[caret.caret.line],caret.caret.offset);
        result.collapse(true);
    }else if(plans.length){
        let first = plans[0].plain.texts[0];
        let last = plans[plans.length-1].plain.texts.at(-1);
        result.setStart(first,0);
        result.setEnd(last,last.length);
    }else{
        result.selectNodeContents(content);
        result.collapse(false);
    }
    return result;
}
