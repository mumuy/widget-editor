import {fileType} from './file.js';
import {safeURL} from './sanitize.js';

// 图片、视频、音频和附件共用读取及弹窗状态，各模块只定义文件类型和插入内容。
export default function openUpload(editor,options){
    let dialog = editor.openDialog({
        'title':'上传'+options.name,
        'fields':[
            {'name':'file','label':'选择'+options.name+'（最大 '+options.size+' MB）','type':'file',
                'accept':options.accept||'','required':true},
            options.field
        ],
        'submitLabel':'插入'+options.name,
        async onSubmit(values){
            let file = values.file;
            let type = file&&fileType(file,options.types);
            if(!type){
                editor.notify(options.error||'请选择文件');
                return false;
            }
            if(file.size>options.size*1024*1024){
                editor.notify(options.name+'大小不能超过 '+options.size+' MB');
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
                if(!editor.isConnected||editor.source||editor._dialog!==dialog||!dialog.isConnected){
                    return true;
                }
                // 使用确定的 MIME；附件统一为二进制下载，不把文件当作网页打开。
                source = String(source).replace(/^data:[^,]*;base64,/, 'data:'+type+';base64,');
                if(!safeURL(source,options.kind)){
                    editor.notify(options.name+'内容无法读取');
                    return false;
                }
                editor.insertHTML(options.html(source,file,values));
                return true;
            }catch(error){
                if(!editor.isConnected||editor.source||editor._dialog!==dialog||!dialog.isConnected){
                    return true;
                }
                editor.notify(options.name+'读取失败，请重新选择文件');
                return false;
            }
        }
    });
    return dialog;
}
