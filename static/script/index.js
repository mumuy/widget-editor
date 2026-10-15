(function(){
    let $editor = document.querySelector('#editor');
    let resources = new Map();

    document.querySelector('.gotop').addEventListener('click',function(event){
        event.preventDefault();
        window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });

    // 演示页作为外部调用方处理文件，正式使用时替换成自己的上传服务。
    $editor.addEventListener('upload',async function(event){
        let {files,type,onComplete,onError,onProgress} = event.detail;
        let total = files.reduce((sum,file)=>sum+file.size,0);
        let loaded = 0;
        let sources = [];
        try{
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
            let items = resources.get(type)||[];
            files.forEach((file,index)=>{
                if(!items.some(item=>item.url===sources[index])){
                    items.push({name:file.name,url:sources[index]});
                }
            });
            resources.set(type,items);
            onComplete(sources);
        }catch(error){
            onError(error);
        }
    });
    // 素材库数据由调用方管理，返回列表后在组件内选择和插入。
    $editor.addEventListener('request',function(event){
        let {type,onComplete} = event.detail;
        onComplete((resources.get(type)||[]).map(item=>item.url));
    });
    $editor.addEventListener('delete',function(event){
        let {type,url,onComplete} = event.detail;
        resources.set(type,(resources.get(type)||[]).filter(item=>item.url!==url));
        onComplete();
    });
})();
