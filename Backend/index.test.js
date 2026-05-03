const { broadcastToLobby } = require('./index');

describe('broadcastToLobby', () => {
  it('sends the message to all connected players in the lobby', () => {
    const lobbyId = 'lobby1';
    const playerIds = ['client1', 'client2'];
    const stringifiedMessage = JSON.stringify({ foo: 'bar' });

    const sendMock1 = jest.fn();
    const sendMock2 = jest.fn();

    const clientsMap = new Map([
      ['client1', { connection: { connected: true, send: sendMock1 } }],
      ['client2', { connection: { connected: true, send: sendMock2 } }],
    ]);

    // lobby uses `playerIDS` in the current implementation
    const lobbiesMap = new Map([[lobbyId, { playerIDS: playerIds.slice() }]]);

    broadcastToLobby(lobbyId, stringifiedMessage, lobbiesMap, clientsMap);

    expect(sendMock1).toHaveBeenCalledWith(stringifiedMessage);
    expect(sendMock2).toHaveBeenCalledWith(stringifiedMessage);
  });

  it('filters out disconnected clients and updates lobby.playerIDS', () => {
    const lobbyId = 'lobby2';
    const playerIds = ['clientA', 'clientB', 'clientC'];
    const msg = JSON.stringify({ ping: true });

    const sendA = jest.fn();
    // clientB is disconnected
    const clientBConn = { connected: false, send: jest.fn() };
    const sendC = jest.fn();

    const clientsMap = new Map([
      ['clientA', { connection: { connected: true, send: sendA } }],
      ['clientB', { connection: clientBConn }],
      ['clientC', { connection: { connected: true, send: sendC } }],
    ]);

    const lobbiesMap = new Map([[lobbyId, { playerIDS: playerIds.slice() }]]);

    broadcastToLobby(lobbyId, msg, lobbiesMap, clientsMap);

    // connected clients should receive the message
    expect(sendA).toHaveBeenCalledWith(msg);
    expect(sendC).toHaveBeenCalledWith(msg);

    // lobby.playerIDS should have been filtered to remove clientB
    const updatedLobby = lobbiesMap.get(lobbyId);
    expect(updatedLobby.playerIDS).not.toContain('clientB');
    expect(updatedLobby.playerIDS).toEqual(expect.arrayContaining(['clientA', 'clientC']));
  });
});
