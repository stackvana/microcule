module['exports'] = function echoStream (req, res) {
  // If the hook is not currently streaming, 
  // the req has already been fully buffered,
  // and can no longer be streamed!
  if (!req.streaming) {
    return hook.res.end('No streaming request detected. \n\nTo test streaming data to this Hook try running this Curl command: \n\n     echo "foo" | curl --header "content-type: application/octet-stream"  --data-binary @- https://hook.io/examples/javascript-stream-transform');
  }
  req.on('end', function(){
    res.end();
  });
  req.on('data', function(chunk) {
    res.write(chunk.toString().toUpperCase())
  });
};