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
        // 下划线会跨子节点绘制，合并祖先节点上的文字装饰。
        let decorations = style.textDecorationLine.split(' ');
        for(let $parent=$element.parentElement;$parent&&editor.content.contains($parent);$parent=$parent.parentElement){
            decorations.push(...window.getComputedStyle($parent).textDecorationLine.split(' '));
        }
        editor.setPainter({
            'font-family':style.fontFamily,
            'font-weight':style.fontWeight,
            'font-style':style.fontStyle,
            'font-size':style.fontSize,
            'color':style.color,
            'background-color':editor.tools.get('backgroundColor').value(editor),
            'text-decoration':['underline','line-through'].filter(name=>decorations.includes(name)).join(' ')||'none'
        });
    },
    active(editor){
        return !!editor.painter;
    }
};
