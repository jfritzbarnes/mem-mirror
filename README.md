# Mem-mirror: support sqlite db container use for persistent data

The `mem-mirror` module hooks into a HAPI server and provides utilities for supporting persistent use of sqlite databases across containers possibly run from different environments. This is accomplished by using dropbox to download on startup and upload on shutdown. This is probably most useful for development usecases and small projects where one does not want to instantiate a long-term service.

The best way to get started is to check out the example application.

# Brief API Description

```javascript
const mm = new MemMirror(server, opts);
mm.prepare(); // returns a promise
```

Supported options:
* `addSystemRoutes`: provides routes for starting up the system (`POST /system/dbInit` body: `{token: ...}`) and (`POST /system/shutdown`)
* `addSimpleUIRoutes`: uses a pre-canned HTML page to obtain the dropbox token necessary to communicate with the server (default: `false`)
* `simpleUIRoutesPath`: prefix used on the HAPI server where the UI will be served (default: `/mem-mirror`)
* `nodeModulesPath`: may be needed in future... will see (default: `./`)
* `migrationsPath`: specifies where a database migrations file exists; schema specified in this file will be loaded at startup (default: `./migrations`)
* `sqlitePath`: where to store the sqlite file

