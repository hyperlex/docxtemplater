"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../doc-utils"),
    mergeObjects = _require.mergeObjects,
    chunkBy = _require.chunkBy,
    last = _require.last,
    isParagraphStart = _require.isParagraphStart,
    isParagraphEnd = _require.isParagraphEnd,
    isContent = _require.isContent;

var wrapper = require("../module-wrapper");

var _require2 = require("../prefix-matcher"),
    match = _require2.match,
    getValue = _require2.getValue,
    getValues = _require2.getValues;

var moduleName = "loop";

function hasContent(parts) {
  return parts.some(function (part) {
    return isContent(part);
  });
}

function isEnclosedByParagraphs(parsed) {
  if (parsed.length === 0) {
    return false;
  }

  return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
}

function getOffset(chunk) {
  return hasContent(chunk) ? 0 : chunk.length;
}

var LoopModule =
/*#__PURE__*/
function () {
  function LoopModule() {
    _classCallCheck(this, LoopModule);

    this.name = "LoopModule";
    this.prefix = {
      start: "#",
      end: "/",
      dash: /^-([^\s]+)\s(.+)$/,
      inverted: "^"
    };
  }

  _createClass(LoopModule, [{
    key: "parse",
    value: function parse(placeHolderContent) {
      var module = moduleName;
      var type = "placeholder";
      var _this$prefix = this.prefix,
          start = _this$prefix.start,
          inverted = _this$prefix.inverted,
          dash = _this$prefix.dash,
          end = _this$prefix.end;

      if (match(start, placeHolderContent)) {
        return {
          type: type,
          value: getValue(start, placeHolderContent),
          expandTo: "auto",
          module: module,
          location: "start",
          inverted: false
        };
      }

      if (match(inverted, placeHolderContent)) {
        return {
          type: type,
          value: getValue(inverted, placeHolderContent),
          expandTo: "auto",
          module: module,
          location: "start",
          inverted: true
        };
      }

      if (match(end, placeHolderContent)) {
        return {
          type: type,
          value: getValue(end, placeHolderContent),
          module: module,
          location: "end"
        };
      }

      if (match(dash, placeHolderContent)) {
        var _getValues = getValues(dash, placeHolderContent),
            _getValues2 = _slicedToArray(_getValues, 3),
            expandTo = _getValues2[1],
            value = _getValues2[2];

        return {
          type: type,
          value: value,
          expandTo: expandTo,
          module: module,
          location: "start",
          inverted: false
        };
      }

      return null;
    }
  }, {
    key: "getTraits",
    value: function getTraits(traitName, parsed) {
      if (traitName !== "expandPair") {
        return;
      }

      return parsed.reduce(function (tags, part, offset) {
        if (part.type === "placeholder" && part.module === moduleName) {
          tags.push({
            part: part,
            offset: offset
          });
        }

        return tags;
      }, []);
    }
  }, {
    key: "postparse",
    value: function postparse(parsed, _ref) {
      var basePart = _ref.basePart;

      if (!isEnclosedByParagraphs(parsed)) {
        return parsed;
      }

      if (!basePart || basePart.expandTo !== "auto" || basePart.module !== moduleName) {
        return parsed;
      }

      var level = 0;
      var chunks = chunkBy(parsed, function (p) {
        if (isParagraphStart(p)) {
          level++;

          if (level === 1) {
            return "start";
          }
        }

        if (isParagraphEnd(p)) {
          level--;

          if (level === 0) {
            return "end";
          }
        }

        return null;
      });

      if (chunks.length <= 2) {
        return parsed;
      }

      var firstChunk = chunks[0];
      var lastChunk = last(chunks);
      var firstOffset = getOffset(firstChunk);
      var lastOffset = getOffset(lastChunk);

      if (firstOffset === 0 || lastOffset === 0) {
        return parsed;
      }

      return parsed.slice(firstOffset, parsed.length - lastOffset);
    }
  }, {
    key: "render",
    value: function render(part, options) {
      if (part.type !== "placeholder" || part.module !== moduleName) {
        return null;
      }

      var totalValue = [];
      var errors = [];

      function loopOver(scope, i) {
        var scopeManager = options.scopeManager.createSubScopeManager(scope, part.value, i, part);
        var subRendered = options.render(mergeObjects({}, options, {
          compiled: part.subparsed,
          tags: {},
          scopeManager: scopeManager
        }));
        totalValue = totalValue.concat(subRendered.parts);
        errors = errors.concat(subRendered.errors || []);
      }

      var result = options.scopeManager.loopOver(part.value, loopOver, part.inverted, {
        part: part
      });

      if (result === false) {
        return {
          value: part.emptyValue || "",
          errors: errors
        };
      }

      return {
        value: totalValue.join(""),
        errors: errors
      };
    }
  }, {
    key: "resolve",
    value: function resolve(part, options) {
      if (part.type !== "placeholder" || part.module !== moduleName) {
        return null;
      }

      var sm = options.scopeManager;
      var promisedValue = sm.getValue(part.value, {
        part: part
      });
      var promises = [];

      function loopOver(scope, i) {
        var scopeManager = sm.createSubScopeManager(scope, part.value, i, part);
        promises.push(options.resolve({
          filePath: options.filePath,
          modules: options.modules,
          baseNullGetter: options.baseNullGetter,
          resolve: options.resolve,
          compiled: part.subparsed,
          tags: {},
          scopeManager: scopeManager
        }));
      }

      return Promise.resolve(promisedValue).then(function (value) {
        sm.loopOverValue(value, loopOver, part.inverted);
        return Promise.all(promises).then(function (r) {
          return r.map(function (_ref2) {
            var resolved = _ref2.resolved;
            return resolved;
          });
        });
      });
    }
  }]);

  return LoopModule;
}();

module.exports = function () {
  return wrapper(new LoopModule());
};