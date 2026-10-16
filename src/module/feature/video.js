import {frameHTML} from '../commands/media.js';
import {video as icon} from '../icon.js';
import {videoTypes} from '../method/file.js';
import openMedia from '../method/media.js';

export default {
    'name':'video',
    'icon':icon,
    'label':'插入视频',
    'type':'button',
    execute(editor,mode){
        return openMedia(editor,{
            'name':'视频',
            'kind':'video',
            'size':50,
            'types':videoTypes,
            'accept':'video/mp4,video/webm,video/ogg,.m4v,.ogv',
            'error':'请选择 MP4、WebM 或 Ogg 视频',
            'field':{'name':'title','label':'视频描述','type':'text','placeholder':'留空时使用文件名'},
            iframe:frameHTML,
        },mode);
    }
};
