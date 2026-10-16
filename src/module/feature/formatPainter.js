import {formatPainter as icon} from '../icon.js';

export default {
    'name':'formatPainter',
    'icon':icon,
    'label':'格式刷',
    'type':'button',
    execute(editor){
        editor.command('formatPainter');
    },
    active(editor){
        return !!editor.painter;
    }
};
