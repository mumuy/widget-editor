import {insert as icon} from '../icon.js';
import table from './table.js';
import image from './image.js';
import video from './video.js';
import audio from './audio.js';
import attachment from './attachment.js';
import emoji from './emoji.js';
import divider from './divider.js';
import code from './code.js';
import insertMethods from '../method/insertMethods.js';

export const insertFeatures = [table,image,video,audio,attachment,emoji,divider,code];

export default {
    'name':'insert',
    'label':'插入',
    'icon':icon,
    'type':'dropdown',
    'actionMenu':true,
    'iconOnly':true,
    options(editor){
        return Array.from(new Set((editor.getAttribute('insert')||'').split(',').map(name=>name.trim().toLowerCase()))).map(name=>{
            let feature = insertFeatures.find(feature=>feature.name===name);
            return feature&&insertMethods(editor,name)?.length!==0?{value:name,label:feature.label.replace(/^插入/,''),icon:feature.icon,feature}:null;
        }).filter(Boolean);
    },
    bind(editor){
        insertFeatures.forEach(feature=>feature.bind?.(editor));
    },
    execute(editor,value,event){
        if(editor.features.find(feature=>feature.name==='insert').options.some(option=>option.value===value)){
            editor.execute(value,null,event);
        }
    }
};
