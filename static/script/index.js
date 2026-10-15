(function(){
    let $editor = document.querySelector('#editor');
    let resources = new Map();

    document.querySelector('.gotop').addEventListener('click',function(event){
        event.preventDefault();
        window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });

    // 参数、方法、事件共用标签页切换与键盘导航。
    document.querySelectorAll('[data-doc-tabs]').forEach(function(group){
        let list = group.querySelector('[role="tablist"]');
        let tabs = Array.from(list.querySelectorAll('[role="tab"]'));
        let activate = function(tab,focus=false){
            tabs.forEach(function(button){
                let active = button===tab;
                button.setAttribute('aria-selected',String(active));
                button.tabIndex = active?0:-1;
                let panel = document.getElementById(button.getAttribute('aria-controls'));
                panel.hidden = !active;
                panel.inert = !active;
            });
            if(focus){tab.focus({preventScroll:true});}
            let rect = tab.getBoundingClientRect();
            let bounds = list.getBoundingClientRect();
            if(rect.left<bounds.left){list.scrollLeft += rect.left-bounds.left;}
            else if(rect.right>bounds.right){list.scrollLeft += rect.right-bounds.right;}
        };
        list.addEventListener('click',function(event){
            let tab = event.target.closest('[role="tab"]');
            if(tab){activate(tab);}
        });
        list.addEventListener('keydown',function(event){
            let index = tabs.indexOf(event.target);
            if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){return;}
            event.preventDefault();
            let next = event.key==='Home'?0:event.key==='End'?tabs.length-1:
                (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
            activate(tabs[next],true);
        });
    });

    // 演示页只在本地读取文件，正式使用时替换成自己的上传服务。
    let readFiles = async function(files,type,onProgress=()=>{}){
        let total = files.reduce((sum,file)=>sum+file.size,0);
        let loaded = 0;
        let sources = [];
        for(let file of files){
            sources.push(await new Promise((resolve,reject)=>{
                let reader = new FileReader();
                reader.onprogress = event=>{
                    if(event.lengthComputable){onProgress(total?(loaded+event.loaded)/total*100:100);}
                };
                reader.onload = ()=>{
                    let source = String(reader.result);
                    if(type==='attachment'){
                        source = source.replace(/^data:[^,]*;base64,/, 'data:application/octet-stream;base64,');
                    }else if(type==='audio'&&file.type==='audio/x-wav'){
                        source = source.replace(/^data:[^,]*;base64,/, 'data:audio/wav;base64,');
                    }
                    loaded += file.size;
                    onProgress(total?loaded/total*100:100);
                    resolve(source);
                };
                reader.onerror = ()=>reject('文件读取失败，请重试');
                reader.onabort = ()=>reject('文件读取已取消');
                reader.readAsDataURL(file);
            }));
        }
        let items = sources.map((url,index)=>({name:files[index].name,url}));
        let originals = new Set(sources);
        resources.set(type,[...items,...(resources.get(type)||[]).filter(item=>!originals.has(item.url))]);
        return sources;
    };
    let upload = async function(event){
        let {files,type,onComplete,onError,onProgress} = event.detail;
        try{
            onComplete(await readFiles(files,type,onProgress));
        }catch(error){
            onError(error);
        }
    };
    $editor.addEventListener('upload',upload);
    $editor.addEventListener('add',upload);
    // 素材库数据由调用方管理，返回列表后在组件内选择和插入。
    $editor.addEventListener('request',function(event){
        let {type,onComplete} = event.detail;
        onComplete((resources.get(type)||[]).map(item=>item.url));
    });
    $editor.addEventListener('remove',function(event){
        let {type,url,onComplete} = event.detail;
        resources.set(type,(resources.get(type)||[]).filter(item=>item.url!==url));
        onComplete();
    });
})();
