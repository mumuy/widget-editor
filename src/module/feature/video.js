import {video as icon} from '../icon.js';
import sanitizeHTML,{escapeHTML} from '../method/sanitize.js';
import {videoTypes} from '../method/file.js';
import openUpload from '../method/upload.js';

export default {
    'name':'video',
    'icon':icon,
    'label':'插入视频',
    'type':'button',
    execute(editor){
        openUpload(editor,{
            'name':'视频',
            'kind':'video',
            'size':50,
            'types':videoTypes,
            'accept':'video/mp4,video/webm,video/ogg,.m4v,.ogv',
            'error':'请选择 MP4、WebM 或 Ogg 视频',
            'field':{'name':'title','label':'视频描述','type':'text','placeholder':'留空时使用文件名'},
            iframe(value,values){
                let template = document.createElement('template');
                template.innerHTML = value;
                let frames = template.content.querySelectorAll('iframe');
                if(frames.length!==1){return '';}
                let frame = frames[0];
                if(values.title.trim()){frame.setAttribute('title',values.title.trim());}
                return sanitizeHTML(frame.outerHTML);
            },
            html(source,values){
                let title = escapeHTML(String(values.title||'').trim()||values.name);
                return '<video src="'+escapeHTML(source)+'" title="'+title+'" controls preload="metadata" playsinline></video><p><br></p>';
            }
        });
    }
};
