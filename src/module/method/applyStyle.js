const inlineTags = new Set(['SPAN','A','STRONG','B','EM','I','U','SUP','SUB']);

// 将选中文字的祖先拆开，使样式修改只影响当前文字。
function isolate(node,ancestor){
    while(node!==ancestor){
        let parent = node.parentElement;
        while(node.previousSibling?.nodeType===Node.TEXT_NODE&&!node.previousSibling.length){
            node.previousSibling.remove();
        }
        while(node.nextSibling?.nodeType===Node.TEXT_NODE&&!node.nextSibling.length){
            node.nextSibling.remove();
        }
        if(node.previousSibling){
            let before = parent.cloneNode(false);
            while(parent.firstChild!==node){
                before.appendChild(parent.firstChild);
            }
            parent.before(before);
        }
        if(node.nextSibling){
            let after = parent.cloneNode(false);
            while(node.nextSibling){
                after.appendChild(node.nextSibling);
            }
            parent.after(after);
        }
        node = parent;
    }
}

function styleText(node,styles,content){
    let names = Object.keys(styles);
    let spans = [];
    let ancestor = null;
    for(let parent=node.parentElement;parent!==content&&inlineTags.has(parent.tagName);parent=parent.parentElement){
        if(parent.tagName==='SPAN'){
            spans.push(parent);
            if(parent===node.parentElement||names.some(name=>parent.style.getPropertyValue(name))){
                ancestor = parent;
            }
        }
    }
    if(ancestor){
        isolate(node,ancestor);
    }
    // 移除当前范围内旧的同类样式，保留其他样式及语义标签。
    for(let span of spans){
        if(!ancestor||!ancestor.contains(span)){
            continue;
        }
        names.forEach(name=>span.style.removeProperty(name));
        if(!span.style.length){
            span.removeAttribute('style');
        }
        if(!span.attributes.length&&span!==node.parentElement){
            span.replaceWith(...span.childNodes);
        }
    }
    let span = node.parentElement;
    if(span.tagName!=='SPAN'){
        span = document.createElement('span');
        node.replaceWith(span);
        span.appendChild(node);
    }
    names.forEach(name=>span.style.setProperty(name,styles[name]));
}

export default function applyStyle(content,range,styles){
    if(range.collapsed){
        let node = range.startContainer;
        // 连续在同一光标位置选择字体时，复用尚未输入文字的占位节点。
        if(node.nodeType!==Node.TEXT_NODE||node.data!=='\u200b'){
            let element = node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
            let block = element.closest('p,h1,h2,h3,h4,h5,h6,li,td,th');
            let placeholder = block?.querySelector('br');
            node = document.createTextNode('\u200b');
            if(block&&content.contains(block)&&!block.textContent&&placeholder&&block.querySelectorAll('br').length===1&&!block.querySelector('img,video,audio,table')){
                // 用样式节点替换空行占位符，避免输入文字后仍残留一个换行。
                placeholder.replaceWith(node);
            }else{
                range.insertNode(node);
            }
        }
        styleText(node,styles,content);
        range.setStart(node,1);
        range.collapse(true);
    }else{
        let walker = document.createTreeWalker(content,NodeFilter.SHOW_TEXT);
        let nodes = [];
        while(walker.nextNode()){
            let node = walker.currentNode;
            if(range.intersectsNode(node)){
                let start = node===range.startContainer?range.startOffset:0;
                let end = node===range.endContainer?range.endOffset:node.length;
                if(end>start){
                    nodes.push({node,start,end});
                }
            }
        }
        let selected = nodes.map(function(item){
            let node = item.node;
            if(item.end<node.length){
                node.splitText(item.end);
            }
            if(item.start>0){
                node = node.splitText(item.start);
            }
            styleText(node,styles,content);
            return node;
        });
        if(selected.length){
            range.setStart(selected[0],0);
            let last = selected[selected.length-1];
            range.setEnd(last,last.length);
        }
    }
    return range;
}
