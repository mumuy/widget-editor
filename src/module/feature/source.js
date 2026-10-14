import {source as icon} from '../icon.js';

export default {
    'name':'source',
    'icon':icon,
    'label':'源代码',
    'type':'button',
    view:true,
    bind(editor){
        editor.sourceButton.addEventListener('pointerdown',event=>{
            editor.saveSelection();
            event.preventDefault();
        });
        editor.sourceButton.addEventListener('click',()=>editor.execute('source'));
    },
    execute(editor){
        editor.toggleSource();
    },
    active(editor){
        return editor.source;
    }
};
