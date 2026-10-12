import {fileType,urlFileName} from './file.js';
import {safeURL} from './sanitize.js';

// 文件由外部上传，组件只管理插入弹窗、进度与回调状态。
export default function openUpload(editor,options){
    let range = editor.getRange()?.cloneRange();
    let mode = 'url';
    let busy = false;
    let cancelUpload = null;
    let progress;
    let dialog;
    let current = ()=>editor.isConnected&&!editor.source&&editor._dialog===dialog&&dialog.isConnected&&dialog.open;
    let setMode = function(value,focus=false){
        mode = value;
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
            panel.querySelector('input').disabled = !active||busy;
        });
    };
    let setBusy = function(value){
        busy = value;
        dialog.querySelectorAll('input,[data-insert-tab]').forEach(input=>input.disabled=busy);
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
    dialog = editor.openDialog({
        'title':'插入'+options.name,
        'keepOpen':true,
        'fields':[
            {'name':'url','label':options.name+'地址','type':'text','placeholder':'https://example.com/file','required':true},
            {'name':'file','label':'选择{type}（最大 {size} MB）','params':{type:options.name,size:options.size},'type':'file',
                'accept':options.accept||'','required':true},
            options.field
        ],
        'submitLabel':'插入'+options.name,
        mount(node){
            dialog = node;
            let tabs = document.createElement('div');
            tabs.className = 'insert-tabs';
            tabs.setAttribute('role','tablist');
            tabs.setAttribute('aria-label','插入方式');
            tabs.innerHTML = `<button type="button" role="tab" id="insert-url-tab" aria-controls="insert-url-panel" data-insert-tab="url">URL</button>
                <button type="button" role="tab" id="insert-file-tab" aria-controls="insert-file-panel" data-insert-tab="file">上传文件</button>`;
            dialog.querySelector('.dialog-body').prepend(tabs);
            ['url','file'].forEach(name=>{
                let field = dialog.querySelector('[name="'+name+'"]').closest('.field');
                let panel = document.createElement('div');
                panel.className = 'insert-panel';
                panel.id = 'insert-'+name+'-panel';
                panel.dataset.insertPanel = name;
                panel.setAttribute('role','tabpanel');
                panel.setAttribute('aria-labelledby','insert-'+name+'-tab');
                field.before(panel);
                panel.appendChild(field);
            });
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
                    value = mode==='url'?'file':'url';
                }else if(event.key==='Home'){
                    value = 'url';
                }else if(event.key==='End'){
                    value = 'file';
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
            dialog.querySelector('.dialog-notice').before(progress);
            setMode(mode);
        },
        onClose(){
            cancelUpload?.();
        },
        async onSubmit(values){
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
