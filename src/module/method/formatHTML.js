import sanitizeHTML,{escapeHTML} from './sanitize.js';
import normalizeParagraphs from './normalizeParagraphs.js';
import normalizeEmptyLines from './normalizeEmptyLines.js';
import normalizeTableCells from './normalizeTableCells.js';

const blockTags = new Set('p div br h1 h2 h3 h4 h5 h6 ul ol li video audio iframe table thead tbody tfoot tr th td blockquote hr pre'.split(' '));
const containerTags = new Set('div blockquote ul ol li table thead tbody tfoot tr th td'.split(' '));

export default function formatHTML(html){
    let template = document.createElement('template');
    template.innerHTML = sanitizeHTML(html);
    normalizeParagraphs(template.content);
    // 空行直接输出 br；编辑时的段落占位不写入 HTML。
    normalizeEmptyLines(template.content);
    normalizeTableCells(template.content);
    let blockOnly = function(parent){
        return parent.children.length>0 && Array.from(parent.childNodes).every(function(node){
            return node.nodeType===Node.ELEMENT_NODE ? blockTags.has(node.localName) :
                node.nodeType===Node.TEXT_NODE && /^[ \t\r\n\f]*$/.test(node.textContent);
        });
    };
    let serialize = function(node,level){
        let indent = '    '.repeat(level);
        // 行内内容不插入换行，保留文字之间原有的空白。
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
    if(!Array.from(template.content.children).some(node=>blockTags.has(node.localName))){
        return template.innerHTML;
    }
    let lines = [];
    let inline = '';
    let flush = function(){
        if(inline&&!/^[ \t\r\n\f]*$/.test(inline)){
            lines.push(inline);
        }
        inline = '';
    };
    Array.from(template.content.childNodes).forEach(function(node){
        if(node.nodeType===Node.ELEMENT_NODE&&blockTags.has(node.localName)){
            flush();
            lines.push(serialize(node,0));
        }else{
            inline += node.nodeType===Node.ELEMENT_NODE?node.outerHTML:escapeHTML(node.textContent);
        }
    });
    flush();
    return lines.join('\n');
}

// 保留当前文档各顶层块的结果，未改变的段落和代码块不重复清理、着色。
export function createFormatter(){
    let previous = new Map();
    return function(html){
        let template = document.createElement('template');
        template.innerHTML = html;
        let nodes = Array.from(template.content.childNodes);
        if(nodes.some(node=>node.nodeType===Node.ELEMENT_NODE?!blockTags.has(node.localName):
            node.nodeType!==Node.TEXT_NODE||!!node.textContent.trim())){
            previous.clear();
            return formatHTML(html);
        }
        let next = new Map();
        let values = nodes.filter(node=>node.nodeType===Node.ELEMENT_NODE).map(node=>{
            let source = node.outerHTML;
            let value = previous.get(source)??next.get(source)??formatHTML(source);
            next.set(source,value);
            return value;
        });
        previous = next;
        return values.filter(Boolean).join('\n');
    };
}
