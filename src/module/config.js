// 属性默认值与界面配置集中在此处；组件实例上的属性优先。
// custom 定义默认工具栏及顺序；媒体列表同时定义默认方式和允许范围。
export const attributes = {
    placeholder:{default:'在这里开始写作…',translate:true},
    height:{default:420,min:160,max:2000},
    language:{default:'zh-CN'},
    custom:{default:[
        'heading','fontFamily','fontSize','alignment','indentation',
        'bold','italic','underline','strikethrough','superscript','subscript','color',
        'blockquote','orderedList','unorderedList','link','format','formatPainter','insert'
    ],toolbar:true},
    insert:{default:['divider','table','image','video','attachment','audio','emoji','code'],toolbar:true},
    image:{default:['upload','url'],toolbar:true,media:true},
    video:{default:['upload','url','iframe'],toolbar:true,media:true},
    attachment:{default:['upload','url'],toolbar:true,media:true},
    audio:{default:['upload','url'],toolbar:true,media:true}
};

export const observedAttributes = Object.keys(attributes);
export const toolbarAttributes = observedAttributes.filter(name=>attributes[name].toolbar);
export const mediaAttributes = observedAttributes.filter(name=>attributes[name].media);

// 下拉框允许的项目及显示顺序；空数组隐藏对应控件。
export const dropdownOptions = {
    heading:['p','h1','h2','h3','h4','h5','h6'],
    fontFamily:[
        'default','yahei','simsun','simhei','kaiti','fangsong','pingfang',
        'dengxian','stsong','stkaiti','stxihei','sourceSans','sourceSerif'
    ],
    fontSize:[12,14,16,18,20,24,28,32,36,48],
    alignment:['left','center','right','justify']
};

function listValues(value){
    let names = Array.isArray(value)?value:String(value??'').split(',');
    return Array.from(new Set(names.map(name=>String(name).trim().toLowerCase()).filter(Boolean)));
}

export default class EditorConfig {
    constructor(editor){
        this.editor = editor;
    }
    get(name){
        let attribute = Object.hasOwn(attributes,name)?attributes[name]:null;
        if(!attribute){return null;}
        let value = this.editor.getAttribute(name);
        if(typeof attribute.default==='number'){
            let number = Number(value??attribute.default);
            return number>=attribute.min&&number<=attribute.max?number:attribute.default;
        }
        if(attribute.translate){
            return value||this.editor.t(attribute.default);
        }
        return value??attribute.default;
    }
    list(name){
        return listValues(this.get(name));
    }
    options(name,items){
        if(!Object.hasOwn(dropdownOptions,name)){return items;}
        let available = new Map(items.map(item=>[String(item.value).toLowerCase(),item]));
        return listValues(dropdownOptions[name]).map(value=>available.get(value)).filter(Boolean);
    }
    methods(name){
        if(!mediaAttributes.includes(name)){return null;}
        return this.list(name).filter(method=>attributes[name].default.includes(method));
    }
}
