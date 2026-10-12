import hexColor from './color.js';

// 仅保留工具栏支持的标签及编辑时需要的段落、换行；粘贴、源码及 API 共用此入口。
const allowedTags = new Set('p div span br strong b em i u h1 h2 h3 h4 h5 h6 ul ol li a img table thead tbody tfoot tr th td blockquote'.split(' '));
const blockedTags = new Set('script style iframe object embed svg math form input button textarea select link meta base template'.split(' '));
const styleRules = {
    'color':value=>/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value),
    'background-color':value=>/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(value),
    'font-size':value=>/^(?:[1-9]\d?|1[01]\d|120)(?:px|pt)$/.test(value),
    'font-family':value=>value.length<=256&&value.split(',').every(name=>/^(?:[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*|"[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*"|'[a-z\u3400-\u9fff][a-z\d\u3400-\u9fff _-]*')$/i.test(name.trim())),
    'font-weight':value=>/^(normal|bold|[1-9]00)$/.test(value),
    'font-style':value=>/^(normal|italic|oblique)$/.test(value),
    'text-decoration':value=>/^(none|underline|line-through|underline line-through)$/.test(value),
    'text-align':value=>/^(left|center|right|justify)$/.test(value)
};

export function escapeHTML(value){
    return String(value).replace(/[&<>"']/g,function(character){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
    });
}

export function safeURL(value,image=false){
    value = String(value||'').trim();
    if(!value||/[\u0000-\u0020\u007f]/.test(value)){
        return '';
    }
    if(image&&/^data:image\/(png|jpeg|gif|webp);base64,[a-z\d+/]+=*$/i.test(value)){
        return value;
    }
    try{
        let url = new URL(value,'https://example.invalid/');
        let protocols = image?['http:','https:']:['http:','https:','mailto:','tel:'];
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
            if(tag==='a'){
                let href = safeURL(node.getAttribute('href'));
                if(href){
                    attributes.href = href;
                    attributes.target = '_blank';
                    attributes.rel = 'noopener noreferrer';
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
            if(tag==='td'||tag==='th'){
                ['colspan','rowspan'].forEach(function(name){
                    let value = Number(node.getAttribute(name));
                    if(Number.isInteger(value)&&value>1&&value<=10){
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
    return template.innerHTML;
}
