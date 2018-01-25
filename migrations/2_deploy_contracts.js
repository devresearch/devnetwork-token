const DEVToken = artifacts.require("./DEVToken.sol");

module.exports = function(deployer) {
  deployer.deploy(DEVToken);
};
