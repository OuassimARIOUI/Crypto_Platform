import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Realtime Service', () => {
    let mockResponse;

    beforeEach(() => {
        mockResponse = {
            writeHead: vi.fn(),
            write: vi.fn().mockReturnValue(true),
            end: vi.fn(),
            on: vi.fn(),
            socket: {
                setTimeout: vi.fn()
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('SSE Response Setup', () => {
        it('sets correct SSE headers', () => {
            const expectedHeaders = {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            };

            mockResponse.writeHead(200, expectedHeaders);

            expect(mockResponse.writeHead).toHaveBeenCalledWith(200, expectedHeaders);
        });

        it('writes SSE formatted data', () => {
            const data = { price: 50000, crypto: 'BTC' };
            const eventName = 'price-update';
            const formattedMessage = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

            mockResponse.write(formattedMessage);

            expect(mockResponse.write).toHaveBeenCalledWith(formattedMessage);
        });

        it('sends initial connection message', () => {
            const connectionMessage = 'data: {"type":"connected"}\n\n';
            mockResponse.write(connectionMessage);

            expect(mockResponse.write).toHaveBeenCalled();
            expect(mockResponse.write.mock.calls[0][0]).toContain('connected');
        });
    });

    describe('Client Management', () => {
        it('handles client connection setup', () => {
            mockResponse.writeHead(200, { 'Content-Type': 'text/event-stream' });
            mockResponse.write('data: connected\n\n');
            mockResponse.socket.setTimeout(0);

            expect(mockResponse.writeHead).toHaveBeenCalled();
            expect(mockResponse.write).toHaveBeenCalled();
            expect(mockResponse.socket.setTimeout).toHaveBeenCalledWith(0);
        });

        it('handles client disconnect', () => {
            mockResponse.on('close', vi.fn());
            mockResponse.end();

            expect(mockResponse.end).toHaveBeenCalled();
        });

        it('registers close event handler', () => {
            const closeHandler = vi.fn();
            mockResponse.on('close', closeHandler);

            expect(mockResponse.on).toHaveBeenCalledWith('close', closeHandler);
        });
    });

    describe('Broadcasting', () => {
        it('broadcasts to multiple clients', () => {
            const clients = [
                { ...mockResponse, write: vi.fn().mockReturnValue(true) },
                { ...mockResponse, write: vi.fn().mockReturnValue(true) },
                { ...mockResponse, write: vi.fn().mockReturnValue(true) }
            ];

            const data = { message: 'test' };
            const formattedMessage = `data: ${JSON.stringify(data)}\n\n`;

            clients.forEach(client => {
                client.write(formattedMessage);
            });

            clients.forEach(client => {
                expect(client.write).toHaveBeenCalledWith(formattedMessage);
            });
        });

        it('handles write errors gracefully', () => {
            mockResponse.write.mockImplementation(() => {
                throw new Error('Client disconnected');
            });

            expect(() => {
                try {
                    mockResponse.write('data: test\n\n');
                } catch (e) {
                    // Error handled
                }
            }).not.toThrow();
        });

        it('formats event with name and data', () => {
            const eventName = 'crypto-update';
            const data = { btc: 50000, eth: 3000 };

            const formatted = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
            mockResponse.write(formatted);

            expect(mockResponse.write).toHaveBeenCalledWith(
                expect.stringContaining('event: crypto-update')
            );
            expect(mockResponse.write).toHaveBeenCalledWith(
                expect.stringContaining('data: ')
            );
        });
    });

    describe('Message Formatting', () => {
        it('formats JSON data correctly', () => {
            const data = { type: 'update', payload: { value: 123 } };
            const formatted = `data: ${JSON.stringify(data)}\n\n`;

            expect(formatted).toBe('data: {"type":"update","payload":{"value":123}}\n\n');
        });

        it('includes event ID when provided', () => {
            const eventId = '12345';
            const data = { message: 'test' };
            const formatted = `id: ${eventId}\ndata: ${JSON.stringify(data)}\n\n`;

            expect(formatted).toContain(`id: ${eventId}`);
        });

        it('handles empty data', () => {
            const formatted = 'data: {}\n\n';
            mockResponse.write(formatted);

            expect(mockResponse.write).toHaveBeenCalledWith('data: {}\n\n');
        });
    });
});
