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
    // 资源库由调用方管理；关闭外部界面后再通知编辑器。
    $editor.addEventListener('request',function(event){
        let {type,limit,onComplete,onError} = event.detail;
        let items = resources.get(type)||[];
        let dialog = document.createElement('dialog');
        dialog.className = 'resource-library';
        dialog.innerHTML = '<form><h3>资源库</h3><div class="resource-list"></div><p role="status"></p><footer><button type="button">取消</button><button type="submit">选择资源</button></footer></form>';
        let list = dialog.querySelector('.resource-list');
        if(!items.length){list.textContent = '暂无资源，请先上传文件';}
        items.forEach((item,index)=>{
            let label = document.createElement('label');
            let input = document.createElement('input');
            input.type = 'checkbox';
            input.value = index;
            label.append(input,document.createTextNode(item.name));
            list.appendChild(label);
        });
        let finish = function(urls){
            dialog.close();
            dialog.remove();
            urls?onComplete(urls):onError('已取消选择');
        };
        dialog.querySelector('[type="button"]').onclick = ()=>finish();
        dialog.addEventListener('cancel',event=>{
            event.preventDefault();
            finish();
        });
        dialog.querySelector('form').onsubmit = function(event){
            event.preventDefault();
            let urls = Array.from(list.querySelectorAll(':checked'),input=>items[Number(input.value)].url);
            if(!urls.length||urls.length>limit){
                dialog.querySelector('[role="status"]').textContent = !urls.length?'请选择资源':'最多选择 '+limit+' 个资源';
                return;
            }
            finish(urls);
        };
        document.body.appendChild(dialog);
        dialog.showModal();
    });
})();
