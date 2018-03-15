// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const DEVToken = artifacts.require('./DEVToken')
import { advanceBlock } from './helpers/advanceToBlock'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('transferFrom', function () {

    const owner = accounts[0]

    const contributor1 = accounts[1]
    const contributor2 = accounts[2]
    const contributor3 = accounts[3]

    let dev

    beforeEach(async function () {
      await advanceBlock()
      dev = await DEVToken.new()
      await dev.spreadToken(contributor1, new BigNumber(10000 * 10 ** 18))
      await dev.approve(contributor2, new BigNumber(500 * 10 ** 18), { from: contributor1 })
    })

    it('can invoke to send token to contributor2 from contributor when enable transfer', async function () {
      let contributor2Balance = await dev.balanceOf(contributor2)

      contributor2Balance.should.be.bignumber.equal(new BigNumber(0))
      await dev.enableTransfer()
      await dev.transferFrom(contributor1, contributor2, new BigNumber(200 * 10 ** 18), { from: contributor2 })
        .should.be.fulfilled

      let contributor1Balance = await dev.balanceOf(contributor1)
      contributor2Balance = await dev.balanceOf(contributor2)

      contributor1Balance.should.be.bignumber.equal(new BigNumber(9800 * 10 ** 18))
      contributor2Balance.should.be.bignumber.equal(new BigNumber(200 * 10 ** 18))
    })

    it('cannot invoke to send token to contributor2 from contributor1 when enable transfer', async function () {
      let contributor2Balance = await dev.balanceOf(contributor2)

      contributor2Balance.should.be.bignumber.equal(new BigNumber(0))
      await dev.transferFrom(contributor1, contributor2, new BigNumber(200 * 10 ** 18), { from: contributor2 })
        .should.be.rejectedWith(Error)

      let contributor1Balance = await dev.balanceOf(contributor1)
      contributor2Balance = await dev.balanceOf(contributor2)

      contributor1Balance.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
      contributor2Balance.should.be.bignumber.equal(new BigNumber(0))
    })
  })
})