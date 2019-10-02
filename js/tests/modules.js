"use strict";

var _require = require("./utils"),
    expectToThrow = _require.expectToThrow,
    createDoc = _require.createDoc;

var Errors = require("../errors.js");

describe("Verify apiversion", function () {
  it("should work with valid api version", function () {
    var module = {
      requiredAPIVersion: "3.12.0",
      render: function render(part) {
        return part.value;
      }
    };
    var doc = createDoc("loop-valid.docx");
    doc.attachModule(module);
  });
  it("should fail with valid api version", function () {
    var module = {
      requiredAPIVersion: "3.92.0",
      render: function render(part) {
        return part.value;
      }
    };
    var doc = createDoc("loop-valid.docx");
    expectToThrow(function () {
      return doc.attachModule(module);
    }, Errors.XTAPIVersionError, {
      message: "The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
      name: "APIVersionError",
      properties: {
        id: "api_version_error",
        currentModuleApiVersion: [3, 12, 0],
        neededVersion: [3, 92, 0]
      }
    });
  });
});