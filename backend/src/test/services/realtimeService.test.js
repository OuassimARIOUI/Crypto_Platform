const { describe, it, expect, beforeEach, afterEach, vi } = require('@jest/globals');
const realtimeService = require('../../services/realtimeService');

describe('Realtime Service', () => {
  let mockResponse;
  let clients;

  beforeEach(() => {
    mockResponse = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
      socket: {
        setTimeout: vi.fn()
      }
    };
    clients = new Set();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addClient', () => {
    it('adds a client to the set', () => {
      const initialSize = clients.size;
      realtimeService.addClient(mockResponse);
      
      expect(mockResponse.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      expect(mockResponse.write).toHaveBeenCalled();
    });

    it('sets correct SSE headers', () => {
      realtimeService.addClient(mockResponse);
      
      expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
    });

    it('sends initial connection message', () => {
      realtimeService.addClient(mockResponse);
      
      const writeCall = mockResponse.write.mock.calls[0][0];
      expect(writeCall).toContain('data: ');
      expect(writeCall).toContain('connected');
    });

    it('sets socket timeout', () => {
      realtimeService.addClient(mockResponse);
      expect(mockResponse.socket.setTimeout).toHaveBeenCalled();
    });
  });

  describe('removeClient', () => {
    it('removes a client from the set', () => {
      realtimeService.addClient(mockResponse);
      const result = realtimeService.removeClient(mockResponse);
      
      expect(result).toBe(true);
    });

    it('returns false when client not found', () => {
      const result = realtimeService.removeClient(mockResponse);
      expect(result).toBe(false);
    });

    it('ends the response when removing', () => {
      realtimeService.addClient(mockResponse);
      realtimeService.removeClient(mockResponse);
      
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('broadcastUpdate', () => {
    it('sends update to all clients', () => {
      const client1 = { ...mockResponse };
      const client2 = { ...mockResponse };
      
      realtimeService.addClient(client1);
      realtimeService.addClient(client2);
      
      const data = { price: 50000, crypto: 'BTC' };
      realtimeService.broadcastUpdate('price', data);
      
      expect(client1.write).toHaveBeenCalled();
      expect(client2.write).toHaveBeenCalled();
    });

    it('formats message correctly', () => {
      realtimeService.addClient(mockResponse);
      
      const data = { test: 'value' };
      realtimeService.broadcastUpdate('test-event', data);
      
      const lastWrite = mockResponse.write.mock.calls[mockResponse.write.mock.calls.length - 1][0];
      expect(lastWrite).toContain('event: test-event');
      expect(lastWrite).toContain('data: ');
      expect(lastWrite).toContain(JSON.stringify(data));
    });

    it('handles errors when writing to closed clients', () => {
      mockResponse.write = vi.fn().mockImplementation(() => {
        throw new Error('Client disconnected');
      });
      
      realtimeService.addClient(mockResponse);
      
      expect(() => {
        realtimeService.broadcastUpdate('test', {});
      }).not.toThrow();
    });
  });

  describe('sendToClient', () => {
    it('sends message to specific client', () => {
      realtimeService.addClient(mockResponse);
      
      const data = { message: 'Hello' };
      realtimeService.sendToClient(mockResponse, 'greeting', data);
      
      const lastWrite = mockResponse.write.mock.calls[mockResponse.write.mock.calls.length - 1][0];
      expect(lastWrite).toContain('event: greeting');
      expect(lastWrite).toContain(JSON.stringify(data));
    });

    it('does not send to other clients', () => {
      const client1 = { ...mockResponse };
      const client2 = { write: vi.fn(), ...mockResponse };
      
      realtimeService.addClient(client1);
      realtimeService.addClient(client2);
      
      const initialCallCount = client2.write.mock.calls.length;
      realtimeService.sendToClient(client1, 'test', { data: 'test' });
      
      expect(client2.write.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('getClientCount', () => {
    it('returns correct number of clients', () => {
      expect(realtimeService.getClientCount()).toBe(0);
      
      realtimeService.addClient(mockResponse);
      expect(realtimeService.getClientCount()).toBe(1);
      
      const client2 = { ...mockResponse };
      realtimeService.addClient(client2);
      expect(realtimeService.getClientCount()).toBe(2);
      
      realtimeService.removeClient(mockResponse);
      expect(realtimeService.getClientCount()).toBe(1);
    });
  });
});
