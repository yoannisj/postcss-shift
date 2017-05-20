var SassValue = require('../helpers/sass-value');

// gets all shift values found in given string
module.exports = function(node, str, opts, shift)
{
    // parse variables in given string
    str = SassValue.parseVariables(node, str);

    // verify all map values in parsed string
    var values = [],
        maps = SassValue.getMapValues(str);

    if (maps.length)
    {
        for (var i = 0, ln = maps.length; i<ln; i++)
        {
            if (shift.isShiftValue(maps[i])) {
                values.push(maps[i]);
            }
        }
    }

    return values;
}