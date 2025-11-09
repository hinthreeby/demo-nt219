"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../../src/utils/password");
describe('password utilities', () => {
    it('hashes and compares passwords correctly', async () => {
        const password = 'StrongPass!1234';
        const hash = await (0, password_1.hashPassword)(password);
        expect(hash).not.toEqual(password);
        await expect((0, password_1.comparePassword)(password, hash)).resolves.toBe(true);
        await expect((0, password_1.comparePassword)('wrongPassword123!', hash)).resolves.toBe(false);
    });
});
//# sourceMappingURL=password.test.js.map