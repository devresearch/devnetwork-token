// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const Migrations = artifacts.require("./Migrations.sol");

module.exports = (deployer) => {
  deployer.deploy(Migrations);
};
