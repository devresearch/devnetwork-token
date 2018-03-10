const DEVToken = artifacts.require("./DEVToken.sol");
const TokenTimelock = artifacts.require("./TokenTimelock.sol");

module.exports = function (deployer, network, accounts) {
  const now = new Date()
  const nowTimeUnix = Math.floor(now.getTime() / 1000)
  const oneYearLaterTimeUnix = Math.floor(
    new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
  )
  
  if (network == 'test') {
    deployer.deploy(DEVToken);
  } else {
    deployer.deploy(DEVToken).then(() => {
      return deployer.deploy(
        TokenTimelock,
        DEVToken.address,
        network == 'live' || network == 'ropsten' ? process.env.FOUNDATION : accounts[1],
        oneYearLaterTimeUnix
      );
    });
  }
};
