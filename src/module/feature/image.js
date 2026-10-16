import {image as icon} from '../icon.js';
import {imageTypes} from '../method/file.js';
import openMedia from '../method/media.js';

export default {
    'name':'image',
    'icon':icon,
    'label':'插入图片',
    'type':'button',
    execute(editor,mode){
        return openMedia(editor,{
            'name':'图片',
            'kind':'image',
            'size':5,
            'types':imageTypes,
            'accept':'image/png,image/jpeg,image/gif,image/webp',
            'error':'请选择 PNG、JPEG、GIF 或 WebP 图片',
            'field':{'name':'alt','label':'图片描述','type':'text','placeholder':'图片的文字说明'},
        },mode);
    }
};
