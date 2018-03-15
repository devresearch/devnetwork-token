// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const DEVToken = artifacts.require("./DEVToken.sol");

module.exports = function(deployer) {
  deployer.deploy(DEVToken);
};
