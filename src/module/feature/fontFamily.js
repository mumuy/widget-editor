import {fontFamilies} from '../commands/style.js';

export default {
    'name':'fontFamily',
    'label':'字体',
    'type':'dropdown',
    options(editor){
        return editor.config.options('fontFamily',fontFamilies);
    },
    execute(editor,value){
        editor.command('fontFamily',value);
    },
    value(editor){
        let element = editor.selectedElement();
        let font = element?window.getComputedStyle(element).fontFamily:'';
        let first = value=>value.split(',')[0].replace(/["']/g,'').trim().toLowerCase();
        return fontFamilies.find(option=>first(option.font)===first(font))?.value||'default';
    }
};
