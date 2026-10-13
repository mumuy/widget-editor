import {insert as icon} from '../icon.js';
import table from './table.js';
import image from './image.js';
import video from './video.js';
import audio from './audio.js';
import attachment from './attachment.js';
import emoji from './emoji.js';
import divider from './divider.js';
import code from './code.js';

export const insertFeatures = [divider,table,image,video,attachment,audio,emoji,code];

export default {
    'name':'insert',
    'label':'插入',
    'icon':icon,
    'type':'dropdown',
    'actionMenu':true,
    'iconOnly':true,
    options(editor){
        return editor.config.list('insert').map(name=>{
            let feature = insertFeatures.find(feature=>feature.name===name);
            return feature&&editor.config.methods(name)?.length!==0?{value:name,label:feature.label.replace(/^插入/,''),icon:feature.icon,feature}:null;
        }).filter(Boolean);
    },
    execute(editor,value,event){
        editor.execute(value,null,event);
    }
};
