// 属性默认值与界面配置集中在此处；组件实例上的属性优先。
// custom 定义默认工具栏及顺序；媒体列表同时定义默认方式和允许范围。
export const attributes = {
    name: { default: '' },
    form: { default: '' },
    disabled: { default: false },
    required: { default: false },
    placeholder: { default: '在这里开始写作…', translate: true },
    height: { default: 480, min: 160, max: 2000 },
    language: { default: 'zh-CN' },
    heading: { default: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], toolbar: true },
    fontfamily: {
        default: [
            'default', 'yahei', 'simsun', 'simhei', 'kaiti', 'fangsong', 'pingfang',
            'dengxian', 'stsong', 'stkaiti', 'stxihei', 'sourceSans', 'sourceSerif'
        ], toolbar: true
    },
    fontsize: { default: [12, 14, 16, 18, 20, 24, 28, 32, 36, 48], toolbar: true },
    alignment: { default: ['left', 'center', 'right', 'justify'], toolbar: true },
    view: { default: ['source', 'fullscreen', 'preview'], toolbar: true },
    custom: {
        default: [
            'heading', 'fontFamily', 'fontSize', 'alignment', 'indentation',
            'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'color', 'backgroundColor',
            'blockquote', 'orderedList', 'unorderedList', 'link', 'format', 'formatPainter', 'insert'
        ], toolbar: true
    },
    insert: { default: ['divider', 'table', 'image', 'video', 'attachment', 'audio', 'emoji', 'code'], toolbar: true },
    image: { default: ['upload', 'url'], toolbar: true, media: true },
    video: { default: ['upload', 'url', 'iframe'], toolbar: true, media: true },
    attachment: { default: ['upload', 'url'], toolbar: true, media: true },
    audio: { default: ['upload', 'url'], toolbar: true, media: true }
};

export const observedAttributes = Object.keys(attributes);
export const toolbarAttributes = observedAttributes.filter(name => attributes[name].toolbar);
export const mediaAttributes = observedAttributes.filter(name => attributes[name].media);

function listValues(value) {
    let names = Array.isArray(value) ? value : String(value ?? '').split(',');
    return Array.from(new Set(names.map(name => String(name).trim().toLowerCase()).filter(Boolean)));
}

export default class EditorConfig {
    constructor(editor) {
        this.editor = editor;
    }
    get(name) {
        name = name.toLowerCase();
        let attribute = Object.hasOwn(attributes, name) ? attributes[name] : null;
        if (!attribute) { return null; }
        let value = this.editor.getAttribute(name);
        if (typeof attribute.default === 'boolean') {
            return this.editor.hasAttribute(name) || attribute.default;
        }
        if (typeof attribute.default === 'number') {
            let number = Number(value ?? attribute.default);
            return number >= attribute.min && number <= attribute.max ? number : attribute.default;
        }
        if (attribute.translate) {
            return value || this.editor.t(attribute.default);
        }
        return value ?? attribute.default;
    }
    list(name) {
        return listValues(this.get(name));
    }
    options(name, items) {
        if (!Object.hasOwn(attributes, name.toLowerCase())) { return items; }
        let available = new Map(items.map(item => [String(item.value).toLowerCase(), item]));
        return this.list(name).map(value => available.get(value)).filter(Boolean);
    }
    methods(name) {
        if (!mediaAttributes.includes(name)) { return null; }
        let allowed = listValues(attributes[name].default);
        return this.list(name).filter(method => allowed.includes(method));
    }
}
