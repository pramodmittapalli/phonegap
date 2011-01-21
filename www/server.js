var http = require('http'),
    url  = require('url'),
    path = require('path'),
    fs   = require('fs');

function contentType(path) {
  if (path.match('.js$'))            return 'text/javascript';
  else if (path.match('.css$'))      return 'text/css';
  else if (path.match('.manifest$')) return 'text/cache-manifest';
  else if (path.match('.ico$'))      return 'image/vnd.microsoft.icon';
  else if (path.match('.png$'))      return 'image/png';
  else                               return 'text/html';
}

http.createServer(function(request,res) {
  var path = url.parse(request.url).pathname;
  fs.readFile(__dirname+path,function(err,data) {
    if (err) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200,{'Content-Type':contentType(path)});
      res.write(data,'utf8');
      res.end();
    }
  });
}).listen(8080);
