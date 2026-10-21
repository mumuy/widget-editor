import {fileType,fileAccept} from './file.js';
import {safeURL} from './sanitize.js';
import createMaterials,{normalizeMaterial} from './material.js';
import {loading,renderIcon} from '../icon.js';

// 上传与素材库共用回调校验、取消状态及插入流程。
export default function openMedia(editor,options,initialMode){
    let range = editor.getRange()?.cloneRange();
    let modes = editor.config.methods(options.kind);
    if(!modes.length){return;}
    let limit = editor.config.get(options.kind+'-limit');
    let mode = initialMode??modes[0];
    if(!modes.includes(mode)){return;}
    let busy = false;
    let cancelPending = null;
    let pendingType;
    let revision = 0;
    let materials;
    let page = 0;
    let hasNext = false;
    let more;
    let observer;
    let addButton;
    let addInput;
    let selectedCount = 0;
    let noticeMessage = [''];
    let uploaded = null;
    let progress;
    let description;
    let dialog;
    let notice;
    let submit;
    let tabs;
    let panels = new Map();
    let current = ()=>editor.isConnected&&!editor.source&&editor._dialog===dialog&&dialog.isConnected&&dialog.open;
    // 同一份有效插入结果同时控制按钮状态和最终提交。
    let getInsertion = function(){
        if(busy){return null;}
        if(mode==='upload'){return uploaded;}
        if(mode==='resource'){
            let sources = materials.values();
            return sources.length&&sources.length<=limit?{sources}:null;
        }
        let value = panels.get(mode).fields.querySelector('[name="'+mode+'"]').value;
        if(mode==='iframe'){
            let html = options.iframe(value);
            return html?{html}:null;
        }
        let source = safeURL(value,options.kind);
        return source?{sources:[source]}:null;
    };
    let updateNotice = function(){
        let count = mode==='resource'&&!noticeMessage[0];
        notice.toggleAttribute('data-count',count);
        if(count){editor.locale.set(notice,'已选 {count} 项',{count:selectedCount});}
        else{
            let [message,params,literal] = noticeMessage;
            editor.locale.set(notice,message,params,'textContent',literal);
        }
    };
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
        if(mode==='resource'){dialog.querySelector('.dialog-foot').prepend(notice);}
        else{(activePanel.feedback||activePanel.element).appendChild(notice);}
        updateNotice();
        addButton.hidden = mode!=='resource';
        addButton.disabled = busy;
        addInput.disabled = busy||mode!=='resource';
        materials?.busy(busy);
        if(more){
            more.hidden = !hasNext;
            more.disabled = busy;
            more.querySelector('svg').hidden = !busy||pendingType!=='request';
            editor.locale.set(more.querySelector('span'),busy&&pendingType==='request'?'加载中…':'加载更多');
        }
        dialog.updateSubmit();
    };
    let setBusy = function(value,name){
        busy = value;
        pendingType = value?name:null;
        tabs.querySelectorAll('[data-media-tab]').forEach(button=>button.disabled=busy&&['upload','add'].includes(pendingType));
        setMode(mode);
        progress.hidden = !busy||pendingType!=='upload';
        editor.locale.set(submit,busy&&pendingType==='upload'?'上传中…':'插入'+options.name);
        editor.locale.set(addButton,busy&&pendingType==='add'?'上传中…':'上传素材');
        if(busy){
            dialog.message('');
        }
    };
    let resolveResources = function(name,{files=[],url,page}={}){
        let uploading = ['upload','add'].includes(name);
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
                limit,
                onComplete(urls,hasNext=false){
                    if(!active()){
                        return;
                    }
                    if(name==='remove'){finish(true);return;}
                    let sources = Array.isArray(urls)?Array.from(urls,value=>normalizeMaterial(value,options.kind)):[];
                    if(!Array.isArray(urls)||sources.some(source=>!source)||uploading&&sources.length!==files.length){
                        error(uploading?'请按文件顺序返回对应数量的有效 URL，请重试':'请返回有效的素材列表，请重试',true);
                        return;
                    }
                    if(uploading&&sources.length>limit){
                        error('一次最多选择 {count} 个素材',true,{count:limit});
                        return;
                    }
                    let seen = new Set();
                    finish(name==='request'?{sources:sources.filter(item=>!seen.has(item.original)&&seen.add(item.original)),hasNext:hasNext===true}:sources);
                },
                onError:error
            };
            if(name==='request'){detail.page = page;}
            if(name==='remove'){detail.url = url;}
            if(uploading){
                detail.files = files.slice();
                detail.onProgress = function(percent){
                    if(active()&&Number.isFinite(Number(percent))){
                        let value = Math.max(0,Math.min(100,Number(percent)));
                        progress.querySelector('progress').value = value;
                        editor.locale.set(progress.querySelector('span'),'上传中 {percent}%',{percent:Math.round(value)});
                        if(name==='add'){editor.locale.set(addButton,'上传中 {percent}%',{percent:Math.round(value)});}
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
    let uploadFiles = async function(name,input){
        if(busy||!current()){return;}
        let files = Array.from(input.files);
        if(name==='upload'){uploaded = null;}
        dialog.message('');
        setMode(mode);
        if(!files.length){return;}
        let message;
        let params;
        if(files.some(file=>!fileType(file,options.types))){
            message = options.error||'请选择文件';
        }else if(files.length>limit){
            message = '一次最多选择 {count} 个文件';
            params = {count:limit};
        }else if(files.some(file=>file.size>options.size*1024*1024)){
            message = '{type}大小不能超过 {size} MB';
            params = {type:options.name,size:options.size};
        }
        if(message){
            dialog.message(message,params);
            input.value = '';
            return;
        }
        let version = revision;
        let sources = await resolveResources(name,{files});
        if(!current()||version!==revision){return;}
        if(sources){
            if(name==='upload'){uploaded = {files,sources:sources.map(item=>item.original)};}
            else{materials.prepend(sources);}
        }
        if(name==='add'||!sources){input.value = '';}
        setMode(mode);
    };
    let insert = function(sources,files=[],values={}){
        dialog.dismiss();
        editor.selection.range = range;
        editor.command('insertMedia',{type:options.kind,sources,files,values});
    };
    let request = async function(reset=true){
        if(!reset&&(busy||!hasNext||mode!=='resource'||!current())){return;}
        if(reset){
            page = 0;
            hasNext = false;
            materials.status('加载中…',true);
        }
        let version = revision;
        let nextPage = page+1;
        let result = await resolveResources('request',{page:nextPage});
        if(current()&&mode==='resource'&&version===revision){
            if(result){
                page = nextPage;
                hasNext = result.hasNext;
                if(reset){materials.render(result.sources);}
                else{materials.append(result.sources);}
                // 追加后仍未填满面板时，允许继续请求下一页。
                observer.unobserve(more);
                observer.observe(more);
            }else if(reset){materials.status('暂无素材');}
            setMode(mode);
        }
    };
    let activate = function(value,focus=false){
        revision++;
        cancelPending?.();
        dialog.message('');
        setMode(value,focus);
        if(mode==='resource'){request();}
    };
    let fields = {
        upload:{'name':'file','label':limit===1?'选择{type}（最大 {size} MB）':
            Number.isFinite(limit)?'选择{type}（最多 {count} 个，单个最大 {size} MB）':'选择{type}（不限数量，单个最大 {size} MB）',
            'params':{type:options.name,size:options.size,count:limit},'type':'file',
            'accept':fileAccept(options.types),'required':true,'multiple':limit>1},
        url:{'name':'url','label':options.name+'地址','type':'text','placeholder':'https://example.com/file','required':true},
        iframe:{'name':'iframe','label':'iframe 嵌入代码','type':'textarea','placeholder':'粘贴视频网站提供的 iframe 代码','required':true}
    };
    dialog = editor.openDialog({
        'title':'插入'+options.name,
        'keepOpen':true,
        canSubmit:()=>!!getInsertion(),
        'fields':[...modes.map(name=>fields[name]).filter(Boolean),...(modes.some(name=>['upload','url'].includes(name))?[options.field]:[])],
        'submitLabel':'插入'+options.name,
        mount(node){
            dialog = node;
            dialog.classList.add('media-dialog');
            dialog.dataset.insert = options.kind;
            submit = dialog.querySelector('[type="submit"]');
            notice = dialog.querySelector('.dialog-notice');
            dialog.message = (...args)=>{noticeMessage = args;updateNotice();};
            dialog.querySelector('.dialog-cancel').remove();
            addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'btn';
            addButton.dataset.materialAdd = '';
            editor.locale.set(addButton,'上传素材');
            addInput = document.createElement('input');
            addInput.type = 'file';
            addInput.accept = fields.upload.accept;
            addInput.multiple = fields.upload.multiple;
            addInput.hidden = true;
            addInput.dataset.materialUpload = '';
            addInput.onchange = ()=>uploadFiles('add',addInput);
            addButton.onclick = ()=>addInput.click();
            dialog.querySelector('.dialog-foot').prepend(addButton,addInput);
            tabs = document.createElement('div');
            tabs.className = 'media-tabs';
            tabs.setAttribute('role','tablist');
            editor.locale.set(tabs,'插入方式',{},'aria-label');
            let labels = {upload:'上传文件',url:'网络地址',iframe:'嵌入 iframe',resource:'素材库'};
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
                if(name==='resource'){
                    materials = createMaterials(editor,{
                        ...options,limit,
                        onSelectionChange:count=>{selectedCount = count;updateNotice();dialog.updateSubmit();},
                        message:(...args)=>dialog.message(...args),
                        remove:url=>resolveResources('remove',{url})
                    });
                    element.appendChild(materials.element);
                    more = document.createElement('button');
                    more.type = 'button';
                    more.className = 'material-more';
                    more.hidden = true;
                    more.innerHTML = renderIcon(loading)+'<span></span>';
                    more.onclick = ()=>request(false);
                    element.appendChild(more);
                    observer = new IntersectionObserver(entries=>{
                        if(entries.some(entry=>entry.isIntersecting)){request(false);}
                    },{root:element});
                }else{
                    panel.fields = document.createElement('div');
                    panel.fields.className = 'media-fields';
                    panel.fields.appendChild(dialog.querySelector('[name="'+fields[name].name+'"]').closest('.field'));
                    element.appendChild(panel.fields);
                }
                if(name==='upload'){
                    panel.feedback = document.createElement('div');
                    panel.feedback.className = 'upload-feedback';
                    panel.fields.querySelector('[name=file]').onchange = event=>uploadFiles('upload',event.target);
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
                if(button&&(!busy||!['upload','add'].includes(pendingType))){activate(button.dataset.mediaTab);}
            });
            tabs.addEventListener('keydown',event=>{
                if(busy&&['upload','add'].includes(pendingType)){return;}
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
            observer?.disconnect();
            revision++;
            cancelPending?.();
        },
        onSubmit(values){
            let result = getInsertion();
            if(!result){return false;}
            if(result.html){
                dialog.close();
                editor.selection.range = range;
                editor.command('insertIframe',result.html);
            }else{
                insert(result.sources,result.files||[],values);
            }
            return true;
        }
    });
    if(mode==='resource'){request();}
    return dialog;
}
