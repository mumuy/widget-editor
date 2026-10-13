const methods = {
    image:['upload','url'],
    video:['upload','url','iframe'],
    audio:['upload','url'],
    attachment:['upload','url']
};

export const mediaAttributes = Object.keys(methods);

export default function insertMethods(editor,name){
    let available = Object.hasOwn(methods,name)?methods[name]:null;
    if(!available){return null;}
    let value = editor.getAttribute(name);
    let names = value===null?available:value.split(',').map(name=>name.trim().toLowerCase());
    return Array.from(new Set(names)).filter(name=>available.includes(name));
}
