import {audio as icon} from '../icon.js';
import {audioTypes} from '../method/file.js';
import openMedia from '../method/media.js';

export default {
    'name':'audio',
    'icon':icon,
    'label':'插入音频',
    'type':'button',
    execute(editor,mode){
        return openMedia(editor,{
            'name':'音频',
            'kind':'audio',
            'size':20,
            'types':audioTypes,
            'error':'请选择 MP3、WAV、Ogg、M4A、AAC、FLAC 或 WebM 音频',
            'field':{'name':'title','label':'音频描述','type':'text','placeholder':'留空时使用文件名'},
        },mode);
    }
};
