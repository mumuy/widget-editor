import {fileType,urlFileName} from './file.js';
import {safeURL} from './sanitize.js';

// 上传与资源库共用回调校验、取消状态及插入流程。
export default function openUpload(editor,options){
    let range = editor.getRange()?.cloneRange();
    let modes = editor.config.methods(options.kind).map(name=>name==='upload'?'file':name);
    if(!modes.length){return;}
    let batch = editor.config.get(options.kind+'-batch');
    let mode = modes[0];
    let busy = false;
    let cancelPending = null;
    let progress;
    let description;
    let dialog;
    let current = ()=>editor.isConnected&&!editor.source&&editor._dialog===dialog&&dialog.isConnected&&(dialog.open||dialog.suspended);
    let setMode = function(value,focus=false){
        if(!modes.includes(value)){return;}
        mode = value;
        if(description&&['file','url'].includes(mode)){
            dialog.querySelector('[data-insert-panel="'+mode+'"]').appendChild(description);
        }
        dialog.querySelectorAll('[data-insert-tab]').forEach(button=>{
            let active = button.dataset.insertTab===mode;
            button.setAttribute('aria-selected',String(active));
            button.tabIndex = active?0:-1;
            if(active&&focus){
                button.focus({preventScroll:true});
            }
        });
        dialog.querySelectorAll('[data-insert-panel]').forEach(panel=>{
            let active = panel.dataset.insertPanel===mode;
            panel.hidden = !active;
            panel.inert = !active;
            panel.querySelectorAll('input,textarea').forEach(input=>input.disabled=!active||busy);
        });
        dialog.querySelector('[type="submit"]').hidden = mode==='request';
    };
    let setBusy = function(value){
        busy = value;
        dialog.querySelectorAll('input,textarea,[data-insert-tab],[data-request]').forEach(input=>input.disabled=busy);
        setMode(mode);
        progress.hidden = !busy||mode==='request';
        editor.locale.set(dialog.querySelector('[type="submit"]'),busy?'上传中…':'插入'+options.name);
        if(busy){
            dialog.message('');
        }
    };
    let resolveResources = function(name,files=[]){
        return new Promise(resolve=>{
            let done = false;
            let active = ()=>!done&&current();
            let finish = function(value){
                if(done){
                    return;
                }
                done = true;
                cancelPending = null;
                resolve(value);
            };
            let error = function(err,translate=false,params){
                if(active()){
                    dialog.message(String(err?.message||err||(name==='upload'?'上传失败，请重试':'资源选择失败，请重试')),params,!translate&&!!(err?.message||err));
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
                    let sources = Array.isArray(urls)?Array.from(urls,url=>typeof url==='string'?safeURL(url,options.kind):''):[];
                    if(!sources.length||sources.some(source=>!source)||name==='upload'&&sources.length!==files.length){
                        error(name==='upload'?'请按文件顺序返回对应数量的有效 URL，请重试':'请返回有效的资源 URL 数组，请重试',true);
                        return;
                    }
                    if(sources.length>batch){
                        error('一次最多选择 {count} 个资源',true,{count:batch});
                        return;
                    }
                    finish(sources);
                },
                onError:error
            };
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
        if(busy||!current()){return;}
        setBusy(true);
        dialog.suspend();
        try{
            let sources = await resolveResources('request');
            if(sources&&current()){insert(sources);}
        }finally{
            if(current()){
                setBusy(false);
                dialog.resume();
            }
        }
    };
    let fields = {
        file:{'name':'file','label':batch===1?'选择{type}（最大 {size} MB）':
            Number.isFinite(batch)?'选择{type}（最多 {count} 个，单个最大 {size} MB）':'选择{type}（不限数量，单个最大 {size} MB）',
            'params':{type:options.name,size:options.size,count:batch},'type':'file',
            'accept':options.accept||'','required':true,'multiple':batch>1},
        url:{'name':'url','label':options.name+'地址','type':'text','placeholder':'https://example.com/file','required':true},
        iframe:{'name':'iframe','label':'iframe 嵌入代码','type':'textarea','placeholder':'粘贴视频网站提供的 iframe 代码','required':true}
    };
    dialog = editor.openDialog({
        'title':'插入'+options.name,
        'keepOpen':true,
        'fields':[...modes.map(name=>fields[name]).filter(Boolean),...(modes.some(name=>['file','url'].includes(name))?[options.field]:[])],
        'submitLabel':'插入'+options.name,
        mount(node){
            dialog = node;
            dialog.classList.add('upload-dialog');
            let tabs = document.createElement('div');
            tabs.className = 'insert-tabs';
            tabs.setAttribute('role','tablist');
            tabs.setAttribute('aria-label','插入方式');
            let labels = {file:'上传文件',url:'URL',iframe:'嵌入 iframe',request:'资源库'};
            tabs.innerHTML = modes.map(name=>`<button type="button" role="tab" id="insert-${name}-tab" aria-controls="insert-${name}-panel" data-insert-tab="${name}">${labels[name]}</button>`).join('');
            dialog.querySelector('.dialog-body').prepend(tabs);
            let panels = document.createElement('div');
            panels.className = 'insert-panels';
            dialog.querySelector('.dialog-fields').prepend(panels);
            modes.forEach(name=>{
                let panel = document.createElement('div');
                panel.className = 'insert-panel';
                panel.id = 'insert-'+name+'-panel';
                panel.dataset.insertPanel = name;
                panel.setAttribute('role','tabpanel');
                panel.setAttribute('aria-labelledby','insert-'+name+'-tab');
                panels.appendChild(panel);
                if(name==='request'){
                    let button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'resource-button';
                    button.dataset.request = '';
                    editor.locale.set(button,'选择资源');
                    button.addEventListener('click',request);
                    panel.appendChild(button);
                }else{
                    panel.appendChild(dialog.querySelector('[name="'+name+'"]').closest('.field'));
                }
            });
            description = dialog.querySelector('[name="'+options.field.name+'"]')?.closest('.field');
            if(description){
                panels.querySelector('[data-insert-panel="file"],[data-insert-panel="url"]').appendChild(description);
            }
            tabs.addEventListener('click',event=>{
                let button = event.target.closest('[data-insert-tab]');
                if(button&&!busy){
                    dialog.message('');
                    setMode(button.dataset.insertTab);
                }
            });
            tabs.addEventListener('keydown',event=>{
                if(busy){
                    return;
                }
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
                    dialog.message('');
                    setMode(value,true);
                }
            });
            progress = document.createElement('div');
            progress.className = 'upload-progress';
            progress.hidden = true;
            progress.innerHTML = '<progress max="100" value="0" aria-label="上传进度"></progress><span role="status" aria-live="polite"></span>';
            let feedback = document.createElement('div');
            feedback.className = 'upload-feedback';
            feedback.append(progress,dialog.querySelector('.dialog-notice'));
            dialog.querySelector('.dialog-body').appendChild(feedback);
            setMode(mode);
        },
        onClose(){
            cancelPending?.();
        },
        async onSubmit(values){
            if(mode==='request'){return false;}
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
            let files = mode==='file'?values.file:[];
            let sources;
            if(mode==='file'){
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
                setBusy(true);
                try{
                    sources = await resolveResources('upload',files);
                }finally{
                    if(current()){
                        setBusy(false);
                    }
                }
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
    return dialog;
}
