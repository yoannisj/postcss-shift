var postcss = require('postcss');
var simpleVars = require('postcss-simple-vars');

var Shift = require('shift-js');
var CssTree = require('./helpers/css-tree');
var SassValue = require('./helpers/sass-value');
var Invokable = require('./helpers/invokable');

var removables = [];

// processes a declaration
function processDeclaration(decl, opts, shift)
{
    var isAssignment = SassValue.varRe.test(decl.prop);
    var invokableParent = CssTree.findClosest(decl, function(node) {
        return (node.type == 'atrule' && (node.name == 'function' || node.name == 'mixin'));
    });

    // if the declaration is an assignment and not inside a function or mixin
    if (isAssignment && !invokableParent) {
        // remove it after processing
        removables.push(decl);
    }

    // if it is not an assignment, and it is not inside a function or mixin
    if (!isAssignment && !invokableParent) {
        // process the declaration
        processProperty(decl, opts, shift);
        processValue(decl, opts, shift);
    }
}

// processes a declaration property
function processProperty(decl, opts, shift)
{

}

// processes a declaration value
function processValue(decl, opts, shift)
{       
    // replace reference to shift variables inside declaration
    decl.value = SassValue.parseVariables(decl, decl.value, opts, shift);
}

// processes a rule
function processRule(rule, opts, shift)
{

}

// processes an atrule
function processAtRule(atrule, opts, shift)
{
    // special processing for function and mixins
    if (atrule.name == 'function' || atrule.name == 'mixin') {
        processInvokable(atrule, opts, shift);
    }

    else {
        
    }
}
// processes an invokable atrule (sass @function and @mixin)
function processInvokable(def, opts, shift)
{
    // => expand function/mixin calls that use shift values
    // EDGE CASE: SHIFT VALUES ENDING UP IN ARGUMENT DEFAULTS
    // => inject default values into calls before expanding them
    // CAUTION: DOES NOT SUPPORT OMITTABLE ARGUMENTS
    Invokable.processDefaults(def, opts, shift);
    // Invokable.expandInvokation(def, opts, shift);
}

module.exports = postcss.plugin('postshift', function postshift(opts) {

    return function(css, res) {

        // get processor options
        opts = opts || {};

        // initialize shift
        Shift.init(opts.shiftOptions || {});

        css.walk(function(node) {
            // skip comment nodes
            if (node.type == 'comment') return;

            // process other node types
            switch (node.type)
            {
                case 'decl':
                    processDeclaration(node, opts, Shift);
                    break;
                case 'rule':
                    processRule(node, opts, Shift);
                    break;
                case 'atrule':
                    processAtRule(node, opts, Shift);
                    break;
            }
        });

        // remove all nodes that were consumed
        removables.forEach(function(node) {
            node.remove();
        });

        // return resulting css
        return css;
    };

});