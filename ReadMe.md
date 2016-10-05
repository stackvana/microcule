# Stack 

<img src="https://travis-ci.org/Stackvana/stack.svg" alt="build:">

Software Development Kit and Command Line Interface for spawning streaming HTTP [microservices](http://martinfowler.com/articles/microservices.html) in multiple programming languages.

At it's core, `stack` maps HTTP request/response streams to the STDIN/STDOUT streams of any programming language binary.

If you are using Amazon Lambda or other cloud function hosting services like Google Functions or [hook.io](http://hook.io), you might find `stack` a very interesting option to remove your dependency on third-party cloud providers. `stack` allows for local deployment of enterprise ready microservices. `stack` has few dependencies and will run anywhere Node.js can run.

## Introduction

This project is the component which several production services, including [hook.io](http://hook.io), use to spawn real-time arbitrary streaming microservices in response to streaming HTTP requests. It's been battle-hardened with over two years of development and it's largest installation is now managing 8000+ microservices.

You are encouraged to use this module as-is, or modify it to suite your needs. If you are interested in contributing please let us know by opening a Pull Request.

## Features

 - Creates HTTP microservices in multiple Programming Languages
 - Ships with `stack` binary for starting HTTP microservice servers
 - [Plugin System](#plugins) based on standard node.js HTTP middlewares
 - Maps HTTP request / response to STDIN / STDOUT of spawned child processes
 - Uses a "system process per microservice request" design
 - Isolates state of microservice per system process and request ( stateless service requests )
 - Microservice error handling and custom timeouts
 - Can parse any kind of request data
   - Query
   - JSON
   - Form
   - Multipart
   - Streaming
   - Binary

## Installation

    npm install -g stackvana

*This will install the `stack` binary globally on your system.*

## Usage

```
  Usage: stack [command] [options]

  Commands:

    help  Display help

  Options:

    -t, --timeout <number>  Sets max timeout of service in milliseconds
    -h, --host <value>      Host to listen on
    -p, --port <number>     Port to listen on
    -l, --language <value>  Target programming languages
    -w, --watch <bool>      Reloads source files on every request ( dev only )
    -v, --version           Output the version number
```

By default, `stack` will attempt to start a listening HTTP server based on a microservice file path.

### As Command Line Interface

    stack ./path/to/script.foo

<a name="plugins"></a>
## Plugins

`stack` can be optionally extended through a simple `app.use()` based plugin architecture. Plugins are standard Node.js Express.js middlewares. This means you can use any existing Node.js middleware as a `stack` plugin, or re-use any `stack` plugin as a middleware in any existing Node application.

**Available Plugins**

- **logger** - Basic extendable request / response logger function 
- **mschema** - Adds [mschema](https://github.com/mschema/mschema) validation to incoming request parameters
- **bodyParser** - Intelligent streaming body parser ( JSON / form / multipart / binary )
- **rateLimiter** - Extendable request rate limiter. Holds rate limits in-memory or in Redis.

For Express based plugins example, see: `./examples/express-plugins.js`

Since plugins are standard Node.js middlewares, writing [custom plugins](#customPlugins) is very easy.

### 50+ Microservice Examples

You can find many example microservices which can be run with stack here:

https://github.com/Stackvana/microservice-examples

#### CLI Examples
    stack ./examples/services/echo/echo.js
    stack -l babel ./examples/services/echo/echo-es6-async.js
    stack ./examples/services/echo/echo.sh
    stack ./examples/services/echo/echo.lua
    stack ./examples/services/echo/echo.php
    stack ./examples/services/echo/echo.pl
    stack ./examples/services/echo/echo.py
    stack -l python3 ./examples/services/echo/echo-py3.py
    stack ./examples/services/echo/echo.rb
    stack ./examples/services/echo/echo.coffee
    stack ./examples/services/echo/echo.ss
    stack ./examples/services/echo/echo.st
    stack ./examples/services/echo/echo.tcl

Each call to `stack` will automatically start a listening HTTP server on port `3000`, additional instances of `stack` will auto-increment the port to `3001`, `3002`, etc.

Service target language is automatically detected based on the file extension of the service. This can be overridden using the `--language` option. 

*Note: For certain languages ( such as Babel ), the first microservice request to `stack` may take additional time as it will perform an initial compile and cache step.*

*Note: Please see [Babel Support](#babel) for additional Babel configuration*

### Programmatically Inside Node.js

```
Node API

spawn(opts, req, res)

   opts.code      - source code of microservice
   opts.language  - target programming language
   opts.log       - optional custom logging handler function ( defaults to `console.log` )
   opts.env       - environment variables which populates `service.env` ( defaults to `process.env` )

   req - http request stream
   res - http response stream

```

``` 
Hook Object API

   Every service is populated with an object named "hook"
   Note: This API may differ slightly per language implementation, see ./examples/services

   service.params - combined scope of all incoming HTTP request variables
   service.env    - environment variables of service ( defaults to `process.env`)
   service.req    - HTTP Request stream
   service.res    - HTTP Response stream

```

### Example services

see: `./examples/services` for more examples
see: [microservice-examples](https://github.com/Stackvana/microservice-examples) for 50+ examples

`express-simple.js`

```js
var stack = require('stackvana');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.json(opts.params);
};

var handler = stack.spawn({
  code: nodeService,
  language: "javascript"
});

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});

```

## Multiple Microservices Per Server Instance

In some configurations you may want to safely run multiple kinds of microservices on one server instance ( a small monolith ). `stack` is designed exactly for this use case.

Since every incoming service request will spawn a separate process, `stack` can safely and easily handle spawning multiple types of microservices at once without affecting the state of other services.

If you look at the `./examples/http-server-simple.js` file, you will see that `spawn()` can be used as a standard Node.js or Express HTTP middleware. For multiple services per server, simply map the `spawn()` method to any custom routes you may want to define.

You can also stack multiple `express` apps together for multiple microservices with separate routes. see: `./examples/express-multi-language.js`

### Supports Microservices In Many Languages

  - javascript
  - babel ( ES6 / ES7 / etc ... )
  - coffee-script
  - bash
  - lua
  - perl
  - php
  - python
  - python3
  - ruby
  - scheme
  - smalltalk
  - tcl

*Additional language support is both planned and welcomed. Please open a Pull Request if you wish to see a specific language added*

<a name="customPlugins"></a>

### Creating a custom plugin

Creating a custom plugin is very simple. Just code the stack plugin the same you would any other Node.js middleware. Feel free to use any of the other existing HTTP middlewares in the Node.js ecosystem. 

`custom-logger.js`

``` js
module.exports = function loggerMiddleware (config) {
  // here the function handler can be configured based on a `config` object
  return function loggerHandler (req, res, next) {
    console.log('running service ' + req.url);
    next();
  }
}
```

Once you've created a new plugin, simply `require()` it, and call `app.use(customLogger({}))`. That's it! There are no magic or surprises with how plugins work in `stack`.

See: `./examples/express-plugins.js` for more details.

## Security

Running untrusted microservice code in a safe way is a complex problem. The `stack` module is only intended to isolate a small part of the entire untrusted source code execution chain.

**If you intend to use this module to run untrusted source code please consider the following:**

### What this module does isolate

 - Microservice state
 - Microservice errors
 - Stream / Socket errors
 - HTTP Request state

Every incoming HTTP request will spawn a new system process to run the microservice instance, which then sends data to the HTTP response. Every microservice execution will happen in a fresh systems process.

All errors that can possibly happen during the execution of a microservice should be trapped and isolated to not affect any other microservices.

### What this mode does **NOT** isolate

 - Server Memory
 - Server CPU
 - Server file-system
 - Process CPU
 - Process Memory

`stack` cannot make any guarantees about the isolation of the server or spawned processes.  All microservices will have default access to the server's file-system and child processes.

To ensure isolation of the server file-system, you would want to use the `stack` binary in a `chroot` jail, or another similar container solution.

To ensure isolation of the server memory and cpu, you will want to use the `stack` binary in a virtualized environment capable of monitoring and managing resource usage per process.

<a name="coffee-script"></a>

## Coffee-Script

In order to Coffee-Script based microservices, you must install the following packages:

```bash
npm install coffee-script
```

<a name="babel"></a>

## Babel

In order to run Babel / ES6 / ES7 microservices, you must install the following packages:

```bash
npm install babel-core@6.16.0
npm install babel-plugin-syntax-async-functions@6.13.0
npm install babel-plugin-transform-regenerator@6.16.1
npm install babel-polyfill@6.16.0
npm install babel-preset-es2015@6.16.0
npm install babel-preset-stage-3@6.16.0
```

### Who is Using Stack

<a href="https://hook.io"><img src="http://hook.io/img/logo.png" height="22" width="100"/></a>

*Is your business using Stack in production? Let us know by opening a pull request with your company's logo and website.*

### Credits

Author: 

 - [Marak Squires](https://github.com/marak)

Special thanks to:

 - [Jordan Harband](https://github.com/ljharb)
 - [Andrew Love](https://github.com/andrewtlove) 

for their feedback in helping review early versions of this project.
