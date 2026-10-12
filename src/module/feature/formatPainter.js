import {formatPainter as icon} from '../icon.js';

export default {
    'name':'formatPainter',
    'icon':icon,
    'label':'格式刷',
    'type':'button',
    execute(editor){
        if(editor.painter){
            editor.cancelPainter();
            return;
        }
        let $element = editor.selectedElement();
        if(!$element){
            return;
        }
        let style = window.getComputedStyle($element);
        editor.setPainter({
            'font-family':style.fontFamily,
            'font-weight':style.fontWeight,
            'font-style':style.fontStyle,
            'font-size':style.fontSize,
            'color':style.color,
            'text-decoration':style.textDecorationLine
        });
        editor.notify('已复制格式，请选中需要应用格式的文字');
    },
    active(editor){
        return !!editor.painter;
    }
};
