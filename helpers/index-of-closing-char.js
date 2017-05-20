// finds the index of the closing character in given string
// (works with nested open/close character pairs)
module.exports = function(str, open, close, openPos)
{
    var closePos = openPos,
      lvl = 1,
      char;

    // for identical delimiters (such as '"' and "'")
    if (close == open) {
      // return index of next occurence
      return str.indexOf(close, open);
    }

    while (lvl > 0 && closePos <= str.length)
    {
      // check next character in string
      char = str[++closePos];
      if (char == open) {
        lvl++;
      } else if (char == close) {
        lvl--;
      }
    }

    return closePos;
};