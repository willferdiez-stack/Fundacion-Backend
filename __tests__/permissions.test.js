import { describe, it, expect } from "vitest";
import { canModifyAnomaly } from "../src/utils/permissions.js";

describe("Permisos de anomalías", () => {

    it("permite modificar una anomalía a su propietario", () => {

        const user = {
            id: "123",
            role: "user"
        };

        const anomaly = {
            owner: "123"
        };

        const result = canModifyAnomaly(user, anomaly);

        expect(result).toBe(true);
    });

    it("permite modificar cualquier anomalía a un administrador", () => {
        const user = {
            id: "999",
            role: "admin"
        };

        const anomaly = {
            owner: "123"
        };

        const result = canModifyAnomaly(user, anomaly);

        expect(result).toBe(true);
    });

    it("un investigador no puede modificar una anomalía ajena", () => {
        const user = {
            id: "999",
            role: "user"
        };

        const anomaly = {
            owner: "123"
        };

        const result = canModifyAnomaly(user, anomaly);

        expect(result).toBe(false);
    });

    it("un usuario Clase C no puede modificar anomalías aunque sea propietario", () => {
        const user = {
            id: "123",
            role: "classC"
        };

        const anomaly = {
            owner: "123"
        };

        const result = canModifyAnomaly(user, anomaly);

        expect(result).toBe(false);
    });
});
