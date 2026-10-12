import {link as icon} from '../icon.js';
import {safeURL,escapeHTML} from '../method/sanitize.js';

export default {
    'name':'link',
    'icon':icon,
    'label':'超链接',
    'type':'button',
    execute(editor){
        let range = editor.getRange();
        let $element = editor.selectedElement();
        let $link = $element ? $element.closest('a:not([download])') : null;
        if($link && !editor.content.contains($link)){
            $link = null;
        }
        let editing = !!($link && (!range || range.collapsed));
        let text = editing ? $link.textContent : (range ? range.toString() : '');
        editor.openDialog({
            'title':editing ? '编辑超链接' : '超链接',
            'fields':[
                {'name':'url','label':'链接地址','type':'text','value':$link ? $link.getAttribute('href') : '',
                    'required':true,'placeholder':'https://example.com'},
                {'name':'text','label':'显示文字','type':'text','value':text,'placeholder':'留空时使用链接地址'}
            ],
            'submitLabel':'确定',
            onSubmit(values,dialog){
                let url = safeURL(String(values.url || '').trim());
                if(!url){
                    dialog.message('请输入有效的链接地址');
                    return false;
                }
                let label = String(values.text || '').trim() || url;
                if(editing && $link.isConnected){
                    editor.transaction(()=>{
                        $link.setAttribute('href',url);
                        if(label!==text){
                            $link.textContent = label;
                        }
                    });
                }else if(range && !range.collapsed && label===text){
                    editor.command('createLink',url);
                }else{
                    editor.insertHTML('<a href="'+escapeHTML(url)+'">'+escapeHTML(label)+'</a>');
                }
                return true;
            }
        });
    },
    active(editor){
        let $element = editor.selectedElement();
        return !!($element && $element.closest('a:not([download])'));
    }
};
