`pg-camelcase`
==============

About
-----

Changes the fieldnames of a query result from snake_case_nameing to camelCaseNaming.
The module exposes two functions:

- `#inject(pg)`: changes the internals of pg to change the result as
desribed. Also, it returns a function which can be called to revert
this change
- `#camelCase(str)`: returns the string `str` converted to camel case

Example:

```js
var pg = require('pg');
var pgCamelCase = require('pg-camelcase');
var revertCamelCase = pgCamelCaser(pg);

pg.connect(function(err, client, done){
    client.query('select 1 as "some_snake_case"', function(err, res){
        // should return all field names camel-cased
        assert.strictEqual(res.row[0].someSnakeCase, 1);
        done();
    });
});

revertCamelCase(); // deactivate/revert the camel casing

pg.connect(function(err, client, done){
    client.query('select 1 as "some_snake_case"', function(err, res){
        // should not camel case anymore
        assert.strictEqual(res.row[0].some_snake_case, 1);
        done();
    });
});
```

Tests
-----

If you run `npm test` and

- the environment variable `TEST_PG_CONNECTION` is set
- `pg` or `pg.js` is installed

tests a running against an real server and the real result is checked.
This should be the default for the tests on travis.
