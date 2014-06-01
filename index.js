var assert = require('assert');

var assertType = function(type, val, name) {
  assert(typeof type === 'string', 'Type must be a string');
  assert(typeof val === type, name.concat(' is no ').concat(type));
  return true;
};
var assertObj = assertType.bind(null, 'object');
var assertFunc = assertType.bind(null, 'function');

//------------------------------------------------------------
var exports = module.exports = {};


//------------------------------------------------------------
exports.camelCase = function camelCase(snakeCase){
  assert( typeof snakeCase === 'string', 'argument is not a string');

  var tokens = snakeCase.split(/_+/).filter(function(token){
    return (token.length >= 1);
  });

  if (tokens.length <= 1) {
    return snakeCase;
  }

  var first = tokens.shift().toLowerCase();
  var rest = tokens.map(function(token){
    return token.charAt(0).toUpperCase().concat(
      token.substring(1).toLowerCase()
    );
  }).join('');

  return first.concat(rest);
};

//------------------------------------------------------------
exports.inject = function inject(pg) {
  assertObj(pg.Query.prototype, 'Query.prototype');
  var queryProto = pg.Query.prototype;

  assertFunc(queryProto.handleRowDescription, 'Query.prototype.handleRowDesription');
  var handleRowDesc = queryProto.handleRowDescription;

  queryProto.handleRowDescription = function(msg) {
    msg.fields.forEach(function(field){
      field.name = exports.camelCase(field.name);
    });
    return handleRowDesc.call(this, msg);
  };

  return function restore() {
    queryProto.handleRowDescription = handleRowDesc;
  };
};
