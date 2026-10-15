import {image as icon} from '../icon.js';
import sanitizeHTML,{escapeHTML} from '../method/sanitize.js';
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
            html(source,values){
                let html = '<img src="'+escapeHTML(source)+'" alt="'+escapeHTML(String(values.alt||''))+'">';
                return values.batch?'<p>'+html+'</p>':html;
            },
            insertBatch(html){
                editor.history.record();
                editor.transaction(()=>{
                    document.execCommand('insertHTML',false,sanitizeHTML(html));
                    // 将插入点后原有的文字移到下一段，保证图片段落独立。
                    document.execCommand('insertParagraph',false);
                    let paragraph = editor.selectedElement().closest('p');
                    if(paragraph&&editor.blocks.empty(paragraph)){
                        paragraph.setAttribute('data-block-boundary','');
                    }
                });
            }
        },mode);
    }
};
