const blockTags = new Set('P DIV H1 H2 H3 H4 H5 H6 UL OL LI VIDEO AUDIO IFRAME TABLE THEAD TBODY TFOOT TR TH TD BLOCKQUOTE HR PRE'.split(' '));
const paragraphTags = new Set('P H1 H2 H3 H4 H5 H6'.split(' '));
const structuralTags = new Set('P DIV H1 H2 H3 H4 H5 H6 UL OL TABLE VIDEO AUDIO IFRAME BLOCKQUOTE HR PRE'.split(' '));

function boundary(node,offset){
    return {node,offset,left:node.childNodes[offset-1],right:node.childNodes[offset]};
}

export default function normalizeParagraphs(content,range=null,ensure=false){
    let start = range&&boundary(range.startContainer,range.startOffset);
    let end = range&&boundary(range.endContainer,range.endOffset);
    let collapsed = range?.collapsed;
    let changed = false;
    let replaced = new Map();
    let unwrapped = new Map();
    let inherit = function(parent,child){
        Array.from(parent.style).forEach(name=>{
            if(!child.style.getPropertyValue(name)){
                child.style.setProperty(name,parent.style.getPropertyValue(name));
            }
        });
    };
    let wrap = function(parent){
        let nodes = [];
        let hasBlocks = Array.from(parent.children).some(node=>blockTags.has(node.tagName));
        let flush = function(){
            if(!nodes.length){
                return;
            }
            changed = true;
            if(hasBlocks&&nodes.every(node=>node.nodeType===Node.TEXT_NODE&&!node.textContent.trim())){
                nodes.forEach(node=>node.remove());
            }else{
                let paragraph = document.createElement('p');
                nodes[0].before(paragraph);
                nodes.forEach(node=>paragraph.appendChild(node));
            }
            nodes = [];
        };
        Array.from(parent.childNodes).forEach(node=>{
            if(node.nodeType===Node.ELEMENT_NODE&&blockTags.has(node.tagName)){
                flush();
            }else{
                nodes.push(node);
            }
        });
        flush();
    };
    // 原生命令在空段落中插入列表或表格时可能留下非法的段落嵌套。
    let split = function(node){
        let nodes = [];
        let blocks = [];
        let flush = function(){
            if(nodes.some(child=>child.nodeType!==Node.TEXT_NODE?child.nodeName!=='BR':!!child.textContent.trim())){
                let paragraph = node.cloneNode(false);
                paragraph.append(...nodes);
                blocks.push(paragraph);
            }
            nodes = [];
        };
        Array.from(node.childNodes).forEach(child=>{
            if(structuralTags.has(child.nodeName)){
                flush();
                inherit(node,child);
                blocks.push(child);
            }else{
                nodes.push(child);
            }
        });
        flush();
        unwrapped.set(node,{first:blocks[0],last:blocks[blocks.length-1]});
        node.replaceWith(...blocks);
        changed = true;
    };
    let clean = function(parent){
        Array.from(parent.children).forEach(node=>{
            if(node.tagName==='PRE'){
                return;
            }
            clean(node);
            if(node.tagName==='DIV'){
                if(Array.from(node.children).some(child=>blockTags.has(child.tagName))){
                    wrap(node);
                    // 外层容器的样式下放到各个段落，避免转换后丢失对齐等格式。
                    Array.from(node.children).forEach(child=>inherit(node,child));
                    unwrapped.set(node,{first:node.firstChild,last:node.lastChild});
                    node.replaceWith(...node.childNodes);
                }else{
                    let paragraph = document.createElement('p');
                    Array.from(node.attributes).forEach(attribute=>paragraph.setAttribute(attribute.name,attribute.value));
                    paragraph.append(...node.childNodes);
                    replaced.set(node,paragraph);
                    node.replaceWith(paragraph);
                }
                changed = true;
            }else if(paragraphTags.has(node.tagName)&&Array.from(node.children).some(child=>structuralTags.has(child.tagName))){
                split(node);
            }
        });
        if(parent===content||parent.tagName==='BLOCKQUOTE'){
            wrap(parent);
        }
    };
    clean(content);
    if(ensure&&!content.childNodes.length){
        content.innerHTML = '<p><br></p>';
        changed = true;
    }
    if(range&&changed){
        let resolve = function(point){
            let node = replaced.get(point.node)||point.node;
            let right = replaced.get(point.right)||unwrapped.get(point.right)?.first||point.right;
            let left = replaced.get(point.left)||unwrapped.get(point.left)?.last||point.left;
            if(right&&content.contains(right)){
                return [right.parentNode,Array.prototype.indexOf.call(right.parentNode.childNodes,right)];
            }
            if(left&&content.contains(left)){
                return [left.parentNode,Array.prototype.indexOf.call(left.parentNode.childNodes,left)+1];
            }
            if(content.contains(node)){
                if(ensure&&node===content&&collapsed&&content.firstChild?.nodeName==='P'){
                    return [content.firstChild,0];
                }
                return [node,Math.min(point.offset,node.nodeType===Node.TEXT_NODE?node.length:node.childNodes.length)];
            }
            return [content,content.childNodes.length];
        };
        let first = resolve(start);
        let last = resolve(end);
        range.setStart(...first);
        range.setEnd(...last);
    }
    return changed;
}
