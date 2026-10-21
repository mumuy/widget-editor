export const imageTypes = {
    'image/png':['png'],
    'image/jpeg':['jpg','jpeg'],
    'image/gif':['gif'],
    'image/webp':['webp']
};
export const videoTypes = {
    'video/mp4':['mp4','m4v'],
    'video/webm':['webm'],
    'video/ogg':['ogv','ogg']
};
export const audioTypes = {
    'audio/mpeg':['mp3'],
    'audio/wav':['wav'],
    'audio/ogg':['ogg','oga','opus'],
    'audio/mp4':['m4a','mp4'],
    'audio/aac':['aac'],
    'audio/flac':['flac'],
    'audio/webm':['webm']
};
const aliases = {
    'video/x-m4v':'video/mp4',
    'audio/mp3':'audio/mpeg',
    'audio/x-wav':'audio/wav',
    'audio/wave':'audio/wav',
    'audio/x-m4a':'audio/mp4',
    'audio/x-flac':'audio/flac'
};

export function fileAccept(types){
    return Object.entries(types||{}).flatMap(([type,extensions])=>[
        type,...extensions.map(extension=>'.'+extension)
    ]).join(',');
}

export function fileType(file,types){
    if(!types){
        return 'application/octet-stream';
    }
    let type = file.type.toLowerCase();
    type = aliases[type]||type;
    if(types[type]){
        return type;
    }
    if(type&&type!=='application/octet-stream'){
        return '';
    }
    let extension = file.name.split('.').pop().toLowerCase();
    return Object.keys(types).find(type=>types[type].includes(extension))||'';
}

export function safeDataURL(value,kind){
    let match = /^data:([a-z\d.+/-]+);base64,([a-z\d+/]*={0,2})$/i.exec(value);
    if(!match){
        return false;
    }
    let type = match[1].toLowerCase();
    if(kind==='attachment'){
        return type==='application/octet-stream';
    }
    let types = {image:imageTypes,video:videoTypes,audio:audioTypes}[kind];
    return !!(match[2]&&types?.[aliases[type]||type]);
}

export function fileName(value){
    return String(value||'').replace(/[\u0000-\u001f\u007f/\\]/g,'').trim().slice(0,255)||'附件';
}

export function urlFileName(value,fallback){
    try{
        let url = new URL(value,document.baseURI);
        let name = /^https?:$/.test(url.protocol)?url.pathname.split('/').pop():'';
        return name?fileName(decodeURIComponent(name)):fallback;
    }catch(error){
        return fallback;
    }
}
