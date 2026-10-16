(function(){
    const editor = document.querySelector('#product-editor');
    const resources = new Map();

    document.querySelector('.copy-button').addEventListener('click',async function(){
        const button = this;
        try{
            await navigator.clipboard.writeText(document.getElementById(button.value).textContent);
            button.textContent = '已复制';
        }catch(error){
            button.textContent = '请选中下方代码复制';
        }
        setTimeout(()=>{button.textContent = '复制代码';},2500);
    });

    // 演示文件仅在当前页面读取；正式接入时由业务服务返回资源 URL。
    async function upload(event){
        const {files,type,onComplete,onError,onProgress} = event.detail;
        try{
            const urls = [];
            for(const file of files){
                const url = await new Promise((resolve,reject)=>{
                    const reader = new FileReader();
                    reader.onload = ()=>{
                        let value = String(reader.result);
                        if(type==='attachment'){
                            value = value.replace(/^data:[^,]*;base64,/,'data:application/octet-stream;base64,');
                        }else if(type==='audio'&&file.type==='audio/x-wav'){
                            value = value.replace(/^data:[^,]*;base64,/,'data:audio/wav;base64,');
                        }
                        resolve(value);
                    };
                    reader.onerror = ()=>reject(new Error('文件读取失败，请重试'));
                    reader.onabort = ()=>reject(new Error('文件读取已取消'));
                    reader.readAsDataURL(file);
                });
                urls.push(url);
                onProgress(urls.length/files.length*100);
            }
            resources.set(type,[...new Set([...urls,...resources.get(type)||[]])]);
            onComplete(urls);
        }catch(error){
            onError(error);
        }
    }
    editor.addEventListener('upload',upload);
    editor.addEventListener('add',upload);
    editor.addEventListener('request',function(event){
        const {type,page,onComplete} = event.detail;
        const items = resources.get(type)||[];
        const start = (page-1)*12;
        onComplete(items.slice(start,start+12),start+12<items.length);
    });
    editor.addEventListener('remove',function(event){
        const {type,url,onComplete} = event.detail;
        resources.set(type,(resources.get(type)||[]).filter(item=>item!==url));
        onComplete();
    });
})();
