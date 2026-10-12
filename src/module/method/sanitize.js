// 仅保留编辑器支持的标签、属性和样式；粘贴、源码及 API 共用此入口。
const allowedTags = new Set('p div span br strong b em i u s strike sub sup h1 h2 h3 h4 h5 h6 ul ol li a img table thead tbody tfoot tr th td blockquote pre code hr'.split(' '));
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
            if(tag==='font'){
                let span = document.createElement('span');
                span.style.color = node.getAttribute('color')||'';
                span.style.fontFamily = node.getAttribute('face')||'';
                span.append(...node.childNodes);
                node.replaceWith(span);
                node = span;
                tag = 'span';
            }
            if(!allowedTags.has(tag)){
                node.replaceWith(...node.childNodes);
                return;
            }
            let styles = {};
            Object.keys(styleRules).forEach(function(name){
                let value = node.style.getPropertyValue(name).trim();
                if(value&&styleRules[name](value)){
                    styles[name] = value;
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
            Object.keys(styles).forEach(name=>node.style.setProperty(name,styles[name]));
        });
    };
    clean(template.content);
    return template.innerHTML;
}
