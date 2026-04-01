const { httpServer } = require('./index');

const PORT = 9090;
httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
