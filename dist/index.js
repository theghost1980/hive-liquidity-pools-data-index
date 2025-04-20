"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAINDATADIR = exports.configServer = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config/config");
const init_1 = require("./init-scripts/init");
const admin_1 = __importDefault(require("./routes/admin"));
const auth_1 = __importDefault(require("./routes/auth"));
const public_1 = __importDefault(require("./routes/public"));
const swagger_1 = __importDefault(require("./swagger/swagger"));
const logger_utils_1 = require("./utils/logger.utils");
const serveIndex = require("serve-index");
dotenv_1.default.config();
exports.configServer = (0, config_1.loadAndValidateConfig)();
const app = (0, express_1.default)();
exports.MAINDATADIR = path_1.default.join(__dirname, "../data");
app.use((0, cors_1.default)());
app.use("/data", express_1.default.static(exports.MAINDATADIR), serveIndex(exports.MAINDATADIR, { icons: true }));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "index.html"));
});
app.get("/index-es.html", (req, res) => res.sendFile(path_1.default.join(__dirname, "index-es.html")));
app.use(express_1.default.json());
app.use("/auth", auth_1.default);
app.use("/public", public_1.default);
app.use("/admin", admin_1.default);
(0, swagger_1.default)(app, exports.configServer.listeningPort, exports.configServer.currentServer.url);
const initialize = () => {
    logger_utils_1.Logger.info("Init Scripts!!");
    (0, init_1.initScripts)();
};
app.listen(exports.configServer.listeningPort, () => {
    initialize();
    logger_utils_1.Logger.info(`Server is running at PORT:${exports.configServer.listeningPort}`);
});
