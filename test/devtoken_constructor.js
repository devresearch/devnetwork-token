const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('initiate value of', function () {

    const owner = accounts[0]
    const foundation = accounts[1]

    const now = new Date()
    const nowTimeUnix = Math.floor(now.getTime() / 1000)
    const oneYearLaterTimeUnix = Math.floor(
      new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
    )

    let dev

    beforeEach(async function () {
      dev = await DEVToken.new(foundation, nowTimeUnix, oneYearLaterTimeUnix)
    })

    it('totalSupply equal to 400,000,000', async function () {
      const totalSupply = await dev.totalSupply()
      totalSupply.should.to.bignumber.equal(new BigNumber(400000000 * 10 ** 18))
    })

    it('foundation address should be the same as input address of constructor', async function () {
      const _foundation = await dev.foundation()
      _foundation.should.to.equal(foundation)
    })

    it('transferTimeLockedStart should be now', async function () {
      const transferTimeLockedStart = await dev.transferTimeLockedStart()
      transferTimeLockedStart.should.to.bignumber.equal(new BigNumber(nowTimeUnix))
    })

    it('transferTimeLockedEnd should plus one year after deploy contract', async function () {
      const transferTimeLockedEnd = await dev.transferTimeLockedEnd()
      transferTimeLockedEnd.should.to.bignumber.equal(new BigNumber(oneYearLaterTimeUnix))
    })
  })
})