var SassValue = require('../helpers/sass-value');
var indexOfClosingChar = require('../helpers/index-of-closing-char');
var getShiftValues = require('../helpers/get-shift-values');

var Invokable = module.exports = {};

// returns an array with all function calls/mixin includes in given string
function findInvokations(str, type, name)
{
  var calls = [],
    offset = name.length,
    regexStr = name + '\\(.+\\)',
    calls = [], occurences, start, end;

  // adjust regex string and offset for mixins
  if (type == 'mixin') {
    regexStr = '@include ' + regexStr;
    offset = offset + 9;
  }

  // find invokable occurences in string
  occurences = str.match(new RegExp(regexStr, 'gm'));

  // limit the occurences to correct closing parentheses
  if (occurences)
  {
    occurences.forEach(function(occurence) {
      //find end of call occurence
      start = offset;
      end = indexOfClosingChar(occurence, '(', ')', start);

      console.log(occurence);

      // add full occurence to the list of calls
      calls.push({
        start: start,
        end: end,
        value: occurence.slice(0, end)
      });
    });
  }

  return calls;
}

// injects default arguments for given invokable in a node property
function injectDefaultsInProp(node, prop, type, name, args)
{
  var str = node[prop],
    invokations = findInvokations(str, type, name);

  invokations.forEach(function(ivk) {
    // get value around the invokation
    var before = str.substr(0, ivk.start),
      after = str.substr(ivk.end),
      call = ivk.value;

    // parse the invokation
    var ivkArgs = SassValue.parseCallArguments(call);

    console.log(call, ivkArgs);

    // inject the default values in invokation
    var hasDefault = true,
      argIndex = ivkArgs.length - 1,
      lastArgIndex = args.length - 1,
      argNames = Object.keys(args);

    // loop over arguments which have a default value
    while (hasDefault && argIndex < lastArgIndex);
    {
      var argName = argNames[argIndex],
        argval = args[argName],
        hasDefault = (argval !== undefined);

      if (hasDefault) {
        // inject default value into invokation
        call = call.slice(0, -1) + ', ' + argval + ')';
      }

      // check next argument
      argIndex++;
    }

    // reassemble the string
    str = before + call + after;
  });

  // replace node's property with transformed string
  // node[prop] = str.trim();
}

// returns a list of given definition's calls in subsequent nodes
function injectInvokableDefaults(def, args, opts, shift)
{
    var type = def.name,
      name = def.params.slice(0, def.params.indexOf('(')),
      valid = true,
      siblings = def.parent.nodes,
      index = def.parent.index(def),
      last = siblings.length;

    var doInjectDefaults = function(curr)
    {
      // stop if the current node is overwriting the invokable definition
      if (curr.type == 'atrule' && curr.name == type
        && curr.params.slice(0, curr.params.indexOf('(')) == name)
      {
        valid = false;
        return;
      }

      // find invokations
      switch (curr.type)
      {
        case 'atrule':
          // inject defaults in params, and descendant nodes
          injectDefaultsInProp(curr, 'params', type, name, args);
          curr.walk(doInjectDefaults);
          break;
        case 'rule':
          // inject defaults in selector, and descendant nodes
          injectDefaultsInProp(curr, 'selector', type, name, args);
          curr.walk(doInjectDefaults);
          break;
        case 'decl':
          // inject defaults in prop and value
          injectDefaultsInProp(curr, 'prop', type, name, args);
          injectDefaultsInProp(curr, 'value', type, name, args);
          break;
      }
    }

    // check for invokations in following nodes
    while (valid && index < last) {
      // search in next sibling node
      doInjectDefaults(siblings[++index]);
    }
};

// checks invokable default values, and prepare those which use shift values
Invokable.processDefaults = function(def, opts, shift)
{
  // get type, name and (arg => default) map for invokable
    var args = SassValue.parseArguments(def),
      argnames = Object.keys(args),
      index = 0,
      hasShiftDefaults = false,
      injectCalls = [];

    // check all arguments from definition
    for (var argname in args)
    {
        // if the argument has a default value
        var val = args[argname];
        if (val !== undefined)
        {
            // find shift values in default value
            var shiftvals = getShiftValues(def, val, opts, shift);
            if (shiftvals.length) {
                // inject default values in subsequent calls
                injectInvokableDefaults(def, args, opts, shift);
                // and stop inspecting further argument defaults
                // (one with shift values is enough to start injecting)
                break;
            }
        }
    }
};

// expands all invokations of given function/mixin that are using shiftvalues
Invokable.expandInvokations = function(def, opts, shift)
{
  var index = def.parent.index(def),
    siblings = def.parent.nodes,
    last = siblings.length, curr;

  var doExpandInvokation= function(node, prop, opts, shift)
  {
  };

  while (index < last)
  {
    curr = siblings[++index];

    switch (curr.type)
    {
      case 'atrule':
        curr.params
        curr.walk();
        break;
      case 'rule':
        break;
      case 'decl':
        break;
    }
  }
}