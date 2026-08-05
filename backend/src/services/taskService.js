"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = exports.TaskService = void 0;
var Task_1 = require("../models/Task");
var TaskService = /** @class */ (function () {
    function TaskService(model) {
        if (model === void 0) { model = Task_1.Task; }
        this.model = model;
    }
    TaskService.prototype.create = function (input) {
        return this.model.create(input);
    };
    TaskService.prototype.update = function (filter, update) {
        return this.model.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    };
    TaskService.prototype.remove = function (filter) {
        return this.model.findOneAndUpdate(filter, { $set: { removed: true } }, { new: true, runValidators: true });
    };
    return TaskService;
}());
exports.TaskService = TaskService;
exports.taskService = new TaskService();
