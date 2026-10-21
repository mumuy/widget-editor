// 普通菜单与代码语言菜单共用视口边界和上下展开判断。
export default function positionMenu(menu,button,matchWidth=false){
    let rect = button.getBoundingClientRect();
    let width = document.documentElement.clientWidth;
    let below = document.documentElement.clientHeight-rect.bottom-8;
    let above = rect.top-8;
    let upwards = below<Math.min(menu.scrollHeight,240)&&above>below;
    if(matchWidth){menu.style.width = rect.width+'px';}
    menu.style.maxHeight = Math.max(40,Math.min(280,upwards?above:below))+'px';
    let size = menu.getBoundingClientRect();
    menu.style.left = Math.max(8,Math.min(rect.left,width-size.width-8))+'px';
    menu.style.top = (upwards?rect.top-size.height-4:rect.bottom+4)+'px';
}
