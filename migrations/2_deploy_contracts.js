const DEVToken = artifacts.require("./DEVToken.sol");

module.exports = function (deployer, network, accounts) {
  const now = new Date()
  const nowTimeUnix = Math.floor(now.getTime() / 1000)
  const oneYearLaterTimeUnix = Math.floor(
    new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
  )

  if (network == 'live') {
    deployer.deploy(DEVToken, process.env.FOUNDATION_ADDRESS, nowTimeUnix, oneYearLaterTimeUnix);
  } else {
    deployer.deploy(DEVToken, accounts[1], nowTimeUnix, oneYearLaterTimeUnix);
  }
};
