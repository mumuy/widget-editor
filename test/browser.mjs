import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {StringDecoder} from 'node:string_decoder';

// 使用 Chromium 原生调试协议，不依赖浏览器测试框架或 WebSocket 插件。
export async function browser(url){
    let profile = await mkdtemp(join(tmpdir(),'widget-editor-test-'));
    let child = spawn(process.env.CHROME_BIN||'chromium',[
        '--headless=new','--no-sandbox','--disable-dev-shm-usage',
        '--disable-background-networking','--no-first-run',
        '--remote-debugging-pipe','--user-data-dir='+profile,'about:blank'
    ],{stdio:['ignore','ignore','pipe','pipe','pipe']});
    let pending = new Map();
    let next = 0;
    let buffer = '';
    let decoder = new StringDecoder('utf8');
    let sessionId;
    let logs = [];
    let rejectAll = error=>{
        pending.forEach(request=>{clearTimeout(request.timer);request.reject(error);});
        pending.clear();
    };
    child.on('error',rejectAll);
    child.on('exit',()=>rejectAll(Error('Chromium exited')));
    child.stderr.resume();
    child.stdio[3].on('error',rejectAll);
    child.stdio[4].on('data',data=>{
        buffer += decoder.write(data);
        let end;
        while((end=buffer.indexOf('\0'))!==-1){
            let message = buffer.slice(0,end);
            buffer = buffer.slice(end+1);
            if(!message){continue;}
            let result = JSON.parse(message);
            if(result.id){
                let request = pending.get(result.id);
                if(!request){continue;}
                pending.delete(result.id);
                clearTimeout(request.timer);
                if(result.error){request.reject(Error(JSON.stringify(result.error)));}
                else{request.resolve(result.result);}
            }
            if(result.method==='Runtime.exceptionThrown'){
                logs.push(result.params.exceptionDetails.exception?.description||result.params.exceptionDetails.text);
            }
        }
    });
    let send = (method,params={})=>new Promise((resolve,reject)=>{
        let id = ++next;
        let timer = setTimeout(()=>{pending.delete(id);reject(Error('Chromium timeout: '+method));},15000);
        pending.set(id,{resolve,reject,timer});
        child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
    });
    let evaluate = async code=>{
        let result = await send('Runtime.evaluate',{expression:`(async()=>{${code}})()`,awaitPromise:true,returnByValue:true});
        if(result.exceptionDetails){throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);}
        return result.result.value;
    };
    let delay = milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
    let close = async ()=>{
        if(child.pid&&child.exitCode===null&&child.signalCode===null){
            let exited = new Promise(resolve=>child.once('exit',resolve));
            child.kill();
            await exited;
        }
        await rm(profile,{recursive:true,force:true});
    };
    try{
        let {targetId} = await send('Target.createTarget',{url:'about:blank'});
        ({sessionId} = await send('Target.attachToTarget',{targetId,flatten:true}));
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Page.navigate',{url});
        for(let attempt=0;attempt<100;attempt++){
            if(await evaluate('return !!document.querySelector("widget-editor")?.content;')){
                return {send,evaluate,delay,close,logs};
            }
            await delay(50);
        }
        throw Error('Editor did not initialize: '+logs.join('\n'));
    }catch(error){
        await close();
        throw error;
    }
}
