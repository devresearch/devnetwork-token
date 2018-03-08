const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('transferFrom', function () {

    const owner = accounts[0]
    const foundation = accounts[1]

    const contributor1 = accounts[2]
    const contributor2 = accounts[3]
    const contributor3 = accounts[4]

    const now = new Date()
    const nowTimeUnix = Math.floor(now.getTime() / 1000)
    const oneYearLaterTimeUnix = Math.floor(
      new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
    )

    let dev

    beforeEach(async function () {
      dev = await DEVToken.new(foundation, nowTimeUnix, oneYearLaterTimeUnix)
      await dev.enableTransfer()
      await dev.spreadForContributor(contributor1, new BigNumber(10000))
      await dev.approve(contributor2, new BigNumber(500 * 10 ** 18), { from: contributor1 })
    })

    it('can invoke to send token to contributor2 from contributor', async function () {
      let contributor2Balance = await dev.balanceOf(contributor2)

      contributor2Balance.should.be.bignumber.equal(new BigNumber(0))
      await dev.transferFrom(contributor1, contributor2, new BigNumber(200 * 10 ** 18), { from: contributor2 })

      let contributor1Balance = await dev.balanceOf(contributor1)
      contributor2Balance = await dev.balanceOf(contributor2)

      contributor1Balance.should.be.bignumber.equal(new BigNumber(9800 * 10 ** 18))
      contributor2Balance.should.be.bignumber.equal(new BigNumber(200 * 10 ** 18))
    })
  })
})