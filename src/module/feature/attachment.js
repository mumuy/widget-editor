import {attachment as icon} from '../icon.js';
import {escapeHTML,safeURL} from '../method/sanitize.js';
import {fileName} from '../method/file.js';
import openUpload from '../method/upload.js';

export default {
    'name':'attachment',
    'icon':icon,
    'label':'插入附件',
    'type':'button',
    bind(editor){
        editor.content.addEventListener('click',event=>{
            let link = event.target.closest('a[download][href]');
            let href = link&&safeURL(link.getAttribute('href'),'attachment');
            if(!href){
                return;
            }
            event.preventDefault();
            // 可编辑区域不会执行普通链接跳转，用独立节点触发下载。
            let download = document.createElement('a');
            download.href = href;
            download.download = fileName(link.getAttribute('download'));
            download.target = '_blank';
            download.rel = 'noopener noreferrer';
            download.hidden = true;
            editor.shadowRoot.appendChild(download);
            download.click();
            download.remove();
        });
    },
    execute(editor){
        openUpload(editor,{
            'name':'附件',
            'kind':'attachment',
            'size':20,
            'field':{'name':'text','label':'显示文字','type':'text','placeholder':'留空时使用文件名'},
            html(source,values){
                let name = escapeHTML(fileName(values.name));
                let text = escapeHTML(String(values.text||'').trim()||values.name);
                return '<a href="'+escapeHTML(source)+'" download="'+name+'">'+text+'</a>';
            }
        });
    }
};
