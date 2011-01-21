var http = require("http"),
    url  = require("url"),
    path = require("path"),
    fs   = require("fs");

http.createServer(function(request,response) {
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);
  path.exists(filename,function(exists) {
    if(!exists) {
      response.writeHead(404,{'Content-Type':'text/plain'});
      response.end("404 Not Found\n");
      return;
    }
    var filetype = /\.(.*?)$/.exec(filename)[1];
    if (filetype == 'ico') {
      fs.readFile(filename,'binary',function(err, file) {
        if(err) {
          response.writeHead(500,{'Content-Type':'text/plain'});
          response.end(err + "\n");
          return;
        }
        response.writeHead(200,{'Content-Type':'image/vnd.microsoft.icon'});
        response.end(file);
      });
    } else if (filetype == 'png') {
      rs = fs.createReadStream(filename);
      response.writeHead(200,{'Content-Type':'image/png'});
      rs.addListener('data',function (b) {
        response.write(b,'binary');
      });
      rs.addListener('end',function () {
        response.end();
      });
    } else {
      fs.readFile(filename,'utf-8',function(err, file) {
        if(err) {
          response.writeHead(500,{'Content-Type':'text/plain'});
          response.end(err + "\n");
          return;
        }
        if (filetype == 'html')     response.writeHead(200,{'Content-Type':'text/html'});
        if (filetype == 'manifest') response.writeHead(200,{'Content-Type':'text/cache-manifest'});
        if (filetype == 'css')      response.writeHead(200,{'Content-Type':'text/css'});
        if (filetype == 'js')       response.writeHead(200,{'Content-Type':'text/javascript'});
        else response.writeHead(200);
        response.end(file);
      });
    }
  });
}).listen(8080);

