# Microcule

<img src="https://travis-ci.org/Stackvana/microcule.svg" alt="build:">

## Introduction

Software Development Kit and Command Line Interface for spawning streaming HTTP [microservices](http://martinfowler.com/articles/microservices.html) in multiple programming languages.

At it's core, `microcule` maps HTTP request/response streams to the STDIN/STDOUT streams of any programming language binary. It is similiar to [CGI](https://en.wikipedia.org/wiki/Common_Gateway_Interface), but utilizies additional STDIO streams and does not attempt to parse STDOUT for HTTP response methods.

If you are using Amazon Lambda or other cloud function hosting services like Google Functions or [hook.io](http://hook.io), you might find `microcule` a very interesting option to remove your dependency on third-party cloud providers. `microcule` allows for local deployment of enterprise ready microservices. `microcule` has few dependencies and will run anywhere Node.js can run.

## Enterprise Ready

This project is the component which several production services, including [hook.io](http://hook.io), use to spawn real-time arbitrary streaming microservices in response to streaming HTTP requests. It's been battle-hardened with over two years of development and it's largest installation is now managing 8000+ microservices.

You are encouraged to use this module as-is, or modify it to suite your needs. If you are interested in contributing please let us know by opening a Pull Request.

## Features

 - Creates HTTP microservices in multiple Programming Languages
 - Ships with `microcule` binary for starting HTTP microservice servers
 - Only require microservice functionality you need
 - Uses [Plugin System](#plugins) based on standard node.js HTTP middlewares
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


#### Supports HTTP Microservices In Many Languages

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

<a name="plugins"></a>
#### Plugins

`microcule` can be optionally extended through a simple `app.use()` based plugin architecture. Plugins are standard Node.js Express.js middlewares. This means you can use any existing Node.js middleware as a `microcule` plugin, or re-use any `microcule` plugin as a middleware in any existing Node application.

**Available Plugins**

- **bodyParser** - Intelligent streaming body parser ( JSON / form / multipart / binary )
- **logger** - Basic extendable request / response logger function 
- **mschema** - Adds [mschema](https://github.com/mschema/mschema) validation to incoming request parameters
- **sourceGithubGist** - Pulls microservice source code from a Github Gist
- **sourceGithubRepo** - Pulls microservice source code from a Github Repository
- **spawn** - Spawns instance of microservice code in a new isolated child process. Maps HTTP req/res to process STDIN/STDOUT
- **rateLimiter** - Extendable request rate limiter. Holds rate limits in-memory or in Redis.

For Express based plugins example, see: `./examples/express-plugins.js`

Since plugins are standard Node.js middlewares, writing [custom plugins](#customPlugins) is very easy.

## Installation

    npm install -g microcule

*This will install the `microcule` binary globally on your system.*

## Usage

```
  Usage: microcule [command] [options]

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

By default, `microcule` will attempt to start a listening HTTP server based on a microservice file path.

### As Command Line Interface

microcule ./path/to/script.foo

### 50+ Microservice Examples

You can find many example microservices which can be run with microcule here:

https://github.com/Stackvana/microservice-examples

#### CLI Examples

    microcule ./examples/services/echo/echo.js
    microcule -l babel ./examples/services/echo/echo-es6-async.js
    microcule ./examples/services/echo/echo.sh
    microcule ./examples/services/echo/echo.lua
    microcule ./examples/services/echo/echo.php
    microcule ./examples/services/echo/echo.pl
    microcule ./examples/services/echo/echo.py
    microcule -l python3 ./examples/services/echo/echo-py3.py
    microcule ./examples/services/echo/echo.rb
    microcule ./examples/services/echo/echo.coffee
    microcule ./examples/services/echo/echo.ss
    microcule ./examples/services/echo/echo.st
    microcule ./examples/services/echo/echo.tcl

see: [microservice-examples](https://github.com/Stackvana/microservice-examples) for 50+ examples

Each call to `microcule` will automatically start a listening HTTP server on port `3000`, additional instances of `microcule` will auto-increment the port to `3001`, `3002`, etc.

Service target language is automatically detected based on the file extension of the service. This can be overridden using the `--language` option. 

*Note: For certain languages ( such as Babel ), the first microservice request to `microcule` may take additional time as it will perform an initial compile and cache step.*

*Note: Please see [Babel Support](#babel) for additional Babel configuration*


### Programmatically Inside Node.js

`microcule` is designed to work as standard HTTP middlewares.

#### Examples

see: `./examples` for more examples

`express-simple.js`

```js
var microcule = require('microcule');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.json(opts.params);
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});

```

## Multiple Microservices Per Server Instance

In some configurations you may want to safely run multiple kinds of microservices on one server instance ( a small monolith ). `microcule` is designed exactly for this use case.

Since every incoming service request will spawn a separate process, `microcule` can safely and easily handle spawning multiple types of microservices at once without affecting the state of other services.

If you look at the `./examples/http-server-simple.js` file, you will see that `spawn()` can be used as a standard Node.js or Express HTTP middleware. For multiple services per server, simply map the `spawn()` method to any custom routes you may want to define.

You can also stack multiple `express` apps together for multiple microservices with separate routes. see: `./examples/express-multi-language.js`

*Additional language support is both planned and welcomed. Please open a Pull Request if you wish to see a specific language added*

<a name="customPlugins"></a>

### Creating a custom plugin

Creating a custom plugin is very simple. Just code the microcule plugin the same you would any other Node.js middleware. Feel free to use any of the other existing HTTP middlewares in the Node.js ecosystem. 

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

Once you've created a new plugin, simply `require()` it, and call `app.use(customLogger({}))`. That's it! There are no magic or surprises with how plugins work in `microcule`.

See: `./examples/express-plugins.js` for more details.

## Security

Running untrusted microservice code in a safe way is a complex problem. The `microcule` module is only intended to isolate a small part of the entire untrusted source code execution chain.

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

`microcule` cannot make any guarantees about the isolation of the server or spawned processes.  All microservices will have default access to the server's file-system and child processes.

To ensure isolation of the server file-system, you would want to use the `microcule` binary in a `chroot` jail, or another similar container solution.

To ensure isolation of the server memory and cpu, you will want to use the `microcule` binary in a virtualized environment capable of monitoring and managing resource usage per process.

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
