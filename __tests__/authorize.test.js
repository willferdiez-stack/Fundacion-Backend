import { describe, it, expect, vi } from "vitest";
import { authorize } from "../src/middlewares/authorize.middleware.js";

describe("Middleware de autorización", () => {

    it("permite el acceso a un administrador", () => {
        const req = {
            user: { role: "admin" }
        };
        const res = {};
        const next = vi.fn();

        authorize("admin")(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    it("negarle el acceso a quien no es administrador", () => {
        const req = {
            user: { role: "user" }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        authorize("admin")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});