import {fileType,urlFileName} from './file.js';
import {safeURL} from './sanitize.js';
import createMaterials,{normalizeMaterial} from './material.js';

// 上传与素材库共用回调校验、取消状态及插入流程。
export default function openMedia(editor,options){
    let range = editor.getRange()?.cloneRange();
    let modes = editor.config.methods(options.kind);
    if(!modes.length){return;}
    let batch = editor.config.get(options.kind+'-batch');
    let mode = modes[0];
    let busy = false;
    let cancelPending = null;
    let pendingType;
    let revision = 0;
    let materials;
    let addButton;
    let progress;
    let description;
    let dialog;
    let notice;
    let submit;
    let tabs;
    let panels = new Map();
    let current = ()=>editor.isConnected&&!editor.source&&editor._dialog===dialog&&dialog.isConnected&&dialog.open;
    let setMode = function(value,focus=false){
        if(!modes.includes(value)){return;}
        mode = value;
        let activePanel = panels.get(mode);
        if(description&&activePanel.fields&&['upload','url'].includes(mode)){
            activePanel.fields.appendChild(description);
        }
        tabs.querySelectorAll('[data-media-tab]').forEach(button=>{
            let active = button.dataset.mediaTab===mode;
            button.setAttribute('aria-selected',String(active));
            button.tabIndex = active?0:-1;
            if(active&&focus){button.focus({preventScroll:true});}
        });
        panels.forEach((panel,name)=>{
            let active = name===mode;
            panel.element.hidden = !active;
            panel.element.inert = !active;
            panel.element.querySelectorAll('input,textarea').forEach(input=>input.disabled=!active||busy);
        });
        (activePanel.feedback||activePanel.element).appendChild(notice);
        addButton.hidden = mode!=='request';
        addButton.disabled = busy;
        materials?.busy(busy);
        submit.disabled = busy;
    };
    let setBusy = function(value,name){
        busy = value;
        pendingType = value?name:null;
        tabs.querySelectorAll('[data-media-tab]').forEach(button=>button.disabled=busy&&pendingType==='upload');
        setMode(mode);
        progress.hidden = !busy||pendingType!=='upload';
        editor.locale.set(submit,busy&&pendingType==='upload'?'上传中…':'插入'+options.name);
        if(busy){
            dialog.message('');
        }
    };
    let resolveResources = function(name,files=[],url){
        setBusy(true,name);
        return new Promise(resolve=>{
            let done = false;
            let active = ()=>!done&&current();
            let finish = function(value){
                if(done){
                    return;
                }
                done = true;
                cancelPending = null;
                if(current()){setBusy(false);}
                resolve(value);
            };
            let error = function(err,translate=false,params){
                if(active()){
                    dialog.message(String(err?.message||err||({upload:'上传失败，请重试',request:'素材加载失败，请重试',remove:'素材删除失败，请重试',add:'素材上传失败，请重试'}[name])),params,!translate&&!!(err?.message||err));
                    finish(false);
                }
            };
            cancelPending = ()=>finish(null);
            let detail = {
                type:options.kind,
                limit:batch,
                onComplete(urls){
                    if(!active()){
                        return;
                    }
                    if(name==='remove'){finish(true);return;}
                    let sources = Array.isArray(urls)?Array.from(urls,value=>normalizeMaterial(value,options.kind)):[];
                    if(!Array.isArray(urls)||sources.some(source=>!source)||name==='upload'&&sources.length!==files.length){
                        error(name==='upload'?'请按文件顺序返回对应数量的有效 URL，请重试':'请返回有效的素材列表，请重试',true);
                        return;
                    }
                    if(name==='upload'&&sources.length>batch){
                        error('一次最多选择 {count} 个素材',true,{count:batch});
                        return;
                    }
                    let seen = new Set();
                    finish(name!=='upload'?sources.filter(item=>!seen.has(item.original)&&seen.add(item.original)):
                        sources.map(item=>item.original));
                },
                onError:error
            };
            if(name==='remove'){detail.url = url;}
            if(name==='upload'){
                detail.files = files.slice();
                detail.onProgress = function(percent){
                    if(active()&&Number.isFinite(Number(percent))){
                        let value = Math.max(0,Math.min(100,Number(percent)));
                        progress.querySelector('progress').value = value;
                        editor.locale.set(progress.querySelector('span'),'上传中 {percent}%',{percent:Math.round(value)});
                    }
                };
                progress.querySelector('progress').value = 0;
                editor.locale.set(progress.querySelector('span'),'上传中 {percent}%',{percent:0});
            }
            editor.dispatchEvent(new CustomEvent(name,{
                detail,
                bubbles:true,
                composed:true
            }));
        });
    };
    let insert = function(sources,files=[],values={}){
        let batch = sources.length>1;
        let html = sources.map((source,index)=>options.html(source,{
            ...values,name:files[index]?.name||urlFileName(source,editor.t(options.name)),batch
        })).join('');
        dialog.dismiss();
        editor.selection.range = range;
        batch&&options.insertBatch?options.insertBatch(html):editor.insertHTML(html);
    };
    let request = async function(){
        let version = revision;
        materials.status('加载中…');
        let sources = await resolveResources('request');
        if(current()&&mode==='request'&&version===revision){
            sources?materials.render(sources):materials.status('暂无素材');
        }
    };
    let activate = function(value,focus=false){
        revision++;
        cancelPending?.();
        dialog.message('');
        setMode(value,focus);
        if(mode==='request'){request();}
    };
    let fields = {
        upload:{'name':'file','label':batch===1?'选择{type}（最大 {size} MB）':
            Number.isFinite(batch)?'选择{type}（最多 {count} 个，单个最大 {size} MB）':'选择{type}（不限数量，单个最大 {size} MB）',
            'params':{type:options.name,size:options.size,count:batch},'type':'file',
            'accept':options.accept||'','required':true,'multiple':batch>1},
        url:{'name':'url','label':options.name+'地址','type':'text','placeholder':'https://example.com/file','required':true},
        iframe:{'name':'iframe','label':'iframe 嵌入代码','type':'textarea','placeholder':'粘贴视频网站提供的 iframe 代码','required':true}
    };
    dialog = editor.openDialog({
        'title':'插入'+options.name,
        'keepOpen':true,
        'fields':[...modes.map(name=>fields[name]).filter(Boolean),...(modes.some(name=>['upload','url'].includes(name))?[options.field]:[])],
        'submitLabel':'插入'+options.name,
        mount(node){
            dialog = node;
            dialog.classList.add('media-dialog');
            submit = dialog.querySelector('[type="submit"]');
            notice = dialog.querySelector('.dialog-notice');
            dialog.querySelector('.dialog-cancel').remove();
            addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'btn';
            addButton.dataset.materialAdd = '';
            editor.locale.set(addButton,'上传素材');
            addButton.onclick = async ()=>{
                if(busy){return;}
                let version = revision;
                let sources = await resolveResources('add');
                if(sources&&current()&&mode==='request'&&version===revision){materials.prepend(sources);}
            };
            dialog.querySelector('.dialog-foot').prepend(addButton);
            tabs = document.createElement('div');
            tabs.className = 'media-tabs';
            tabs.setAttribute('role','tablist');
            editor.locale.set(tabs,'插入方式',{},'aria-label');
            let labels = {upload:'上传文件',url:'URL',iframe:'嵌入 iframe',request:'素材库'};
            tabs.innerHTML = modes.map(name=>`<button type="button" role="tab" id="media-${name}-tab" aria-controls="media-${name}-panel" data-media-tab="${name}">${labels[name]}</button>`).join('');
            let panelGroup = document.createElement('div');
            panelGroup.className = 'media-panels';
            description = dialog.querySelector('[name="'+options.field.name+'"]')?.closest('.field');
            progress = document.createElement('div');
            progress.className = 'upload-progress';
            progress.hidden = true;
            progress.innerHTML = '<progress max="100" value="0" aria-label="上传进度"></progress><span role="status" aria-live="polite"></span>';
            modes.forEach(name=>{
                let element = document.createElement('div');
                element.className = 'media-panel';
                element.id = 'media-'+name+'-panel';
                element.dataset.mediaPanel = name;
                element.setAttribute('role','tabpanel');
                element.setAttribute('aria-labelledby','media-'+name+'-tab');
                let panel = {element};
                panels.set(name,panel);
                panelGroup.appendChild(element);
                if(name==='request'){
                    materials = createMaterials(editor,{
                        ...options,limit:batch,
                        message:(...args)=>dialog.message(...args),
                        remove:url=>resolveResources('remove',[],url)
                    });
                    element.appendChild(materials.element);
                }else{
                    panel.fields = document.createElement('div');
                    panel.fields.className = 'media-fields';
                    panel.fields.appendChild(dialog.querySelector('[name="'+fields[name].name+'"]').closest('.field'));
                    element.appendChild(panel.fields);
                }
                if(name==='upload'){
                    panel.feedback = document.createElement('div');
                    panel.feedback.className = 'upload-feedback';
                    panel.feedback.appendChild(progress);
                    element.appendChild(panel.feedback);
                }
            });
            // 字段归面板所有；描述在上传与 URL 间复用，提示归当前面板所有。
            if(description){
                panels.get(modes.find(name=>['upload','url'].includes(name))).fields.appendChild(description);
            }
            dialog.querySelector('.dialog-body').replaceChildren(tabs,panelGroup);
            tabs.addEventListener('click',event=>{
                let button = event.target.closest('[data-media-tab]');
                if(button&&(!busy||pendingType!=='upload')){activate(button.dataset.mediaTab);}
            });
            tabs.addEventListener('keydown',event=>{
                if(busy&&pendingType==='upload'){return;}
                let value;
                if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
                    value = modes[(modes.indexOf(mode)+(event.key==='ArrowRight'?1:-1)+modes.length)%modes.length];
                }else if(event.key==='Home'){
                    value = modes[0];
                }else if(event.key==='End'){
                    value = modes.at(-1);
                }
                if(value){
                    event.preventDefault();
                    activate(value,true);
                }
            });
            setMode(mode);
        },
        onClose(){
            revision++;
            cancelPending?.();
        },
        async onSubmit(values){
            if(busy){return false;}
            if(mode==='request'){
                let sources = materials.values();
                if(!sources.length){
                    dialog.message('请选择素材');
                    return false;
                }
                insert(sources);
                return true;
            }
            if(mode==='iframe'){
                let html = options.iframe(values.iframe);
                if(!html){
                    dialog.message('请输入有效的 iframe 嵌入代码');
                    return false;
                }
                dialog.close();
                editor.selection.range = range;
                editor.insertHTML(html);
                return true;
            }
            let files = mode==='upload'?values.file:[];
            let sources;
            if(mode==='upload'){
                if(!files.length||files.some(file=>!fileType(file,options.types))){
                    dialog.message(options.error||'请选择文件');
                    return false;
                }
                if(files.length>batch){
                    dialog.message('一次最多选择 {count} 个文件',{count:batch});
                    return false;
                }
                if(files.some(file=>file.size>options.size*1024*1024)){
                    dialog.message('{type}大小不能超过 {size} MB',{type:options.name,size:options.size});
                    return false;
                }
                sources = await resolveResources('upload',files);
                if(sources===null||!current()){
                    return true;
                }
                if(sources===false){
                    return false;
                }
            }else{
                let source = safeURL(values.url,options.kind);
                if(!source){
                    dialog.message('请输入有效的{type}地址',{type:options.name});
                    return false;
                }
                sources = [source];
            }
            insert(sources,files,values);
            return true;
        }
    });
    if(mode==='request'){request();}
    return dialog;
}
