/* 
This args array returned from here is used as paramters when spawning `dotnet run` 
Just pass service and env back along with the `-p` dotnet run parameter.
For dotnet we don't want to pass the code as a string, that's for lame lanuages ;)

Other languages been implemented such that the JSON is flattened here and passed as individual params. 
That's a waste of time. We can use a JSON parser in the. 

May be there's a case for pulling out some key paramas here suchs as the querystring params collection.
*/
module['exports'] = function generategccArguments(service, env) {

    var dotnetArgv = [];

    dotnetArgv = [
        'run',
        '-p', service.buildDir,
        '--s', JSON.stringify(service), // important: two dashes `--` for params that are passed into the app.
        '--e', JSON.stringify(env),
    ];

    return dotnetArgv;
}