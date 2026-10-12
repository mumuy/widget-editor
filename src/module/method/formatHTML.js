import sanitizeHTML from './sanitize.js';

const blockTags = new Set('p div h1 h2 h3 h4 h5 h6 ul ol li table thead tbody tfoot tr th td blockquote pre hr'.split(' '));
const containerTags = new Set('div blockquote ul ol li table thead tbody tfoot tr th td'.split(' '));

export default function formatHTML(html){
    let template = document.createElement('template');
    template.innerHTML = sanitizeHTML(html);
    let blockOnly = function(parent){
        return parent.children.length>0 && Array.from(parent.childNodes).every(function(node){
            return node.nodeType===Node.ELEMENT_NODE ? blockTags.has(node.localName) :
                node.nodeType===Node.TEXT_NODE && /^[ \t\r\n\f]*$/.test(node.textContent);
        });
    };
    let serialize = function(node,level){
        let indent = '    '.repeat(level);
        // 行内内容及 pre / code 不插入换行，保留文字之间原有的空白。
        if(!containerTags.has(node.localName) || !blockOnly(node)){
            return indent+node.outerHTML;
        }
        let closing = '</'+node.localName+'>';
        let opening = node.cloneNode(false).outerHTML.slice(0,-closing.length);
        let children = Array.from(node.children).map(function(child){
            return serialize(child,level+1);
        });
        return indent+opening+'\n'+children.join('\n')+'\n'+indent+closing;
    };
    if(!blockOnly(template.content)){
        return template.innerHTML;
    }
    return Array.from(template.content.children).map(function(node){
        return serialize(node,0);
    }).join('\n');
}
