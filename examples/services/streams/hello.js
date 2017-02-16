module['exports'] = function echoStream (hook) {
  // If the hook is not currently streaming, 
  // the req has already been fully buffered,
  // and can no longer be streamed!
  if (!hook.streaming) {
    return hook.res.end('No streaming request detected. \n\nTo test streaming data to this Hook try running this Curl command: \n\n     echo "foo" | curl --header "content-type: application/octet-stream"  --data-binary @- https://hook.io/Marak/transformStream');
  }
  hook.req.on('end', function(){
    hook.res.end();
  });
  hook.req.on('data', function(chunk){
    hook.res.write('hello world');
  });
};