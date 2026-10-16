// 将浏览器序列化的 RGB 颜色转为 HEX，保留透明度。
export default function hexColor(value){
    let match = value.match(/^rgba?\(([\d\s.,%]+)\)$/i);
    if(!match){
        return value;
    }
    let parts = match[1].split(',').map(part=>part.trim());
    if((parts.length!==3&&parts.length!==4)||!parts.every(part=>/^\d*\.?\d+%?$/.test(part))){
        return value;
    }
    let byte = number=>Math.round(Math.max(0,Math.min(255,number))).toString(16).padStart(2,'0');
    let result = '#'+parts.slice(0,3).map(part=>{
        return byte(parseFloat(part)*(part.endsWith('%')?255/100:1));
    }).join('');
    if(parts.length===4){
        let alpha = Math.max(0,Math.min(1,parseFloat(parts[3])/(parts[3].endsWith('%')?100:1)));
        if(alpha<1){
            result += byte(alpha*255);
        }
    }
    return result;
}

export function readColor(editor,property='color'){
    let background = property==='background-color';
    for(let element=editor.selectedElement();element&&editor.content.contains(element);element=element.parentElement){
        // 背景不继承，沿祖先查找实际样式，忽略表格选格等临时背景。
        if(background&&!element.style.getPropertyValue(property)){continue;}
        let value = hexColor(window.getComputedStyle(element).getPropertyValue(property));
        if(/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)&&(value.length===7||value.slice(-2)!=='00')){
            return value.slice(0,7).toLowerCase();
        }
        if(!background){break;}
    }
    return background?'transparent':'#343b48';
}
