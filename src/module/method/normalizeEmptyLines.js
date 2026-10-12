import hexColor from './color.js';

const emptyTags = new Set('BR SPAN STRONG B EM I U'.split(' '));
const styleNames = 'color background-color font-size font-family font-weight font-style text-decoration text-align'.split(' ');

export default function normalizeEmptyLines(content){
    content.querySelectorAll('p').forEach(paragraph=>{
        if(paragraph.textContent.trim()||Array.from(paragraph.querySelectorAll('*')).some(node=>!emptyTags.has(node.tagName))){
            return;
        }
        let breaks = Array.from(paragraph.querySelectorAll('br'));
        if(!breaks.length){
            breaks.push(document.createElement('br'));
        }
        breaks.forEach(node=>{
            let ancestors = [node];
            for(let parent=node.parentElement;parent&&paragraph.contains(parent);parent=parent.parentElement){
                ancestors.unshift(parent);
            }
            if(ancestors[0]!==paragraph){
                ancestors.unshift(paragraph);
            }
            let styles = {};
            ancestors.forEach(parent=>styleNames.forEach(name=>{
                let value = name==='text-decoration'?(parent.style.textDecorationLine||parent.style.getPropertyValue(name)):parent.style.getPropertyValue(name);
                if(value){
                    styles[name] = name==='color'||name==='background-color'?hexColor(value):value;
                }
            }));
            if(Object.keys(styles).length){
                node.setAttribute('style',Object.keys(styles).map(name=>name+': '+styles[name]+';').join(' '));
            }
        });
        paragraph.replaceWith(...breaks);
    });
}
