import {paragraph,heading1,heading2,heading3,heading4,heading5,heading6} from '../icon.js';

export default {
    'name':'heading',
    'label':'标题',
    'type':'dropdown',
    options(editor){
        return editor.config.options('heading',[
            {'value':'p','label':'正文','icon':paragraph},
            {'value':'h1','label':'标题 1','icon':heading1},
            {'value':'h2','label':'标题 2','icon':heading2},
            {'value':'h3','label':'标题 3','icon':heading3},
            {'value':'h4','label':'标题 4','icon':heading4},
            {'value':'h5','label':'标题 5','icon':heading5},
            {'value':'h6','label':'标题 6','icon':heading6}
        ]);
    },
    execute(editor,value){
        editor.command('heading',value);
    },
    value(editor){
        let $element = editor.selectedElement();
        while($element && $element!==editor.content){
            let name = $element.tagName.toLowerCase();
            if(/^(p|h[1-6])$/.test(name)){
                return name;
            }
            $element = $element.parentElement;
        }
        return 'p';
    }
};
