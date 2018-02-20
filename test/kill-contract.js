const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('kill contract', function () {
    const owner = accounts[0]
    const another_acc = accounts[1]
    let dev

    beforeEach(async function () {
      dev = await DEVToken.deployed()
    })

    it('another account cannot kill contract', async function () {
      await dev.destroy({ from: another_acc }).should.be.rejected
    })

    it('should be contract owner 0x0 after kill contract', async function () {
      // contract owner before destroy
      const owner_before = await dev.owner.call()
      owner_before.should.equal(owner)
      await dev.destroy()
      // contract owner after destroy
      const owner_after = await dev.owner.call()
      owner_after.should.equal('0x0')
    })

  })
})
