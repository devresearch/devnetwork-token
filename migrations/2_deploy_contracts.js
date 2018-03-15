// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const DEVToken = artifacts.require("./DEVToken.sol");
const TokenTimelock = artifacts.require("./TokenTimelock.sol");

module.exports = function (deployer, network) {
  const now = new Date()
  const nowTimeUnix = Math.floor(now.getTime() / 1000)
  const oneYearLaterTimeUnix = Math.floor(
    new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
  )

  // const thirtyMinutesLaterTimeUnix = Math.floor(
  //   new Date(new Date().setMinutes(now.getMinutes() + 30)).getTime() / 1000
  // )

  console.log(`Deploy time is ${nowTimeUnix}`)
  console.log(`Release time for tokenTimelock is ${oneYearLaterTimeUnix}`)

  if (network == 'test') {
    deployer.deploy(DEVToken);
  } else {
    deployer.deploy(DEVToken).then(() => {
      return deployer.deploy(
        TokenTimelock,
        DEVToken.address,
        process.env.FOUNDATION,
        oneYearLaterTimeUnix
      );
    });
  }
};
