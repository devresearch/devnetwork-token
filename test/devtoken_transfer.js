const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('transfer', function () {

    const owner = accounts[0]
    const contributor1 = accounts[1]
    const contributor2 = accounts[2]
    let dev

    beforeEach(async function () {
      dev = await DEVToken.new()
      dev.mint(contributor1, new BigNumber(1000))
    })

    it('initial value of transferEnabled is false', async function () {
      const transferEnabled = await dev.transferEnabled.call()
      transferEnabled.should.be.equal(false)
    })

    it('only owner change transfer ability', async function () {
      let transferEnabled = await dev.transferEnabled.call()
      transferEnabled.should.be.equal(false)

      await dev.enableTransfer()
      transferEnabled = await dev.transferEnabled.call()
      transferEnabled.should.be.equal(true)
    })

    it('cannot change transfer ability if not from the owner', async function () {
      let transferEnabled = await dev.transferEnabled.call()
      transferEnabled.should.be.equal(false)

      await dev.enableTransfer({ from: contributor1 }).should.be.rejectedWith(Error)
      transferEnabled = await dev.transferEnabled.call()
      transferEnabled.should.be.equal(false)
    })

    it('cannot transfer to each other if transferEnabled is false', async function () {
      await dev.transfer(contributor2, new BigNumber(100), { from: contributor1 }).should.be.rejectedWith(Error)
    })

    it('can transfer to each other if transferEnabled is true', async function () {
      await dev.enableTransfer()
      await dev.transfer(contributor2, new BigNumber(100), { from: contributor1 }).should.be.fulfilled

      const balance = await dev.balanceOf(contributor2)
      balance.should.be.bignumber.equal(new BigNumber(100))
    })

    it('cannot transfer to owner of contract', async function() {
      await dev.enableTransfer()
      await dev.transfer(owner, new BigNumber(100), { from: contributor1 }).should.be.rejectedWith(Error)

      const balance = await dev.balanceOf(owner)
      balance.should.be.bignumber.equal(new BigNumber(0))
    })
  })
})