var CssTree = module.exports = {};

// runs given callback on previous nodes (not the descendants)
CssTree.eachBefore = function(node, callback)
{
    // loop over previous siblings of current node
    for (var p = node.parent, i = 0; i < p.index(node); i++) {
        // run callback with sibling
        callback(p.nodes[i]);
    }
}

// runs given callback on previous and descending nodes
CssTree.walkBefore = function(node, callback)
{
    // loop over previous siblings of current node
    for (var p = node.parent, i = 0; i < p.index(node); i++) {
        var sibling = p.nodes[i];
        // run callback with sibling
        callback(sibling);
        // run callback with sibling's descendants
        sibling.walk(callback);
    }
}

// runs given callback on following nodes (not the descendants)
CssTree.eachAfter = function(node, callback)
{
    // loop over following siblings of current node
    for (var p = node.parent, i = p.index(node) + 1; i < p.nodes.length; i++) {
        // run callback with sibling
        callback(p.nodes[i]);
    }
}

// runs given callback on following and descending nodes
CssTree.walkAfter = function(node, callback)
{
    // loop over following siblings of current node
    for (var p = node.parent, i = p.index(node) + 1; i < p.nodes.length; i++) {
        var sibling = p.nodes[i];
        // run callback with sibling
        callback(sibling);
        // run callback with sibling's descendants
        sibling.walk(callback);
    }
}

// returns all ancestor nodes that pass given test
CssTree.findAncestors = function(node, test)
{
    var found = [];

    while (node.type != 'root') {
        // check parent node
        node = node.parent;
        // return node if it passed given test
        if (test(node)) found.push(node);
    }

    return found;
};

// returns closes ancestor node that passes given test
CssTree.findClosest = function(node, test)
{
    while (node.type != 'root') {
        // check parent node
        node = node.parent;
        // return node if it passes given test
        if (test(node)) return node;
    }
};

// returns all descendant nodes that pass given test
CssTree.findDescendants = function(node, test)
{
    var found = [];

    node.walk(function(desc) {
        if (test(desc)) found.push(desc);
    });

    return found;
};

// returns all children nodes that pass given test
CssTree.findChildren = function(node, test)
{
    var found = [];

    node.each(function(child) {
        if (test(child)) found.push(child);
    });

    return found;
};

