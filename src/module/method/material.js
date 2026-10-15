import {audio,attachment,close,renderIcon} from '../icon.js';
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

// 只管理素材展示与选择，数据请求、删除及插入交由共享弹框处理。
export default function createMaterials(editor,options){
    let list = document.createElement('div');
    list.className = 'material-list';
    editor.locale.set(list,'素材列表',{},'aria-label');
    list.setAttribute('role','group');
    let items = [];
    let selected = new Set();
    let busy = false;
    let status = function(text){
        items = [];
        selected.clear();
        let message = document.createElement('p');
        message.className = 'material-empty';
        message.setAttribute('role','status');
        editor.locale.set(message,text);
        list.replaceChildren(message);
    };
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
            this.render([...materials,...items.filter(item=>!originals.has(item.original))],true);
            list.scrollTop = 0;
        },
        render(materials,keepSelection=false){
            let selection = keepSelection?new Set(selected):new Set();
            status('暂无素材');
            selected = selection;
            items = materials;
            if(!items.length){return;}
            list.replaceChildren();
            items.forEach(item=>{
                let card = document.createElement('div');
                card.className = 'material-item';
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
                    }else{
                        preview.preload = 'metadata';
                        preview.muted = true;
                        preview.playsInline = true;
                    }
                    select.appendChild(preview);
                }else{
                    select.innerHTML = renderIcon(options.kind==='audio'?audio:attachment);
                }
                select.onclick = ()=>{
                    if(selected.has(item.original)){
                        selected.delete(item.original);
                    }else{
                        if(options.limit===1){selected.clear();}
                        if(selected.size>=options.limit){
                            options.message('一次最多选择 {count} 个素材',{count:options.limit});
                            return;
                        }
                        selected.add(item.original);
                    }
                    options.message('');
                    items.forEach(item=>item.button.setAttribute('aria-pressed',String(selected.has(item.original))));
                };
                item.button = select;
                let remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'material-remove';
                remove.innerHTML = renderIcon(close);
                remove.disabled = busy;
                editor.locale.set(remove,'移除素材',{},'aria-label');
                remove.onclick = async ()=>{
                    if(await options.remove(item.original)&&list.contains(card)){
                        selected.delete(item.original);
                        items = items.filter(value=>value!==item);
                        card.remove();
                        if(!items.length){status('暂无素材');}
                        else if(!list.closest('[hidden]')){items[0].button.focus({preventScroll:true});}
                    }
                };
                card.append(select,remove);
                list.appendChild(card);
            });
        }
    };
}
