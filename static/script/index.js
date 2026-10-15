(function(){
    let $editor = document.querySelector('#editor');
    let resources = new Map();

    document.querySelector('.gotop').addEventListener('click',function(event){
        event.preventDefault();
        window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
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
    $editor.addEventListener('upload',async function(event){
        let {files,type,onComplete,onError,onProgress} = event.detail;
        try{
            onComplete(await readFiles(files,type,onProgress));
        }catch(error){
            onError(error);
        }
    });
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
    $editor.addEventListener('add',function(event){
        let {type,onComplete,onError} = event.detail;
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.hidden = true;
        input.dataset.materialUpload = '';
        input.accept = {image:'image/png,image/jpeg,image/gif,image/webp',video:'video/mp4,video/webm,video/ogg',audio:'audio/*'}[type]||'';
        input.oncancel = ()=>{
            input.remove();
            onError('已取消上传');
        };
        input.onchange = async ()=>{
            let files = Array.from(input.files);
            input.remove();
            try{
                onComplete(await readFiles(files,type));
            }catch(error){
                onError(error);
            }
        };
        document.body.appendChild(input);
        input.click();
    });
})();
