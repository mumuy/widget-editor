(function(){
    let $editor = document.querySelector('#editor');

    document.querySelector('.gotop').addEventListener('click',function(event){
        event.preventDefault();
        window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });

    // 演示页作为外部调用方处理文件，正式使用时替换成自己的上传服务。
    $editor.addEventListener('upload',function(event){
        let {file,type,onUploadComplete,onUploadError,onProgress} = event.detail;
        let reader = new FileReader();
        reader.onprogress = function(event){
            if(event.lengthComputable){
                onProgress(event.loaded/event.total*100);
            }
        };
        reader.onload = function(){
            let source = String(reader.result);
            if(type==='attachment'){
                source = source.replace(/^data:[^,]*;base64,/, 'data:application/octet-stream;base64,');
            }else if(type==='audio'&&file.type==='audio/x-wav'){
                source = source.replace(/^data:[^,]*;base64,/, 'data:audio/wav;base64,');
            }
            onUploadComplete(source);
        };
        reader.onerror = ()=>onUploadError('文件读取失败，请重试');
        reader.onabort = ()=>onUploadError('文件读取已取消');
        reader.readAsDataURL(file);
    });
})();
