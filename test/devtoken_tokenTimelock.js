// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const DEVToken = artifacts.require('./DEVToken')
const TokenTimelock = artifacts.require('./TokenTimelock')
import latestTime from './helpers/latestTime'
import { increaseTimeTo, duration } from './helpers/increaseTime'
import { advanceBlock } from './helpers/advanceToBlock'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('foundation', function () {

    const owner = accounts[0]
    const foundation = accounts[1]

    let dev
    let releaseTime
    let tokenTimelock

    beforeEach(async function () {
      await advanceBlock()
      releaseTime = latestTime() + duration.years(1)

      dev = await DEVToken.new()
      tokenTimelock = await TokenTimelock.new(dev.address, foundation, releaseTime)

      await dev.spreadToken(tokenTimelock.address, new BigNumber(100000000 * 10 ** 18))
      await dev.enableTransfer()
    })

    it('tokenTimelock state variable', async function() {
      const beneficiary = await tokenTimelock.beneficiary()
      const _releaseTime = await tokenTimelock.releaseTime()

      beneficiary.should.be.equal(foundation)
      _releaseTime.should.be.bignumber.equal(new BigNumber(releaseTime))
    })

    it('tokenTimelock cannot release if not from owner', async function () {
      await tokenTimelock.release({ from: accounts[3] }).should.be.rejectedWith(Error)
    })

    it('tokenTimelock cannot release if currentTime is less than releaseTime', async function () {
      let foundationBalance = await dev.balanceOf(foundation),
        ownerBalance = await dev.balanceOf(owner)

      foundationBalance.should.be.bignumber.equal(new BigNumber(0))
      ownerBalance.should.be.bignumber.equal(new BigNumber(300000000 * 10 ** 18))

      await tokenTimelock.release().should.be.rejectedWith(Error)

      foundationBalance = await dev.balanceOf(foundation)
      ownerBalance = await dev.balanceOf(owner)
      foundationBalance.should.be.bignumber.equal(new BigNumber(0))
      ownerBalance.should.be.bignumber.equal(new BigNumber(300000000 * 10 ** 18))
    })

    it('tokenTimelock can release if currentTime is equal or greater than releaseTime', async function () {
      await increaseTimeTo(releaseTime + duration.seconds(3))
      let foundationBalance = await dev.balanceOf(foundation),
        ownerBalance = await dev.balanceOf(owner),
        tokenTimelockBalance = await dev.balanceOf(tokenTimelock.address)

      foundationBalance.should.be.bignumber.equal(new BigNumber(0))
      ownerBalance.should.be.bignumber.equal(new BigNumber(300000000 * 10 ** 18))
      tokenTimelockBalance.should.be.bignumber.equal(new BigNumber(100000000 * 10 ** 18))

      await tokenTimelock.release().should.be.fulfilled

      foundationBalance = await dev.balanceOf(foundation)
      ownerBalance = await dev.balanceOf(owner)
      tokenTimelockBalance = await dev.balanceOf(tokenTimelock.address)

      tokenTimelockBalance.should.be.bignumber.equal(new BigNumber(0))
      foundationBalance.should.be.bignumber.equal(new BigNumber(100000000 * 10 ** 18))
      ownerBalance.should.be.bignumber.equal(new BigNumber(300000000 * 10 ** 18))
    })
  })
})