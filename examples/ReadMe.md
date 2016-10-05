# stack examples

This folder contains several unique examples and ways to run / use stack.

## Using `stack` CLI to spawn server

To use the `stack` CLI to start one of these examples, simply run:

```
stack ./examples/services/echo/echo.js
```

You can change the path argument to any of the services found in `./examples/services`

## Create custom stand-alone servers

The `stack` CLI spawns an HTTP server bound to the service argument.

If you wish to create a custom HTTP server, you can run any of the following examples:

```
node express-plugins.js
node express-simple.js
node http-server-simple.js
```

These examples show how to use `stack` as an HTTP middleware in Express or any standard Node.js HTTP server.

## 50+ Microservice Examples using Stack

see: https://github.com/Stackvana/microservice-examples
