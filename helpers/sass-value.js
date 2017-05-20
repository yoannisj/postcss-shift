var indexOfClosingChar = require('../helpers/index-of-closing-char');
var SassValue = module.exports = {};

// useful properties
SassValue.varRe = /\$(\w|-)/;
SassValue.varsRe = /\$(\w|-)+/g;

// parses variables found in the given node
SassValue.parseVariables = function(node, str)
{
  // return property value, with all variables replaced with their scoped value
  return str.replace(SassValue.varsRe, function(v) {
    return SassValue.getVariableValue(node, v.substr(1));
  });
};

// finds value of given variable in given node
SassValue.getVariableValue = function(node, name)
{
  var curr = node,
    scope = curr.parent,
    val, prev;

  // search for value in current scope
  while (!val && scope)
  {
    // search for value in previous declarations
    prev = curr.prev();

    while (!val && prev)
    {
      // if pevious node is declaring a value for the given variable
      if (prev.type == 'decl' && prev.prop == '$' + name) {
        val = SassValue.parseVariables(prev, prev.value);
      }

      prev = prev.prev();
    }

    // check in parent scope
    curr = scope;
    scope = curr.parent;
  }

  return val;
};

// parses a given value (Sass/CSS string) and returns an object
// if the value corresponds to a sass map
SassValue.mapValue = function(value)
{
  // remove wrapping parenthesises
  value = value.replace(/^\(|\)$/g, '').trim();

  // split value into tuples
  var tuples = value.split(','),
    parsed = {};

  // extract key and value from tuple
  for (var i = 0, ln = tuples.length; i<ln; i++)
  {
    // separate key from value (also removes spaces around the ':' separator)
    // TODO: preservve  ':' character inside keys and/or values
    var tuple = tuples[i],
      parts = tuple.split(':'),
      key = parts[0].replace(/^\n/, '').trim().replace(/^('|")|('|")$/g, '');

    // if the tuple has two parts and a valid key
    if (parts.length == 2 && key != '') {
      // register the tuple's key, value pair
      parsed[key] = parts[1];
    } else {
      // the map value is invalid, return undefined
      return undefined;
    }
  }

  return parsed;
}

// checks if given string corresponds to a map value
SassValue.isMapValue = function(str)
{
  // remove wrapping parenthesis
  str = str.trimLeft('(').trimRight(')');
  // remove white-space
  str = str.replace(/\s/g, '');

  // check if the rest is a suite of map tuples only
  return str.match(/.+:.*,?/g).join('') == str;
}

// checks whether given string contains a map value
SassValue.hasMapValue = function(str)
{
  // check for parenthesis with colomns
  var maps = str.match(/\([\s\S].+:[\s\S].*\)/g);

  // check if any corresponds to a map value
  for (var i = 0, ln = maps.length; i<ln; i++)
  {
    if (SassValue.isMapValue(maps[i])) {
      return true;
    }
  }

  return false;
}

// finds all map values from a given string and parses them
SassValue.getMapValues = function(str)
{
  // check for parenthesis with colomns
  var maps = str.match(/\([\s\S]+:[\s\S]*\)/g),
    values = [];

  if (maps)
  {
    for (var i = 0, ln = maps.length; i<ln; i++)
    {
      if (SassValue.isMapValue(maps[i]))
      {
        var map = SassValue.mapValue(maps[i]);
        if (map) values.push(map);
      }
    }
  }

  return values;
};

// parses the arguments in a function or mixin definition
SassValue.parseArguments = function(def)
{
  // get clean list of arguments
  var str = '(' + def.params.split(/\(/)[1],
    map = {};

  // cleanup list or arguments
  str = str.trim().replace(/^\(|\)$/g, '').trim();

  // and translate it to a map
  // TODO: presevre ',' character inside default values
  str.split(',').forEach(function(arg) {
    var parts = arg.split(':'),
      name = parts[0].trim().substr(1),
      val = parts.length > 1 ? parts[1].trim() : undefined;

    if (val !== undefined)
    {
      // parse variables in default value
      val = val.replace(SassValue.varsRe, function(v) {
        var varname = v.substr(1);

        // get reference to previous argument's name
        if (varname in map) {
          return map[varname];
        }

        return SassValue.getVariableValue(def, varname);
      });
    }

    // map argument's name to its default value
    map[name] = val;
  });

  return map;
}

SassValue.parseCallArguments = function(call)
{  
  // get list of arguments between parenthesis
  call = call.slice(call.indexOf('(') + 1, -1);

  var args = [],
    ignoreOpen = ['(', '"', "'"],
    ignoreClose = [')', '"', "'"],
    start = 0,
    index = start,
    last = call.length;
  
  while (index < last)
  { 
    var char = call[index],
      ignoreIndex = ignoreOpen.indexOf(char);
    
    // ignore nested parentheses and strings
    if (ignoreIndex != -1) {
      // by jumping to after corresponding closing character
      index = indexOfClosingChar(call, char, ignoreClose[ignoreIndex], index + 1);
    }

    else if (char == ',') {
      // collect argument by splitting here
      args.push(call.slice(start, index).trim());
      // and update start of next argument
      start = index + 1;
    }

    // inspect next character
    index++;
  }

  // collect last argument
  args.push( call.slice(start).trim() );

  return args;
}