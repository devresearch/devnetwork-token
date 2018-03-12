const DEVToken = artifacts.require('./DEVToken')
import { advanceBlock } from './helpers/advanceToBlock'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('spreadToken', function () {

    const owner = accounts[0]

    const contributor = accounts[1]
    const restContributor = accounts.slice(2)
    const restContributorAmount = Array.from(new Array(restContributor.length), (val, index) => new BigNumber(10000 * 10 ** 18))

    let dev

    beforeEach(async function () {
      await advanceBlock()
      dev = await DEVToken.new()
    })

    it('cannot invoke if not from the owner', async function () {
      await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18), { from: contributor })
        .should.be.rejectedWith(Error)
    })

    it('can invoke from the owner', async function () {
      let contributorBalance = await dev.balanceOf(contributor),
        ownerBalance = await dev.balanceOf(owner)

      contributorBalance.should.be.bignumber.equal(new BigNumber(0))
      ownerBalance.should.be.bignumber.equal(new BigNumber(400000000 * 10 ** 18))

      await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18)).should.be.fulfilled
      contributorBalance = await dev.balanceOf(contributor)
      ownerBalance = await dev.balanceOf(owner)

      contributorBalance.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
      ownerBalance.should.be.bignumber.equal(new BigNumber(399990000 * 10 ** 18))
    })

    it('spread Transfer event when invoke success', async function () {
      const tx = await dev.spreadToken(contributor, new BigNumber(2.5678 * 10 ** 18))
      tx.logs[0].should.be.ok
      tx.logs[0].event.should.be.equal('Transfer')
      tx.logs[0].args.from.should.be.equal(owner)
      tx.logs[0].args.to.should.be.equal(contributor)
      tx.logs[0].args.value.should.be.bignumber.equal(new BigNumber(2.5678 * 10 ** 18))
    })

    it('cannot invoke with multiple address if not via owner', async function () {
      await dev.spreadTokenAddresses(restContributor, restContributorAmount, { from: contributor })
        .should.be.rejectedWith(Error)
    })

    it('can invoke with multiple address', async function () {
      await dev.spreadTokenAddresses(restContributor, restContributorAmount)
      for (let i = 0; i < restContributor.length; i++) {
        let balanceContributor = await dev.balanceOf(restContributor[i])
        balanceContributor.should.to.bignumber.equal(new BigNumber(restContributorAmount[i]))
      }
    })

    it('cannot invoke if raised more than balances[owner] of contract', async function () {
      let contributorBalance = await dev.balanceOf(contributor),
        ownerBalance = await dev.balanceOf(owner)

      contributorBalance.should.be.bignumber.equal(new BigNumber(0))
      ownerBalance.should.be.bignumber.equal(new BigNumber(400000000 * 10 ** 18))

      await dev.spreadToken(contributor, new BigNumber(240000000 * 10 ** 18))
        .should.be.fulfilled
      await dev.spreadToken(contributor, new BigNumber(240000000 * 10 ** 18))
        .should.be.rejectedWith(Error)
      await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18))
        .should.be.fulfilled
      await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18))
        .should.be.fulfilled
      await dev.spreadToken(contributor, new BigNumber(240000000 * 10 ** 18))
        .should.be.rejectedWith(Error)

      contributorBalance = await dev.balanceOf(contributor)
      ownerBalance = await dev.balanceOf(owner)

      contributorBalance.should.be.bignumber.equal(new BigNumber(240000002 * 10 ** 18))
      ownerBalance.should.be.bignumber.equal(new BigNumber(159999998 * 10 ** 18))
    })

    it('cannot invoke if input for spreading more than totalSupply', async function () {
      let contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))

      await dev.spreadToken(contributor, new BigNumber(400000001 * 10 ** 18))
        .should.be.rejectedWith(Error)

      contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))
    })
  })
})