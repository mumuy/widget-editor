import {audio,attachment,close,loading,renderIcon} from '../icon.js';
import {urlFileName} from './file.js';
import {safeURL} from './sanitize.js';

export function normalizeMaterial(value,kind){
    if(typeof value==='string'){value = {original:value};}
    if(!value||typeof value!=='object'||Array.isArray(value)){return null;}
    let original = typeof value.original==='string'?safeURL(value.original,kind):'';
    let thumbnail = value.thumbnail===undefined?original:
        typeof value.thumbnail==='string'?safeURL(value.thumbnail,'image'):'';
    return original&&thumbnail?{original,thumbnail}:null;
}

// 素材按数据顺序渲染，尺寸和排列交给 CSS Grid。
export default function createMaterials(editor,options){
    let list = document.createElement('div');
    list.className = 'material-list';
    editor.locale.set(list,'素材列表',{},'aria-label');
    list.setAttribute('role','group');
    let items = [];
    let selected = new Set();
    let busy = false;
    let cards = new Map();
    let indices = new WeakMap();
    let painted = new Set();
    let updateSelection = ()=>{
        new Set([...painted,...selected]).forEach(url=>{
            cards.get(url)?.querySelector('.material-select').setAttribute('aria-pressed',String(selected.has(url)));
        });
        painted = new Set(selected);
        options.onSelectionChange?.(selected.size);
    };
    let status = function(text,pending=false){
        items = [];
        selected.clear();
        cards.clear();
        painted.clear();
        let message = document.createElement('p');
        message.className = 'material-empty';
        message.setAttribute('role','status');
        let label = document.createElement('span');
        editor.locale.set(label,text);
        if(pending){message.innerHTML = renderIcon(loading);}
        message.appendChild(label);
        list.replaceChildren(message);
        options.onSelectionChange?.(0);
    };
    let createCard = function(item,index){
        let card = document.createElement('div');
        card.className = 'material-item';
        indices.set(card,index);
        let select = document.createElement('button');
        select.type = 'button';
        select.className = 'material-select';
        select.setAttribute('aria-pressed',String(selected.has(item.original)));
        select.setAttribute('aria-label',urlFileName(item.original,editor.t(options.name)));
        select.disabled = busy;
        if(options.kind==='image'||options.kind==='video'||item.thumbnail!==item.original){
            let image = options.kind!=='video'||item.thumbnail!==item.original;
            let preview = document.createElement(image?'img':'video');
            preview.src = item.thumbnail;
            if(image){
                preview.alt = '';
                preview.loading = 'lazy';
                preview.decoding = 'async';
            }else{
                preview.preload = 'metadata';
                preview.muted = true;
                preview.playsInline = true;
            }
            select.appendChild(preview);
        }else{
            select.innerHTML = renderIcon(options.kind==='audio'?audio:attachment);
        }
        let remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'material-remove';
        remove.innerHTML = renderIcon(close);
        remove.disabled = busy;
        editor.locale.set(remove,'移除素材',{},'aria-label');
        card.append(select,remove);
        return card;
    };
    let renderCards = function(){
        cards.clear();
        let fragment = document.createDocumentFragment();
        items.forEach((item,index)=>{
            let card = createCard(item,index);
            cards.set(item.original,card);
            fragment.appendChild(card);
        });
        list.replaceChildren(fragment);
        updateSelection();
    };
    list.addEventListener('click',async event=>{
        let button = event.target.closest('button');
        let card = button?.closest('.material-item');
        if(!card||busy){return;}
        let item = items[indices.get(card)];
        if(button.classList.contains('material-remove')){
            if(await options.remove(item.original)&&items.includes(item)){
                selected.delete(item.original);
                items = items.filter(value=>value!==item);
                if(!items.length){status('暂无素材');return;}
                renderCards();
                list.querySelector('.material-select')?.focus({preventScroll:true});
            }
            return;
        }
        if(selected.has(item.original)){selected.delete(item.original);}
        else{
            if(options.limit===1){selected.clear();}
            if(selected.size>=options.limit){
                options.message('一次最多选择 {count} 个素材',{count:options.limit});return;
            }
            selected.add(item.original);
        }
        options.message('');
        updateSelection();
    });
    list.addEventListener('keydown',event=>{
        if(event.isComposing||busy||!event.target.matches('.material-select')){return;}
        let columns = getComputedStyle(list).gridTemplateColumns.split(' ').length;
        let index = indices.get(event.target.parentElement);
        let next = event.key==='ArrowRight'?index+1:event.key==='ArrowLeft'?index-1:
            event.key==='ArrowDown'?index+columns:event.key==='ArrowUp'?index-columns:
            event.key==='Home'?0:event.key==='End'?items.length-1:null;
        if(next===null){return;}
        event.preventDefault();
        next = Math.max(0,Math.min(items.length-1,next));
        let button = cards.get(items[next].original)?.querySelector('.material-select');
        button?.focus({preventScroll:true});
        button?.scrollIntoView({block:'nearest',inline:'nearest'});
    });
    return {
        element:list,
        status,
        values:()=>items.filter(item=>selected.has(item.original)).map(item=>item.original),
        busy(value){
            busy = value;
            list.setAttribute('aria-busy',String(value));
            list.querySelectorAll('button').forEach(button=>button.disabled=value);
        },
        prepend(materials){
            let originals = new Set(materials.map(item=>item.original));
            let seen = new Set();
            let added = materials.filter(item=>!seen.has(item.original)&&seen.add(item.original));
            this.render([...added,...items.filter(item=>!originals.has(item.original))],true);
        },
        render(materials,keepSelection=false){
            let selection = keepSelection?new Set(selected):new Set();
            status('暂无素材');
            items = materials;
            selected = new Set(items.filter(item=>selection.has(item.original)).map(item=>item.original));
            if(!items.length){return;}
            list.parentElement.scrollTop = 0;
            renderCards();
        }
    };
}
