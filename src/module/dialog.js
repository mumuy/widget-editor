import {close as closeIcon,renderIcon} from './icon.js';

export default function openDialog(editor,options){
    if(!editor.isConnected || !editor.shadowRoot){
        return;
    }
    editor.saveSelection();
    if(editor._dialog){
        editor._dialog.dismiss();
    }
    let dialog = document.createElement('dialog');
    dialog.className = 'editor-dialog';
    let titleId = 'editor-dialog-title';
    dialog.setAttribute('aria-labelledby',titleId);
    dialog.innerHTML = `<form class="dialog-panel">
        <div class="dialog-head">
            <h3 id="${titleId}"></h3>
            <button type="button" class="dialog-close" aria-label="关闭">${renderIcon(closeIcon)}</button>
        </div>
        <div class="dialog-body">
            <div class="dialog-fields"></div>
            <p class="dialog-notice" role="status" aria-live="polite"></p>
        </div>
        <div class="dialog-foot">
            <button type="button" class="btn dialog-cancel">取消</button>
            <button type="submit" class="btn btn-primary"></button>
        </div>
    </form>`;
    editor.locale.set(dialog.querySelector('h3'),options.title);
    let form = dialog.querySelector('form');
    let submit = dialog.querySelector('[type="submit"]');
    let notice = dialog.querySelector('.dialog-notice');
    dialog.message = (message,params,literal=false)=>editor.locale.set(notice,message,params,'textContent',literal);
    editor.locale.set(submit,options.submitLabel||'确定');
    let fields = options.fields || [];
    let inputs = new Map();
    fields.forEach(function(field){
        let label = document.createElement('label');
        label.className = 'field'+(field.type==='checkbox'?' field-checkbox':'');
        let caption = document.createElement('span');
        editor.locale.set(caption,field.label,field.params);
        let input = document.createElement(['select','textarea'].includes(field.type)?field.type:'input');
        input.name = field.name;
        if(field.type==='select'){
            field.options.forEach(function(option){
                let item = document.createElement('option');
                item.value = option.value;
                item.textContent = option.label;
                input.appendChild(item);
            });
        }else if(field.type!=='textarea'){
            input.type = field.type || 'text';
        }
        ['min','max','placeholder','accept'].forEach(function(name){
            if(field[name]!==undefined){
                input.setAttribute(name,field[name]);
            }
        });
        input.required = !!field.required;
        if(field.type==='file'){input.multiple = !!field.multiple;}
        if(field.type==='checkbox'){
            input.checked = !!field.value;
        }else if(field.type!=='file'){
            input.value = field.value ?? '';
        }
        inputs.set(field.name,input);
        label.append(caption,input);
        dialog.querySelector('.dialog-fields').appendChild(label);
    });
    let submitting = false;
    let finished = false;
    let current = function(){
        return !finished && editor.isConnected && dialog.isConnected && editor._dialog===dialog;
    };
    let finish = function(){
        if(finished){
            return;
        }
        finished = true;
        dialog.close();
        dialog.remove();
        options.onClose?.();
        if(editor._dialog===dialog){
            editor._dialog = null;
            if(editor.isConnected&&!editor.source){
                editor.restoreSelection();
            }
        }
    };
    dialog.dismiss = finish;
    dialog.suspend = ()=>{
        dialog.suspended = true;
        dialog.close();
    };
    dialog.resume = ()=>{
        if(!current()){return;}
        dialog.suspended = false;
        if(!dialog.open){dialog.showModal();}
    };
    dialog.querySelector('.dialog-close').onclick = finish;
    dialog.querySelector('.dialog-cancel').onclick = finish;
    dialog.addEventListener('cancel',function(event){
        event.preventDefault();
        finish();
    });
    dialog.addEventListener('close',function(){
        if(!dialog.open&&!dialog.suspended&&(options.keepOpen||!submitting)){
            finish();
        }
    });
    form.onsubmit = async function(event){
        event.preventDefault();
        if(submitting || !current() || !form.reportValidity()){
            return;
        }
        submitting = true;
        submit.disabled = true;
        form.setAttribute('aria-busy','true');
        let values = {};
        fields.forEach(function(field){
            let input = inputs.get(field.name);
            values[field.name] = field.type==='file' ? Array.from(input.files) :
                field.type==='checkbox' ? input.checked : input.value;
        });
        // 先解除模态层的焦点限制，编辑命令才能恢复到原来的选区。
        if(!options.keepOpen){
            dialog.close();
        }
        try{
            let success = await options.onSubmit(values,dialog);
            if(!current()){
                finish();
                return;
            }
            if(success===false){
                if(!dialog.open){
                    dialog.showModal();
                }
            }else{
                finish();
            }
        }catch(error){
            if(current()){
                dialog.message('操作失败，请重试');
                if(!dialog.open){
                    dialog.showModal();
                }
            }else{
                finish();
            }
        }finally{
            submitting = false;
            submit.disabled = false;
            form.removeAttribute('aria-busy');
        }
    };
    editor.shadowRoot.appendChild(dialog);
    editor._dialog = dialog;
    options.mount?.(dialog);
    editor.locale.apply(dialog);
    dialog.showModal();
    return dialog;
};
