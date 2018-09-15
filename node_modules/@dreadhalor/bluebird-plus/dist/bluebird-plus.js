"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var queue_1 = require("./queue");
var BluebirdPlus;
(function (BluebirdPlus) {
    var Promise = require('bluebird');
    var nestedPromiseAll = function (groups, fxn) {
        return Promise.all(groups.map(function (group) { return Promise.all(group.map(function (single) { return fxn(single); })); }));
    };
    var sequentialPromiseAll = function (groups, fxn) {
        return Promise.each(groups, function (group) { return Promise.all(group.map(function (single) { return fxn(single); })); });
    };
    exports.Queue = queue_1.Queue;
    exports.nestedPromiseAll = nestedPromiseAll;
    exports.sequentialPromiseAll = sequentialPromiseAll;
})(BluebirdPlus = exports.BluebirdPlus || (exports.BluebirdPlus = {}));
//# sourceMappingURL=bluebird-plus.js.map