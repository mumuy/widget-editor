import {fontSizes} from '../commands/style.js';

export default {
    'name':'fontSize',
    'label':'文字大小',
    'type':'dropdown',
    options(editor){
        return editor.config.options('fontSize',fontSizes.map(value=>{
            return {'value':String(value),'label':value+' px'};
        }));
    },
    execute(editor,value){
        editor.command('fontSize',value);
    },
    value(editor){
        let $element = editor.selectedElement();
        // 上下标按正文的字号显示，避免浏览器缩小后的字号出现小数。
        for(let $parent=$element;$parent&&$parent!==editor.content;$parent=$parent.parentElement){
            if($parent.style.fontSize){
                break;
            }
            if($parent.matches('sup,sub')){
                $element = $parent.parentElement;
            }
        }
        return $element ? String(parseFloat(window.getComputedStyle($element).fontSize)) : '16';
    },
    display(value){
        return value+' px';
    }
};
