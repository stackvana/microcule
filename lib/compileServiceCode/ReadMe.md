Certain languages require a compile / transpile step before they are capable of executing the microservice.

Babel / Coffee-Script are examples of this, as they must be compiled to JavaScript before execution.

Since real-time compilation takes a signifiant amount of time, we add the ability to cache compiled versions of code through a custom callback.