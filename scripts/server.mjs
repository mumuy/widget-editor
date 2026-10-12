import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const port = Number(process.env.PORT||3000);
http.createServer(async function(request,response){
    try{
        let pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
        let filename = path.resolve(root,'.'+pathname);
        if(filename!==root&&!filename.startsWith(root+path.sep)){
            response.writeHead(403).end();
            return;
        }
        let info = await stat(filename);
        if(info.isDirectory()){
            filename = path.join(filename,'index.html');
            info = await stat(filename);
        }
        response.writeHead(200,{'Content-Type':(types[path.extname(filename)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-cache'});
        createReadStream(filename).pipe(response);
    }catch(error){
        response.writeHead(404).end('Not found');
    }
}).listen(port,'0.0.0.0',function(){
    console.log('Widget Editor development server on port '+port);
});
