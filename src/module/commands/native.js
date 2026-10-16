// 浏览器原生指令只在此调用；选区、历史和输出由编辑事务统一处理。
export default function nativeCommand(name,value=null,css){
    if(css!==undefined){document.execCommand('styleWithCSS',false,css);}
    return document.execCommand(name,false,value);
}
