# Microcule

<img src="https://travis-ci.org/Stackvana/microcule.svg" alt="build:">

Software Development Kit and Command Line Interface for spawning streaming stateless HTTP [microservices](http://martinfowler.com/articles/microservices.html) for any programming language or arbitrary binary.

Think of it as serverless functions meets [Unix Philosophy](https://en.wikipedia.org/wiki/Unix_philosophy).

see: [100+ Working Service Examples](https://github.com/stackvana/microcule-examples)


## Table of Contents
 - [Introduction](#introduction)
 - [Enterprise Ready](#enterprise-ready)
 - [Features](#features)
   - [Modular](#modular)
   - [Universal](#universal)
   - [Intelligent HTTP Request Parsing](#intelligent-http-request-parsing)
   - [Consistent](#consistent)
   - [Extendable](#extendable)
   - [Versatile](#versatile)
   - [No Containers](#no-containers)
 - [Languages](#languages)
   - c ( with `gcc` )
   - java
   - javascript
   - babel ( ES6 / ES7 / etc ... )
   - coffee-script
   - common lisp
   - bash
   - lua
   - golang
   - ocaml
   - perl
   - php
   - python
   - python3
   - ruby
   - rust
   - r
   - scheme
   - smalltalk
   - tcl
 - [Installation](#installation)
 - [Plugins](#plugins)
   - Body Parser
   - Compiler
   - Cron Scheduler
   - Logger
   - Rate limiter
   - Mschema Request Validator
   - Source Github repo
   - Source Gist repo
   - Spawn
 - [Command Line Interface Usage](#cli-examples)
 - [Node.js HTTP Middleware Usage](#node-middleware-usage)
 - [Spawning arbitrary compiled binaries](#)
 - [Multiple Microservices Per Server Instance](#)
 - [Security](#security)
 - [100+ Working Code Examples](#examples)
 - [Etymology](#etymology)


## Introduction

At it's core, `microcule` maps HTTP request response streams to the STDIN STDOUT streams of a function in any arbitrary programming language or any compiled binary. It's reminiscent of [CGI](https://en.wikipedia.org/wiki/Common_Gateway_Interface), but utilizes additional STDIO streams, does not attempt to parse STDOUT for HTTP response methods. microcule is an old concept rethought and improved with the latest industry standard toolings.

If you are using Amazon Lambda or other cloud function hosting services like Google Functions or [hook.io](http://hook.io), you might find `microcule` a very interesting option to remove your dependency on third-party cloud providers. microcule allows for local deployment of enterprise ready microservices. microcule has few dependencies and will run anywhere Node.js can run.

[quick demonstration video](https://www.youtube.com/embed/GSfeBHN1c_g "quick demonstration video")

## Enterprise Ready

This project is the component which several production services, including [hook.io](http://hook.io), use to spawn real-time arbitrary streaming microservices in response to streaming HTTP requests. It's been battle-hardened with over two years of development and it's largest installation is now managing 8000+ microservices.

You are encouraged to use this module as-is, or modify it to suite your needs. If you are interested in contributing please let us know by opening a Pull Request.

## Features

### Modular

Only require the functionality you need.


`microcule` [itself](https://github.com/Stackvana/microcule/blob/index.js) is actually just a collection of HTTP middleware [Plugins](#plugins) presented as a CLI tool. This is essential, as all it's features and functionality are de-coupled with an industry standard API. You are encouraged to use the `microcule` binary shipped with this project, or use microcule plugins programmatically in your existing application.

### Universal

 - Supports Serverless functions in 20 programming languages! ( and counting )
 - Supports Serverless with standard Unix or Linux tools ( like `ls`, `echo`, or `tail -f` )
 - Full support for mapping HTTP -> STDIO streams
 - Unix first. No custom APIs or buffered context

### Intelligent HTTP Request Parsing

`microcule` can parse any kind of request data based on the incoming request's `content-type` header and will always stream requests by default.
   - Query
   - JSON
   - Form
   - Multipart
   - Streaming
   - Binary

Even binary data works great! Here is an example of resizing in image in [JavaScript](https://github.com/Stackvana/microcule-examples/blob/master/image-resize/index.js) or [Bash](https://github.com/Stackvana/microcule-examples/blob/master/bash-image-resize/index.sh).

### Consistent

 - Spawns functions or arbitrary binaries in response to HTTP requests
 - Uses a fresh system process per request per execution
 - State of services clears on every request
 - Service source code is immutable ( unless configured otherwise )
 - Uses build step for compiled languages

### Versatile

 - Ships with `microcule` binary for starting HTTP microservice servers
 - Scripting support for HTTP request / response API ( differs per language )
 - Can serve any arbitrary binary like `echo`, `ls`, and `tail -f` as streaming HTTP microservices
 - Can optionally accept STDIN and process scripts with Unix style pipes ( useful for using functions in DevOps! )

### Extendable

 - Should theoretically be able to work with all programming languages
 - Should work with any existing Unix or Linux tool
 - Provides simple customizable interfaces for programming language environments
 - Uses [Plugin System](#plugins) based on standard node.js HTTP middlewares
 - Simplistic design makes it very easy to add features / add languages / create new plugins

### No Containers

  - By design, ships with no container or OS virtualization
  - Will work with any Container or Virtual Machine solutions ( it's your choice! )
  - Isolates state of microservice per system process and request ( stateless service requests )
  - Handles Microservice error handling and custom timeouts

[Read more about securing microcule](#security)

<a name="plugins"></a>
### Plugins

`microcule` can be optionally extended through a simple `app.use()` based plugin architecture. Plugins are standard Node.js Express.js middlewares. This means you can use any existing Node.js middleware as a `microcule` plugin, or re-use any `microcule` plugin as a middleware in any existing Node application.

**Available Plugins**

- **bodyParser** - Intelligent streaming body parser ( JSON / form / multipart / binary )
- **cronScheduler** - Schedule function calls on a timer using a simple [Cron](https://en.wikipedia.org/wiki/Cron) syntax
- **compile** - Compile microservice source code into binary ( optional dependency to `spawn` )
- **logger** - Basic extendable request / response logger function 
- **mschema** - Adds [mschema](https://github.com/mschema/mschema) validation to incoming request parameters
- **sourceGithubGist** - Pulls microservice source code from a Github Gist
- **sourceGithubRepo** - Pulls microservice source code from a Github Repository
- **spawn** - Spawns instance of microservice code in a new isolated child process. Maps HTTP req/res to process STDIN/STDOUT
- **rateLimiter** - Extendable request rate limiter. Holds rate limits in-memory or in Redis.

For Express based plugins example, see: `./examples/express-plugins.js`

Since plugins are standard Node.js middlewares, writing [custom plugins](#customPlugins) is very easy.

## Languages

`microcule` supports 20+ programming languages. The best way to get started is to visit [100+ Microcule Examples](https://github.com/stackvana/microcule-examples).

Want to see a new language added? Simply open a pull request or [open an issue](https://github.com/stackvana/microcule/issues). We are glad to add it!

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

### Basic Command Line Usage

  microcule ./path/to/scriptOrBinary.foo

### 100+ Microservice Examples

[Here can find many example microservices which can be run with microcule](https://github.com/Stackvana/microcule-examples)

These same examples are available as live services at [hook.io/examples](https://hook.io/examples).

#### CLI Examples

```bash

# mount any arbitrary command to a streaming HTTP endpoint

microcule echo "hello world"
microcule cat ReadMe.md
microcule tail -f ReadMe.md

# pipe in data from arbitrary commands

echo "hello world" | microcule ./examples/services/echo/echo-stdin.js
ls | microcule ./examples/services/echo-stdin.js
ls | microcule ./examples/streams/transform.js
tail -f ReadMe.md | microcule --stream=true ./examples/services/streams/echo.js

# start HTTP servers with mounted streaming functions directly from source files

microcule ./examples/services/echo/echo.js
microcule -l babel ./examples/services/echo/echo-es6-async.js
microcule ./examples/services/echo/echo.sh
microcule ./examples/services/echo/echo.c
microcule ./examples/services/echo/echo.go
microcule ./examples/services/hello-world/hello.java
microcule ./examples/services/echo/echo.lisp
microcule ./examples/services/echo/echo.lua
microcule ./examples/services/echo/echo.ml
microcule ./examples/services/echo/echo.php
microcule ./examples/services/echo/echo.pl
microcule ./examples/services/echo/echo.py
microcule ./examples/services/echo/echo-wsgi.py
microcule -l python3 ./examples/services/echo/echo-py3.py
microcule ./examples/services/echo/echo.r
microcule ./examples/services/echo/echo.rb
microcule ./examples/services/echo/echo.rs
microcule ./examples/services/echo/echo.coffee
microcule ./examples/services/echo/echo.ss
microcule ./examples/services/echo/echo.st
microcule ./examples/services/echo/echo.tcl

# run full-features microservices as packages
git clone https://github.com/stackvana/microcule-examples
cd microcule-examples/javascript-echo
microcule .

```
see: [microcule-examples](https://github.com/Stackvana/microcule-examples) for 100+ examples

Each call to `microcule` will automatically start a listening HTTP server on port `3000`, additional instances of `microcule` will auto-increment the port to `3001`, `3002`, etc.

Service target language is automatically detected based on the file extension of the service. This can be overridden using the `--language` option. 

*Note: For certain languages ( such as Babel ), the first microservice request to `microcule` may take additional time as it will perform an initial compile and cache step.*

*Note: Please see [Babel Support](#babel) for additional Babel configuration*


### Node Middleware Usage

`microcule` is designed to work as set of standard Node.js HTTP middlewares. This is very useful and universal in that you can re-use any existing Node.js tooling ( like Express.js middlewares ) with any microcule plugins ( like `spawn` or `compile` ).

#### Examples

see: `./examples` for more examples

`node express-simple.js`

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

## Spawning arbitrary compiled binaries

Sometimes you may need to spawn a precompiled arbitrary binary instead of a script based microservice. `microcule` supports two ways of spawning arbitrary binaries.

### Executing arbitrary binaries from microcule Bash services

You can create a new `bash` script and execute your binary in a bash sub-shell using `microcule`'s built-in support for Bash scripts.

Simply create a bash script and use `microcule` to spawn it. This will work for *any* binary. Here is a simple curl example:

`bash-curl-request.sh`
```bash
curl --silent --data 'foo=bar&hello=there' http://hook.io/examples/echo
```

Then run:

```bash
microcule bash-curl-request.sh
```

This same example can be found at [https://github.com/Stackvana/microcule-examples/tree/master/bash-curl-request](https://github.com/Stackvana/microcule-examples/tree/master/bash-curl-request)

### Spawning arbitrary binaries directly from microcule

In some cases, creating a bash sub-shell is not ideal and you'll want to directly spawn your precompiled binary.

This is very easy, simple call `microcule.spawn` using the `bin` and `argv` options. Here is an example of spawning `echo`

```js
var handler = microcule.plugins.spawn({
  bin: 'echo',
  argv: ['hello', 'world']
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

### Who is Using Microcule

<a href="https://hook.io"><img src="http://hook.io/img/logo.png" height="22" width="100"/></a>&nbsp;&nbsp;
<a href="https://partnerhero.com"><img src="https://partnerhero.com/img/black-and-orange-logo-original.png" height="22" width="100"/></a>

*Is your business using Microcule in production? Let us know by opening a pull request with your company's logo and website.*

### Etymology

**micro** - a combining form with the meanings “small”

**cule** - indicating smallness

### Credits

Author: 

 - [Marak Squires](https://github.com/marak)

Special thanks to:

 - [Jordan Harband](https://github.com/ljharb)
 - [Andrew Love](https://github.com/andrewtlove)
 - [pyhedgehog](https://github.com/pyhedgehog) 

for their feedback in helping review early versions of this project.
