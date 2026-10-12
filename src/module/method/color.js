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
