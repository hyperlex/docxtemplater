"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var expressions = require("angular-expressions");

function angularParser(tag) {
  if (tag === ".") {
    return {
      get: function get(s) {
        return s;
      }
    };
  }

  var expr = expressions.compile(tag.replace(/(’|“|”|‘)/g, "'"));
  return {
    get: function get(s, options) {
      return expr.apply(void 0, _toConsumableArray(options.scopeList));
    }
  };
}

module.exports = angularParser;