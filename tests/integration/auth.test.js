"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../src/app"));
const database_1 = require("../../src/config/database");
const user_model_1 = require("../../src/models/user.model");
let mongoServer;
beforeAll(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    await (0, database_1.connectToDatabase)();
});
afterAll(async () => {
    await (0, database_1.disconnectFromDatabase)();
    await mongoose_1.default.connection.close();
    await mongoServer.stop();
});
beforeEach(async () => {
    await user_model_1.UserModel.deleteMany({});
});
describe('Auth API', () => {
    it('registers and logs in a user', async () => {
        const registerResponse = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/auth/register')
            .send({
            email: 'user@example.com',
            password: 'StrongPass!1234'
        })
            .expect(201);
        expect(registerResponse.body.status).toBe('success');
        expect(registerResponse.body.data.tokens.accessToken).toBeDefined();
        expect(registerResponse.headers['set-cookie']).toBeDefined();
        const loginResponse = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/auth/login')
            .send({
            email: 'user@example.com',
            password: 'StrongPass!1234'
        })
            .expect(200);
        const accessToken = loginResponse.body.data.tokens.accessToken;
        expect(accessToken).toBeDefined();
        await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
    });
});
//# sourceMappingURL=auth.test.js.map