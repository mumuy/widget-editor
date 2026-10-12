import {emoji as icon} from '../icon.js';

const emojis = [
    ['😀','开心'],['😃','大笑'],['😄','笑脸'],['😁','咧嘴笑'],['😊','微笑'],['😂','笑哭'],['🤣','哈哈大笑'],['🥰','喜欢'],
    ['😍','心动'],['😘','飞吻'],['😋','美味'],['😎','酷'],['🤩','惊喜'],['🥳','庆祝'],['🤗','拥抱'],['🤔','思考'],
    ['🙃','倒脸'],['😉','眨眼'],['😅','尴尬'],['😌','放松'],['😴','睡觉'],['😭','大哭'],['🥺','委屈'],['😤','生气'],
    ['😮','惊讶'],['😱','震惊'],['🤯','震撼'],['🤭','偷笑'],['🤫','安静'],['😷','口罩'],['🤒','发烧'],['🤧','感冒'],
    ['👍','赞'],['👎','踩'],['👏','鼓掌'],['🙏','感谢'],['💪','加油'],['👌','好的'],['✌️','胜利'],['🤝','握手'],
    ['❤️','爱心'],['💔','心碎'],['💕','两颗心'],['💯','满分'],['🔥','火热'],['🎉','礼花'],['🎁','礼物'],['🌹','玫瑰'],
    ['☀️','太阳'],['🌈','彩虹'],['⭐','星星'],['🌙','月亮'],['🍀','幸运'],['☕','咖啡'],['🎂','蛋糕'],['🚀','火箭']
];

export default {
    'name':'emoji',
    'label':'插入表情',
    'icon':icon,
    'type':'button',
    execute(editor){
        let selected = emojis[0][0];
        editor.openDialog({
            'title':'插入表情',
            'submitLabel':'插入表情',
            mount(dialog){
                dialog.classList.add('emoji-dialog');
                let grid = document.createElement('div');
                grid.className = 'emoji-grid';
                grid.setAttribute('role','group');
                grid.setAttribute('aria-label','选择表情');
                let select = function(index){
                    selected = emojis[index][0];
                    Array.from(grid.children).forEach((button,current)=>{
                        button.setAttribute('aria-pressed',String(current===index));
                        button.tabIndex = current===index?0:-1;
                    });
                };
                emojis.forEach(([value,label],index)=>{
                    let button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'emoji-button';
                    button.textContent = value;
                    button.title = label;
                    button.setAttribute('aria-label',label);
                    button.tabIndex = index===0?0:-1;
                    button.addEventListener('click',()=>{
                        select(index);
                    });
                    button.addEventListener('keydown',event=>{
                        let offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
                        let offset = offsets[event.key];
                        if(offset){
                            event.preventDefault();
                            let next = Math.max(0,Math.min(emojis.length-1,index+offset));
                            select(next);
                            grid.children[next].focus({preventScroll:true});
                        }
                    });
                    grid.appendChild(button);
                });
                select(0);
                dialog.querySelector('.dialog-body').prepend(grid);
            },
            onSubmit(){
                editor.insertHTML(selected);
                return true;
            }
        });
    }
};
