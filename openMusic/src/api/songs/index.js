const Songs = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'songs',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const songs = new Songs(service, validator);
    server.route(routes(songs));
  },
};
