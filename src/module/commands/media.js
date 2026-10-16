import sanitizeHTML,{safeURL,escapeHTML} from '../method/sanitize.js';
import {fileName,urlFileName} from '../method/file.js';
import nativeCommand from './native.js';

const names = {image:'图片',video:'视频',audio:'音频',attachment:'附件'};

export function frameHTML(value){
    let template = document.createElement('template');
    template.innerHTML = value;
    let frames = template.content.querySelectorAll('iframe');
    return frames.length===1?sanitizeHTML(frames[0].outerHTML):'';
}

export function insertFrame(editor,value){
    let html = frameHTML(value);
    if(!html||!editor.config.methods('video').includes('iframe')){return false;}
    editor.insertHTML(html);
}

function mediaHTML(type,source,values){
    let url = escapeHTML(source);
    if(type==='image'){
        let html = '<img src="'+url+'" alt="'+escapeHTML(String(values.alt||''))+'">';
        return values.multiple?'<p>'+html+'</p>':html;
    }
    if(type==='attachment'){
        return '<a href="'+url+'" download="'+escapeHTML(fileName(values.name))+'">'+escapeHTML(String(values.text||'').trim()||values.name)+'</a>';
    }
    return '<'+type+' src="'+url+'" title="'+escapeHTML(String(values.title||'').trim()||values.name)+'" controls preload="metadata"'+(type==='video'?' playsinline':'')+'></'+type+'><p><br></p>';
}

export function insertMedia(editor,{type,sources=[],files=[],values={}}={}){
    if(!Object.hasOwn(names,type)||!editor.config.methods(type).length||!Array.isArray(sources)||!sources.length||
        sources.length>editor.config.get(type+'-limit')){return false;}
    sources = sources.map(source=>safeURL(source,type));
    if(sources.some(source=>!source)){return false;}
    let multiple = sources.length>1;
    let html = sources.map((source,index)=>mediaHTML(type,source,{
        ...values,name:files[index]?.name||urlFileName(source,editor.t(names[type])),multiple
    })).join('');
    if(type!=='image'||!multiple){editor.insertHTML(html);return;}
    editor.transaction(()=>{
        nativeCommand('insertHTML',sanitizeHTML(html));
        // 图片各占一段，插入点后原有的文字进入下一段。
        nativeCommand('insertParagraph');
        let paragraph = editor.selectedElement().closest('p');
        if(paragraph&&editor.blocks.empty(paragraph)){paragraph.setAttribute('data-block-boundary','');}
    });
}

export function imageAlignment(image){
    return image.style.display!=='block'?0:image.style.marginLeft!=='auto'?1:image.style.marginRight==='auto'?2:3;
}

export function updateImage(editor,values={}){
    let image = values.image||editor.selectedElement()?.closest('img');
    if(!image?.matches?.('img')||!editor.content.contains(image)){return false;}
    let url = safeURL(values.url??image.getAttribute('src'),'image');
    let width = values.width===undefined?image.getAttribute('width')||'':String(values.width).trim();
    let align = values.alignment??imageAlignment(image);
    if(!url||width&&(!Number.isInteger(Number(width))||Number(width)<1||Number(width)>4096)||
        ![0,1,2,3].includes(align)){return false;}
    return editor.transaction(()=>{
        image.setAttribute('src',url);
        image.setAttribute('alt',values.alt??image.alt);
        if(width){image.setAttribute('width',width);}else{image.removeAttribute('width');}
        if(values.width!==undefined){image.removeAttribute('height');}
        image.style.display = align?'block':'';
        image.style.marginLeft = align>1?'auto':align?'0px':'';
        image.style.marginRight = align===2?'auto':align?'0px':'';
        let range = document.createRange();
        range.selectNode(image);
        editor.selection.select(range);
        return true;
    });
}
