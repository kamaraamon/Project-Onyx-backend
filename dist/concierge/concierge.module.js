"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConciergeModule = void 0;
const common_1 = require("@nestjs/common");
const concierge_controller_1 = require("./concierge.controller");
const concierge_service_1 = require("./concierge.service");
const auth_module_1 = require("../auth/auth.module");
let ConciergeModule = class ConciergeModule {
};
exports.ConciergeModule = ConciergeModule;
exports.ConciergeModule = ConciergeModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [concierge_controller_1.ConciergeController],
        providers: [concierge_service_1.ConciergeService],
        exports: [concierge_service_1.ConciergeService],
    })
], ConciergeModule);
//# sourceMappingURL=concierge.module.js.map