"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("./doc-utils"),
    wordToUtf8 = _require.wordToUtf8,
    convertSpaces = _require.convertSpaces,
    defaults = _require.defaults;

var createScope = require("./scope-manager");

var xmlMatcher = require("./xml-matcher");

var _require2 = require("./errors"),
    throwMultiError = _require2.throwMultiError,
    throwContentMustBeString = _require2.throwContentMustBeString;

var Lexer = require("./lexer");

var Parser = require("./parser.js");

var _render = require("./render.js");

var postrender = require("./postrender.js");

var resolve = require("./resolve.js");

function _getFullText(content, tagsXmlArray) {
  var matcher = xmlMatcher(content, tagsXmlArray);
  var result = matcher.matches.map(function (match) {
    return match.array[2];
  });
  return wordToUtf8(convertSpaces(result.join("")));
}

module.exports =
/*#__PURE__*/
function () {
  function XmlTemplater(content, options) {
    _classCallCheck(this, XmlTemplater);

    this.filePath = options.filePath;
    this.modules = options.modules;
    this.fileTypeConfig = options.fileTypeConfig;
    Object.keys(defaults).map(function (key) {
      this[key] = options[key] != null ? options[key] : defaults[key];
    }, this);
    this.setModules({
      inspect: {
        filePath: this.filePath
      }
    });
    this.load(content);
  }

  _createClass(XmlTemplater, [{
    key: "load",
    value: function load(content) {
      if (typeof content !== "string") {
        throwContentMustBeString(_typeof(content));
      }

      var replaced = content.replace(/<w:sym w:font="Symbol" w:char="F07B"\/>/g, '<w:t>{</w:t>').replace(/<w:sym w:font="Symbol" w:char="F07D"\/>/g, '<w:t>}</w:t>');
      this.content = replaced;
    }
  }, {
    key: "setTags",
    value: function setTags(tags) {
      this.tags = tags != null ? tags : {};
      this.scopeManager = createScope({
        tags: this.tags,
        parser: this.parser
      });
      return this;
    }
  }, {
    key: "resolveTags",
    value: function resolveTags(tags) {
      var _this = this;

      this.tags = tags != null ? tags : {};
      this.scopeManager = createScope({
        tags: this.tags,
        parser: this.parser
      });
      var options = this.getOptions();
      options.scopeManager = createScope(options);
      options.resolve = resolve;
      return resolve(options).then(function (_ref) {
        var resolved = _ref.resolved;
        return Promise.all(resolved.map(function (r) {
          return Promise.resolve(r);
        })).then(function (resolved) {
          _this.setModules({
            inspect: {
              resolved: resolved
            }
          });

          return _this.resolved = resolved;
        });
      });
    }
  }, {
    key: "getFullText",
    value: function getFullText() {
      return _getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
    }
  }, {
    key: "setModules",
    value: function setModules(obj) {
      this.modules.forEach(function (module) {
        module.set(obj);
      });
    }
  }, {
    key: "parse",
    value: function parse() {
      var allErrors = [];
      this.xmllexed = Lexer.xmlparse(this.content, {
        text: this.fileTypeConfig.tagsXmlTextArray,
        other: this.fileTypeConfig.tagsXmlLexedArray
      });
      this.setModules({
        inspect: {
          xmllexed: this.xmllexed
        }
      });

      var _Lexer$parse = Lexer.parse(this.xmllexed, this.delimiters),
          lexed = _Lexer$parse.lexed,
          lexerErrors = _Lexer$parse.errors;

      allErrors = allErrors.concat(lexerErrors);
      this.lexed = lexed;
      this.setModules({
        inspect: {
          lexed: this.lexed
        }
      });
      this.parsed = Parser.parse(this.lexed, this.modules);
      this.setModules({
        inspect: {
          parsed: this.parsed
        }
      });

      var _Parser$postparse = Parser.postparse(this.parsed, this.modules),
          postparsed = _Parser$postparse.postparsed,
          postparsedErrors = _Parser$postparse.errors;

      this.postparsed = postparsed;
      this.setModules({
        inspect: {
          postparsed: this.postparsed
        }
      });
      allErrors = allErrors.concat(postparsedErrors);
      this.errorChecker(allErrors);
      return this;
    }
  }, {
    key: "errorChecker",
    value: function errorChecker(errors) {
      var _this2 = this;

      if (errors.length) {
        this.modules.forEach(function (module) {
          errors = module.errorsTransformer(errors);
        });
        errors.forEach(function (error) {
          error.properties.file = _this2.filePath;
        });
        throwMultiError(errors);
      }
    }
  }, {
    key: "baseNullGetter",
    value: function baseNullGetter(part, sm) {
      var _this3 = this;

      var value = this.modules.reduce(function (value, module) {
        if (value != null) {
          return value;
        }

        return module.nullGetter(part, sm, _this3);
      }, null);

      if (value != null) {
        return value;
      }

      return this.nullGetter(part, sm);
    }
  }, {
    key: "getOptions",
    value: function getOptions() {
      return {
        compiled: this.postparsed,
        tags: this.tags,
        modules: this.modules,
        parser: this.parser,
        baseNullGetter: this.baseNullGetter.bind(this),
        filePath: this.filePath,
        linebreaks: this.linebreaks
      };
    }
  }, {
    key: "render",
    value: function render(to) {
      this.filePath = to;
      var options = this.getOptions();
      options.resolved = this.resolved;
      options.scopeManager = createScope(options);
      options.render = _render;

      var _render2 = _render(options),
          errors = _render2.errors,
          parts = _render2.parts;

      this.errorChecker(errors);
      this.content = postrender(parts, options);
      this.setModules({
        inspect: {
          content: this.content
        }
      });
      return this;
    }
  }]);

  return XmlTemplater;
}();