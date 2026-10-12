import {fontFamily as icon} from '../icon.js';

const options = [
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

export default {
    'name':'fontFamily',
    'icon':icon,
    'label':'字体',
    'type':'dropdown',
    'options':options,
    execute(editor,value){
        let option = options.find(option=>option.value===value);
        if(option){
            editor.applyStyle({'font-family':option.font});
        }
    },
    value(editor){
        let element = editor.selectedElement();
        let font = element?window.getComputedStyle(element).fontFamily:'';
        let first = value=>value.split(',')[0].replace(/["']/g,'').trim().toLowerCase();
        return options.find(option=>first(option.font)===first(font))?.value||'default';
    }
};
