"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlVarsUtils = void 0;
const SERVERCOUNT = {
    daysCount: 0,
};
const addDay = () => (SERVERCOUNT.daysCount = SERVERCOUNT.daysCount + 1);
exports.ControlVarsUtils = {
    SERVERCOUNT,
    addDay,
};
