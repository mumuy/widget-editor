import {audio,attachment,close,renderIcon} from '../icon.js';
import {urlFileName} from './file.js';

// 只管理素材展示与选择，数据请求、删除及插入交由共享弹框处理。
export default function createMaterials(editor,options){
    let field = document.createElement('div');
    field.className = 'material-field';
    let list = document.createElement('div');
    list.className = 'material-list';
    editor.locale.set(list,'素材列表',{},'aria-label');
    list.setAttribute('role','group');
    field.appendChild(list);
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
        field,
        status,
        values:()=>items.filter(item=>selected.has(item.url)).map(item=>item.url),
        busy(value){
            busy = value;
            list.setAttribute('aria-busy',String(value));
            list.querySelectorAll('button').forEach(button=>button.disabled=value);
        },
        render(urls){
            status('暂无素材');
            items = urls.map(url=>({url}));
            if(!items.length){return;}
            list.replaceChildren();
            items.forEach(item=>{
                let name = urlFileName(item.url,editor.t(options.name));
                let card = document.createElement('div');
                card.className = 'material-item';
                let select = document.createElement('button');
                select.type = 'button';
                select.className = 'material-select';
                select.setAttribute('aria-pressed','false');
                select.disabled = busy;
                if(options.kind==='image'||options.kind==='video'){
                    let preview = document.createElement(options.kind==='image'?'img':'video');
                    preview.src = item.url;
                    if(options.kind==='image'){
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
                let caption = document.createElement('span');
                caption.textContent = name;
                select.appendChild(caption);
                select.onclick = ()=>{
                    if(selected.has(item.url)){
                        selected.delete(item.url);
                    }else{
                        if(options.limit===1){selected.clear();}
                        if(selected.size>=options.limit){
                            options.message('一次最多选择 {count} 个素材',{count:options.limit});
                            return;
                        }
                        selected.add(item.url);
                    }
                    options.message('');
                    items.forEach(item=>item.button.setAttribute('aria-pressed',String(selected.has(item.url))));
                };
                item.button = select;
                let remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'material-remove';
                remove.innerHTML = renderIcon(close);
                remove.disabled = busy;
                editor.locale.set(remove,'移除素材',{},'aria-label');
                remove.onclick = async ()=>{
                    if(await options.remove(item.url)&&list.contains(card)){
                        selected.delete(item.url);
                        items = items.filter(value=>value!==item);
                        card.remove();
                        if(!items.length){status('暂无素材');}
                        else if(!field.closest('[hidden]')){items[0].button.focus({preventScroll:true});}
                    }
                };
                card.append(select,remove);
                list.appendChild(card);
            });
        }
    };
}
