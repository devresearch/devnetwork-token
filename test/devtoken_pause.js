const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('pause', function () {

    const owner = accounts[0]
    const contributor = accounts[1]
    let dev
    let paused

    beforeEach(async function () {
      dev = await DEVToken.new()
      paused = await dev.paused.call()
    })

    it('initiale value of paused is false', async function() {
      paused.should.be.equal(false)
    })

    it('only owner can change', async function() {
      await dev.pause()
      paused = await dev.paused.call()
      paused.should.be.equal(true)
    })

    it('cannot change if not the owner', async function() {
      await dev.pause({ from: contributor }).should.be.rejectedWith(Error)
      paused = await dev.paused.call()
      paused.should.be.equal(false)
    })
  })
})
