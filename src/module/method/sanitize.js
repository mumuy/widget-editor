import hexColor from './color.js';
import {safeDataURL,fileName} from './file.js';
import {colors,codeColor,normalizeCode} from '../code/content.js';
import {languageName} from '../code/language.js';

// 仅保留工具栏支持的标签及编辑时需要的段落、换行；粘贴、源码及 API 共用此入口。
const allowedTags = new Set('p div span br strong b em i u s strike sup sub h1 h2 h3 h4 h5 h6 ul ol li a img video audio table thead tbody tfoot tr th td blockquote hr pre code'.split(' '));
const blockedTags = new Set('script style iframe object embed svg math form input button textarea select link meta base template'.split(' '));
const styleRules = {
    'color':value=>/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value),
    'background-color':value=>/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value),
    'font-size':value=>/^(?:[1-9]\d?|1[01]\d|120)(?:px|pt)$/.test(value),
    'font-family':value=>value.length<=256&&value.split(',').every(name=>/^(?:[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*|"[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*"|'[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*')$/i.test(name.trim())),
    'font-weight':value=>/^(normal|bold|[1-9]00)$/.test(value),
    'font-style':value=>/^(normal|italic|oblique)$/.test(value),
    'text-decoration':value=>/^(none|underline|line-through|underline line-through|line-through underline)$/.test(value),
    'text-align':value=>/^(left|center|right|justify)$/.test(value),
    'text-indent':value=>['0px','2em'].includes(value)
};

export function escapeHTML(value){
    return String(value).replace(/[&<>"']/g,function(character){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
    });
}

export function safeURL(value,kind=false){
    value = String(value||'').trim();
    if(!value||/[\u0000-\u0020\u007f]/.test(value)){
        return '';
    }
    if(kind&&safeDataURL(value,kind===true?'image':kind)){
        return value;
    }
    try{
        let url = new URL(value,'https://example.invalid/');
        let protocols = kind?['http:','https:']:['http:','https:','mailto:','tel:'];
        return protocols.includes(url.protocol)?value:'';
    }catch(error){
        return '';
    }
}

export default function sanitizeHTML(html){
    let template = document.createElement('template');
    template.innerHTML = String(html||'');
    let clean = function(parent){
        Array.from(parent.childNodes).forEach(function(node){
            if(node.nodeType===Node.COMMENT_NODE){
                node.remove();
                return;
            }
            if(node.nodeType!==Node.ELEMENT_NODE){
                return;
            }
            let tag = node.localName;
            if(tag==='del'){
                // del 作为删除线导入，统一成可以取消格式的 s 标签。
                let element = document.createElement('s');
                if(node.hasAttribute('style')){
                    element.setAttribute('style',node.getAttribute('style'));
                }
                element.append(...node.childNodes);
                node.replaceWith(element);
                node = element;
                tag = 's';
            }
            if(blockedTags.has(tag)){
                node.remove();
                return;
            }
            clean(node);
            if(!allowedTags.has(tag)){
                // 不支持的标签去掉外层，保留已经清理过的文字及支持的子节点。
                node.replaceWith(...node.childNodes);
                return;
            }
            let styles = {};
            if(tag==='code'){
                Object.keys(colors).forEach(name=>{
                    let value = node.style.getPropertyValue('--code-'+name).trim();
                    if(codeColor(value)){styles['--code-'+name] = value;}
                });
            }
            Object.keys(styleRules).forEach(function(name){
                let value = node.style.getPropertyValue(name).trim();
                if(name==='text-decoration'){
                    value = node.style.textDecorationLine||value;
                }
                if(value&&styleRules[name](value)){
                    styles[name] = name==='color'||name==='background-color'?hexColor(value):value;
                }
            });
            let attributes = {};
            if(tag==='code'){
                attributes['data-language'] = languageName(node.getAttribute('data-language')||node.className.match(/(?:^|\s)language-([\w+#-]+)(?=\s|$)/)?.[1]);
            }
            if(tag==='a'){
                let download = node.hasAttribute('download');
                let href = safeURL(node.getAttribute('href'),download?'attachment':false);
                if(href){
                    attributes.href = href;
                    if(download){
                        attributes.download = fileName(node.getAttribute('download'));
                    }else{
                        attributes.target = '_blank';
                        attributes.rel = 'noopener noreferrer';
                    }
                }
            }
            if(tag==='img'){
                let src = safeURL(node.getAttribute('src'),true);
                if(!src){
                    node.remove();
                    return;
                }
                attributes.src = src;
                attributes.alt = node.getAttribute('alt')||'';
                ['width','height'].forEach(function(name){
                    let value = Number(node.getAttribute(name));
                    if(Number.isInteger(value)&&value>0&&value<=4096){
                        attributes[name] = value;
                    }
                });
            }
            if(tag==='video'||tag==='audio'){
                let src = safeURL(node.getAttribute('src'),tag);
                if(!src){
                    node.remove();
                    return;
                }
                attributes.src = src;
                attributes.controls = '';
                attributes.preload = 'metadata';
                if(tag==='video'){
                    attributes.playsinline = '';
                }
                if(node.getAttribute('title')){
                    attributes.title = node.getAttribute('title');
                }
            }
            if(tag==='td'||tag==='th'){
                ['colspan','rowspan'].forEach(function(name){
                    let value = Number(node.getAttribute(name));
                    if(Number.isInteger(value)&&value>1&&value<=(name==='colspan'?1000:65534)){
                        attributes[name] = value;
                    }
                });
                if(tag==='th'){
                    attributes.scope = 'col';
                }
            }
            Array.from(node.attributes).forEach(attribute=>node.removeAttribute(attribute.name));
            Object.keys(attributes).forEach(name=>node.setAttribute(name,attributes[name]));
            if(Object.keys(styles).length){
                // 直接写入已清理的属性，避免 CSSOM 再将 HEX 改写成 RGB。
                node.setAttribute('style',Object.keys(styles).map(name=>name+': '+styles[name]+';').join(' '));
            }
        });
    };
    clean(template.content);
    normalizeCode(template.content);
    return template.innerHTML;
}
