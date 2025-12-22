import { randomUUID } from "crypto";

// Simple in-memory SSE hub (single-node). If you run multiple backend replicas,
// you'll need a shared pubsub (Redis, etc.).

const connections = new Map();
// userId -> Map(connId -> { res, role })

function getUserConnections(userId) {
    const key = Number(userId);
    if (!connections.has(key)) connections.set(key, new Map());
    return connections.get(key);
}

function sseWrite(res, { event, data }) {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
}

export function sseInit(res) {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
}

export function subscribeRealtime({ userId, role, res }) {
    const id = randomUUID();
    const userMap = getUserConnections(userId);
    userMap.set(id, { res, role });

    // initial hello
    sseWrite(res, { event: "hello", data: { ok: true, at: new Date().toISOString() } });

    const ping = setInterval(() => {
        try {
            // comment ping to keep connection alive
            res.write(`: ping ${Date.now()}\n\n`);
        } catch {
            // ignore
        }
    }, 20000);

    res.on("close", () => {
        clearInterval(ping);
        const map = connections.get(Number(userId));
        map?.delete(id);
        if (map && map.size === 0) connections.delete(Number(userId));
    });

    return id;
}

export function publishToUser(userId, event, data) {
    const map = connections.get(Number(userId));
    if (!map) return;

    for (const { res } of map.values()) {
        try {
            sseWrite(res, { event, data });
        } catch {
            // ignore broken connections
        }
    }
}

export function publishToRoles(roles, event, data) {
    const allowed = new Set((roles || []).filter(Boolean));
    if (allowed.size === 0) return;

    for (const [, userMap] of connections.entries()) {
        for (const { res, role } of userMap.values()) {
            if (!allowed.has(role)) continue;
            try {
                sseWrite(res, { event, data });
            } catch {
                // ignore
            }
        }
    }
}
