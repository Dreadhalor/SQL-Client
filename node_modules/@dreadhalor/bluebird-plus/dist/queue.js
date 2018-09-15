"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = /** @class */ (function () {
    function Queue() {
        this.running = false;
        this.queue = [];
    }
    Queue.prototype.queuePromise = function (args, fxn) {
        var pair = {
            args: args,
            fxn: fxn
        };
        this.queue.push(pair);
        if (!this.running)
            this.advanceQueue();
    };
    Queue.prototype.advanceQueue = function () {
        var _this = this;
        this.running = true;
        if (this.queue.length > 0) {
            var pair = this.queue.pop();
            pair.fxn(pair.args)
                .then(function (success) { return _this.advanceQueue(); })
                .catch(function (error) { return _this.advanceQueue(); });
        }
        else
            this.running = false;
    };
    Queue.prototype.push = function (args, fxn) {
        this.queuePromise(args, fxn);
    };
    return Queue;
}());
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map