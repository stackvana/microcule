// GraphicsMagick fully supported
var gm = require('gm');
var request = require('request');

module['exports'] = function imageResize (hook) {
  // grab an image stream using request
  var stream = request('https://hook.io/img/robotcat.png');
  hook.res.writeHead(200, { 'Content-Type': 'image/png' });
  // create a gm resize stream and pipe to response
  gm(stream)
    .options({imageMagick: true }) // set to `true` for MacOS ( gm by default )
    .resize(150, 150)
    .stream()
    .pipe(hook.res);
};