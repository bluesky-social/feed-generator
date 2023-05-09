"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOnCommitAction = void 0;
const create_table_node_js_1 = require("../operation-node/create-table-node.js");
function parseOnCommitAction(action) {
    if (create_table_node_js_1.ON_COMMIT_ACTIONS.includes(action)) {
        return action;
    }
    throw new Error(`invalid OnCommitAction ${action}`);
}
exports.parseOnCommitAction = parseOnCommitAction;
