import {fileType,urlFileName} from './file.js';
import {safeURL} from './sanitize.js';

// 文件由外部上传，组件只管理插入弹窗、进度与回调状态。
export default function openUpload(editor,options){
    let range = editor.getRange()?.cloneRange();
    let modes = editor.config.methods(options.kind).map(name=>name==='upload'?'file':name);
    if(!modes.length){return;}
    let mode = modes[0];
    let busy = false;
    let cancelUpload = null;
    let progress;
    let description;
    let dialog;
    let current = ()=>editor.isConnected&&!editor.source&&editor._dialog===dialog&&dialog.isConnected&&dialog.open;
    let setMode = function(value,focus=false){
        if(!modes.includes(value)){return;}
        mode = value;
        if(description&&mode!=='iframe'){
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
    };
    let setBusy = function(value){
        busy = value;
        dialog.querySelectorAll('input,textarea,[data-insert-tab]').forEach(input=>input.disabled=busy);
        setMode(mode);
        progress.hidden = !busy;
        editor.locale.set(dialog.querySelector('[type="submit"]'),busy?'上传中…':'插入'+options.name);
        if(busy){
            dialog.message('');
        }
    };
    let upload = function(file){
        return new Promise(resolve=>{
            let done = false;
            let active = ()=>!done&&current();
            let finish = function(value){
                if(done){
                    return;
                }
                done = true;
                cancelUpload = null;
                resolve(value);
            };
            let error = function(err,translate=false){
                if(active()){
                    dialog.message(String(err?.message||err||'上传失败，请重试'),undefined,!translate&&!!(err?.message||err));
                    finish(false);
                }
            };
            cancelUpload = ()=>finish(null);
            progress.querySelector('progress').value = 0;
            editor.locale.set(progress.querySelector('span'),'上传中 {percent}%',{percent:0});
            editor.dispatchEvent(new CustomEvent('upload',{
                detail:{
                    file,
                    type:options.kind,
                    onUploadComplete(url){
                        if(!active()){
                            return;
                        }
                        let source = typeof url==='string'?safeURL(url,options.kind):'';
                        if(!source){
                            error('上传结果不是有效的 URL，请重试',true);
                            return;
                        }
                        finish(source);
                    },
                    onUploadError:error,
                    onProgress(percent){
                        if(active()&&Number.isFinite(Number(percent))){
                            let value = Math.max(0,Math.min(100,Number(percent)));
                            progress.querySelector('progress').value = value;
                            editor.locale.set(progress.querySelector('span'),'上传中 {percent}%',{percent:Math.round(value)});
                        }
                    }
                },
                bubbles:true,
                composed:true
            }));
        });
    };
    let fields = {
        file:{'name':'file','label':'选择{type}（最大 {size} MB）','params':{type:options.name,size:options.size},'type':'file',
            'accept':options.accept||'','required':true},
        url:{'name':'url','label':options.name+'地址','type':'text','placeholder':'https://example.com/file','required':true},
        iframe:{'name':'iframe','label':'iframe 嵌入代码','type':'textarea','placeholder':'粘贴视频网站提供的 iframe 代码','required':true}
    };
    dialog = editor.openDialog({
        'title':'插入'+options.name,
        'keepOpen':true,
        'fields':[...modes.map(name=>fields[name]),...(modes.some(name=>name!=='iframe')?[options.field]:[])],
        'submitLabel':'插入'+options.name,
        mount(node){
            dialog = node;
            dialog.classList.add('upload-dialog');
            let tabs = document.createElement('div');
            tabs.className = 'insert-tabs';
            tabs.setAttribute('role','tablist');
            tabs.setAttribute('aria-label','插入方式');
            tabs.innerHTML = modes.map(name=>`<button type="button" role="tab" id="insert-${name}-tab" aria-controls="insert-${name}-panel" data-insert-tab="${name}">${name==='file'?'上传文件':name==='url'?'URL':'嵌入 iframe'}</button>`).join('');
            dialog.querySelector('.dialog-body').prepend(tabs);
            let panels = document.createElement('div');
            panels.className = 'insert-panels';
            dialog.querySelector('.dialog-fields').prepend(panels);
            modes.forEach(name=>{
                let field = dialog.querySelector('[name="'+name+'"]').closest('.field');
                let panel = document.createElement('div');
                panel.className = 'insert-panel';
                panel.id = 'insert-'+name+'-panel';
                panel.dataset.insertPanel = name;
                panel.setAttribute('role','tabpanel');
                panel.setAttribute('aria-labelledby','insert-'+name+'-tab');
                panels.appendChild(panel);
                panel.appendChild(field);
            });
            description = dialog.querySelector('[name="'+options.field.name+'"]')?.closest('.field');
            if(description){
                panels.querySelector('[data-insert-panel]:not([data-insert-panel="iframe"])').appendChild(description);
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
            cancelUpload?.();
        },
        async onSubmit(values){
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
            let file = mode==='file'?values.file:null;
            let source;
            if(mode==='file'){
                if(!file||!fileType(file,options.types)){
                    dialog.message(options.error||'请选择文件');
                    return false;
                }
                if(file.size>options.size*1024*1024){
                    dialog.message('{type}大小不能超过 {size} MB',{type:options.name,size:options.size});
                    return false;
                }
                setBusy(true);
                try{
                    source = await upload(file);
                }finally{
                    if(current()){
                        setBusy(false);
                    }
                }
                if(source===null||!current()){
                    return true;
                }
                if(source===false){
                    return false;
                }
            }else{
                source = safeURL(values.url,options.kind);
                if(!source){
                    dialog.message('请输入有效的{type}地址',{type:options.name});
                    return false;
                }
            }
            values.name = file?.name||urlFileName(source,editor.t(options.name));
            // 插入时解除模态层的焦点限制，恢复原选区。
            dialog.close();
            editor.selection.range = range;
            editor.insertHTML(options.html(source,values));
            return true;
        }
    });
    return dialog;
}
