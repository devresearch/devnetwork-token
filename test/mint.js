// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('mint', function () {

    const owner = accounts[0]
    let dev

    beforeEach(async function () {
      dev = await DEVToken.deployed()
    })

    it("receiver balance should equal to token mint", async function () {

      const receiver = accounts[1]
      const amount = new BigNumber(1500)

      await dev.mint(receiver, amount, { from: owner })
      const target = await dev.balanceOf(receiver)
      target.should.to.bignumber.equal(amount)
    });

    it("receiver balance should equal to token mint second time", async function () {

      const receiver = accounts[1]
      const amount = new BigNumber(1500)

      await dev.mint(receiver, amount, { from: owner })
      const target = await dev.balanceOf(receiver)
      target.should.to.bignumber.equal(new BigNumber(3000))
    })

    it("cannot finishMinting after paused", async function () {

      await dev.pause({ from: owner })
      await dev.finishMinting({ from: owner }).should.be.rejectedWith(Error)
    })

    it("cannot mint after finishMinting", async function () {

      await dev.unpause({ from: owner })
      const receiver = accounts[1]
      const amount = new BigNumber(1500)

      await dev.finishMinting({ from: owner })
      await dev.mint(receiver, amount, { from: owner }).should.be.rejectedWith(Error)

    })
  })
})
