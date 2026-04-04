const { broadcastToLobby } = require('./index');

describe('broadcastToLobbyTest', () => {
  it('sends the message to all players in the lobby', () => {
    // Arrange: mock lobby and clients
    const lobbyId = 'lobby1';
    const playerIds = ['client1', 'client2'];
    const stringifiedMessage = JSON.stringify({ foo: 'bar' });

    // Mock send function
    const sendMock1 = jest.fn();
    const sendMock2 = jest.fn();

    // Mock clients map
    const clientsMap = new Map([
      ['client1', { connection: { connected: true, send: sendMock1 } }],
      ['client2', { connection: { connected: true, send: sendMock2 } }],
    ]);

    // Mock lobbies map
    const lobbiesMap = new Map([
      [lobbyId, { players: playerIds }],
    ]);

    // Act
    broadcastToLobby(lobbyId, stringifiedMessage, lobbiesMap, clientsMap);

    // Assert
    expect(sendMock1).toHaveBeenCalledWith(stringifiedMessage);
    expect(sendMock2).toHaveBeenCalledWith(stringifiedMessage);
  });
});
