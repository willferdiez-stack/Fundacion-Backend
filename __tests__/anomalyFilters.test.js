import { describe, it, expect, vi, afterEach } from "vitest";
import Anomaly from "../src/models/anomaly.js";
import { getAnomalies } from "../src/controllers/anomaly.controller.js";

describe("Filtros de anomalías", () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("filtra las anomalías por clase de contención", async () => {

        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "user" },
            query: { containmentClass: "Keter" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(findMock).toHaveBeenCalledWith({
            containmentClass: "Keter"
        });
    });

    it("filtra las anomalías por peligrosidad mínima", async () => {

        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "user" },
            query: { minDanger: "4" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(findMock).toHaveBeenCalledWith({
            dangerLevel: { $gte: 4 }
        });
    });

    it("filtra las anomalías por nombre", async () => {

        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "user" },
            query: { name: "REL" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(findMock).toHaveBeenCalledWith({
            name: {
                $regex: "REL",
                $options: "i"
            }
        });
    });

    it("rechaza una clase de contención no válida", async () => {
        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "user" },
            query: { containmentClass: "Patata" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 400,
                message: "Clase de contención no válida"
            })
        );

        expect(findMock).not.toHaveBeenCalled();
    });

    it("rechaza un nivel peligrosidad no válido", async () => {

        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "user" },
            query: { minDanger: "8" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 400,
                message: "El nivel mínimo debe ser un entero entre 1 y 5"
            })
        );

        expect(findMock).not.toHaveBeenCalled();
    });

    it("Restricción de búsqueda para clase C", async () => {

        const findMock = vi.spyOn(Anomaly, "find").mockResolvedValue([]);

        const req = {
            user: { id: "123", role: "classC" },
            query: {
                containmentClass: "Keter",
                minDanger: "4"
            }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        const next = vi.fn();

        await getAnomalies(req, res, next);

        expect(findMock).toHaveBeenCalledWith({
            authorizedReaders: "123",
            containmentClass: "Keter",
            dangerLevel: { $gte: 4 }
        });
    });

});