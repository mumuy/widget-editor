import clearFormat from '../method/clearFormat.js';
import {readColor} from '../method/color.js';
import nativeCommand from './native.js';

export const fontFamilies = [
    {'value':'default','label':'默认字体','font':'Arial, Helvetica, "Microsoft Yahei", sans-serif'},
    {'value':'yahei','label':'微软雅黑','font':'"Microsoft Yahei", "PingFang SC", sans-serif'},
    {'value':'simsun','label':'宋体','font':'SimSun, "Songti SC", serif'},
    {'value':'simhei','label':'黑体','font':'SimHei, "Heiti SC", sans-serif'},
    {'value':'kaiti','label':'楷体','font':'KaiTi, STKaiti, serif'},
    {'value':'fangsong','label':'仿宋','font':'FangSong, STFangsong, serif'},
    {'value':'pingfang','label':'苹方','font':'"PingFang SC", "Microsoft Yahei", sans-serif'},
    {'value':'dengxian','label':'等线','font':'DengXian, "Microsoft Yahei", sans-serif'},
    {'value':'stsong','label':'华文宋体','font':'STSong, SimSun, serif'},
    {'value':'stkaiti','label':'华文楷体','font':'STKaiti, KaiTi, serif'},
    {'value':'stxihei','label':'华文细黑','font':'STXihei, "PingFang SC", sans-serif'},
    {'value':'sourceSans','label':'思源黑体','font':'"Source Han Sans SC", "Noto Sans CJK SC", sans-serif'},
    {'value':'sourceSerif','label':'思源宋体','font':'"Source Han Serif SC", "Noto Serif CJK SC", serif'}
];

export const fontSizes = [12,14,16,18,20,24,28,32,36,48];

export function fontFamily(editor,value){
    let option = editor.config.options('fontFamily',fontFamilies).find(option=>option.value.toLowerCase()===String(value).toLowerCase());
    if(!option){return false;}
    editor.applyStyle({'font-family':option.font});
}

export function fontSize(editor,value){
    if(!fontSizes.includes(Number(value))||!editor.config.list('fontsize').includes(String(value))){return false;}
    editor.applyStyle({'font-size':value+'px'});
}

export function color(editor,value,property='color'){
    value = String(value).toLowerCase();
    if(!/^#[0-9a-f]{6}$/.test(value)&&!(property==='background-color'&&value==='transparent')){return false;}
    editor.applyStyle({[property]:value});
}

export function format(editor){
    editor.cancelPainter();
    editor.transaction(()=>{
        editor.selection.select(clearFormat(editor.content,editor.getRange()));
        nativeCommand('removeFormat');
    });
}

export function formatPainter(editor){
    if(editor.painter){editor.cancelPainter();return;}
    let element = editor.selectedElement();
    if(!element){return false;}
    let style = window.getComputedStyle(element);
    let decorations = style.textDecorationLine.split(' ');
    for(let parent=element.parentElement;parent&&editor.content.contains(parent);parent=parent.parentElement){
        decorations.push(...window.getComputedStyle(parent).textDecorationLine.split(' '));
    }
    editor.setPainter({
        'font-family':style.fontFamily,
        'font-weight':style.fontWeight,
        'font-style':style.fontStyle,
        'font-size':style.fontSize,
        'color':style.color,
        'background-color':readColor(editor,'background-color'),
        'text-decoration':['underline','line-through'].filter(name=>decorations.includes(name)).join(' ')||'none'
    });
}
