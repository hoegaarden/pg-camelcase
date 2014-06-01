var pgCamelCase = require('./index');
var assert = require('assert');

//------------------------------------------------------------
function getMockedPg() {
  function Query() {}
  Query.prototype.handleRowDescription = function(input){
    return input;
  };
  return { Query : Query };
}

//------------------------------------------------------------
describe('camelCase()', function(){
  var fix = require('./fixtures/snake2camel.json');

  it('should camel-case', function(){
    fix.forEach(function(mapping){
      var input = mapping[0];
      var expected = mapping[1];
      assert.strictEqual(expected, pgCamelCase.camelCase(input));
    });
  });
});

//------------------------------------------------------------
describe('inject()', function(){
  var input = {fields : [
    { name : 'some_snake_case' } ,
    { name : 'no snake case' } ,
    { name : 'someCamelCase' }
  ]};
  var after = {fields : [
    { name : 'someSnakeCase' } ,
    { name : 'no snake case' } ,
    { name : 'someCamelCase' }
  ]};

  it('should inject camel-casing and return proper revert-function', function(){
    var pg = getMockedPg();

    var callRowDesc = function(input){
      var q = new pg.Query();
      return q.handleRowDescription(input);
    };

    assert.deepEqual(input, callRowDesc(input));
    var restore = pgCamelCase.inject(pg);

    assert.deepEqual(after, callRowDesc(input));
    restore();

    assert.deepEqual(input, callRowDesc(input));
  });
});

//------------------------------------------------------------
describe('test against real server', function(){
  var envKey = 'TEST_PG_CONNECTION';
  var pg;

  if (!Object.hasOwnProperty.call(process.env, envKey)) {
    return;
  } else{
    try { pg = require('pg'); } catch(_1) {
      try { pg = require('pg.js'); }  catch(_2) {
        return;
      }
    }
  }

  function buildQuery(fieldNames) {
    return 'select ' + fieldNames.map(function(name, idx){
      return String(idx).concat(' as "').concat(name).concat('"');
    }).join(', ');
  }

  function queryAndTest(client, stmt, expected, cb){
    client.query(stmt, function(err, res){
      assert.ifError(err);

      var fieldNames = res.fields.map(function(field){
        return field.name;
      });
      assert.deepEqual(fieldNames, expected);

      expected.forEach(function(name, idx){
        assert.strictEqual(idx, res.rows[0][name]);
      });

      cb();
    });
  }

  it('should return camel-cased fields', function(testDone){
    var fieldNames = [ 'some_snake_case', 'no snake case', 'someCamelCase' ];
    var ccFieldNames = [ 'someSnakeCase', 'no snake case', 'someCamelCase' ];
    var stmt = buildQuery(fieldNames);

    pg.connect(process.env[envKey], function(err, client, clientDone){
      assert.ifError(err);

      var query = queryAndTest.bind(null, client, stmt);

      query(fieldNames, function(){
        var restore = pgCamelCase.inject(pg);
        query(ccFieldNames, function() {
          restore();
          query(fieldNames, function(){
            clientDone();
            testDone();
          });
        });
      });
    });
  });

});
