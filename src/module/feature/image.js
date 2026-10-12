import {image as icon} from '../icon.js';
import {escapeHTML} from '../method/sanitize.js';
import {imageTypes} from '../method/file.js';
import openUpload from '../method/upload.js';

export default {
    'name':'image',
    'icon':icon,
    'label':'上传图片',
    'type':'button',
    execute(editor){
        openUpload(editor,{
            'name':'图片',
            'kind':'image',
            'size':5,
            'types':imageTypes,
            'accept':'image/png,image/jpeg,image/gif,image/webp',
            'error':'请选择 PNG、JPEG、GIF 或 WebP 图片',
            'field':{'name':'alt','label':'图片描述','type':'text','placeholder':'图片的文字说明'},
            html(source,file,values){
                return '<img src="'+source+'" alt="'+escapeHTML(String(values.alt||''))+'">';
            }
        });
    }
};
