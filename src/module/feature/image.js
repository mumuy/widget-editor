import {image as icon} from '../icon.js';
import {escapeHTML} from '../method/sanitize.js';

export default {
    'name':'image',
    'icon':icon,
    'label':'上传图片',
    'type':'button',
    execute(editor){
        let dialog = editor.openDialog({
            'title':'上传图片',
            'fields':[
                {'name':'file','label':'选择图片（最大 5 MB）','type':'file',
                    'accept':'image/png,image/jpeg,image/gif,image/webp','required':true},
                {'name':'alt','label':'图片描述','type':'text','placeholder':'图片的文字说明'}
            ],
            'submitLabel':'插入图片',
            async onSubmit(values){
                let file = values.file;
                if(!file || !/^image\/(png|jpeg|gif|webp)$/.test(file.type)){
                    editor.notify('请选择 PNG、JPEG、GIF 或 WebP 图片');
                    return false;
                }
                if(file.size>5*1024*1024){
                    editor.notify('图片大小不能超过 5 MB');
                    return false;
                }
                try{
                    let source = await new Promise((resolve,reject)=>{
                        let reader = new FileReader();
                        reader.onload = ()=>resolve(reader.result);
                        reader.onerror = ()=>reject(new Error('read'));
                        reader.onabort = ()=>reject(new Error('abort'));
                        reader.readAsDataURL(file);
                    });
                    if(!editor.isConnected || editor._dialog!==dialog || !dialog.isConnected){
                        return true;
                    }
                    if(!/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(source)){
                        editor.notify('图片内容无法读取');
                        return false;
                    }
                    editor.insertHTML('<img src="'+source+'" alt="'+escapeHTML(String(values.alt || ''))+'">');
                    return true;
                }catch(error){
                    if(!editor.isConnected || editor._dialog!==dialog || !dialog.isConnected){
                        return true;
                    }
                    editor.notify('图片读取失败，请重新选择图片');
                    return false;
                }
            }
        });
    }
};
