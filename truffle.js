require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    live: {
      host: "localhost",
      port: 8545,
      network_id: "1",
      gas: 4700000
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
