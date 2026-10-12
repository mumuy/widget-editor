import {video as icon} from '../icon.js';
import {escapeHTML} from '../method/sanitize.js';
import {videoTypes} from '../method/file.js';
import openUpload from '../method/upload.js';

export default {
    'name':'video',
    'icon':icon,
    'label':'上传视频',
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
            html(source,file,values){
                let title = escapeHTML(String(values.title||'').trim()||file.name);
                return '<video src="'+source+'" title="'+title+'" controls preload="metadata" playsinline></video><p><br></p>';
            }
        });
    }
};
