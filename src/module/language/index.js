import english from './en-US.js';
import traditional from './zh-HK.js';

const languages = {'en-US':english,'zh-HK':traditional};
const aliases = {'zh':'zh-CN','zh-cn':'zh-CN','zh-hans':'zh-CN','zh-hk':'zh-HK','zh-tw':'zh-HK','zh-hant':'zh-HK','en':'en-US','en-us':'en-US','en-gb':'en-US'};

// 简体中文原文作为词条；只更新界面文字，不重新创建控件或编辑内容。
export default class EditorLanguage {
    constructor(editor){
        this.editor = editor;
        this.records = new WeakMap();
    }
    get name(){
        let name = (this.editor.getAttribute('language')||'').trim().toLowerCase();
        return Object.hasOwn(aliases,name)?aliases[name]:'zh-CN';
    }
    text(key,params={}){
        let messages = languages[this.name]||{};
        let translate = value=>Object.hasOwn(messages,value)?messages[value]:String(value);
        return translate(key).replace(/\{(\w+)\}/g,(match,name)=>{
            return Object.hasOwn(params,name)?translate(params[name]):match;
        });
    }
    set(element,key,params={},attribute='textContent',literal=false){
        let records = this.records.get(element)||{};
        records[attribute] = {key,params,literal};
        this.records.set(element,records);
        this.update(element,attribute);
    }
    update(node,attribute){
        let records = this.records.get(node)||{};
        let record = records[attribute];
        let value = attribute==='data'||attribute==='textContent'?node[attribute]:node.getAttribute(attribute);
        if(!record||value!==record.last&&record.last!==undefined){
            if(!Object.hasOwn(english,value)){
                delete records[attribute];
                return;
            }
            record = records[attribute] = {key:value,params:{}};
        }
        let text = record.literal?record.key:this.text(record.key,record.params);
        if(text!==value){
            if(attribute==='data'||attribute==='textContent'){
                node[attribute] = text;
            }else{
                node.setAttribute(attribute,text);
            }
        }
        record.last = text;
        this.records.set(node,records);
    }
    apply(root,deep=true){
        if(!root){
            return;
        }
        if(deep){
            root.lang = this.name;
        }
        let translate = node=>{
            if(node.nodeType===Node.TEXT_NODE){
                if(!this.records.get(node.parentNode)?.textContent){
                    this.update(node,'data');
                }
            }else{
                if(this.records.get(node)?.textContent){
                    this.update(node,'textContent');
                }
                ['aria-label','title','placeholder'].forEach(attribute=>{
                    if(node.hasAttribute(attribute)){
                        this.update(node,attribute);
                    }
                });
            }
        };
        translate(root);
        if(deep){
            let walker = document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
            while(walker.nextNode()){
                translate(walker.currentNode);
            }
        }
    }
}
