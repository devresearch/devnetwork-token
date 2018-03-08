const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('spreadForContributor', function () {

    const owner = accounts[0]
    const foundation = accounts[1]

    const contributor = accounts[2]
    const restContributor = accounts.slice(3)
    const restContributorAmount = Array.from(new Array(restContributor.length), (val, index) => new BigNumber(10000))

    const now = new Date()
    const nowTimeUnix = Math.floor(now.getTime() / 1000)
    const oneYearLaterTimeUnix = Math.floor(
      new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
    )

    let dev

    beforeEach(async function () {
      dev = await DEVToken.new(foundation, nowTimeUnix, oneYearLaterTimeUnix)
    })

    it('cannot invoke not from the owner', async function () {
      await dev.spreadForContributor(contributor, new BigNumber(10000), { from: contributor })
        .should.be.rejectedWith(Error)
    })

    it('can invoke from the owner', async function () {
      let contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))

      await dev.spreadForContributor(contributor, new BigNumber(10000)).should.be.fulfilled
      contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
    })

    it('can invoke with multiple address', async function () {
      await dev.spreadForContributorAddresses(restContributor, restContributorAmount)
      for (let i = 0; i < restContributor.length; i++) {
        let balanceContributor = await dev.balanceOf(restContributor[i])
        balanceContributor.should.to.bignumber.equal(new BigNumber(restContributorAmount[i] * 10 ** 18))
      }
    })

    it('cannot invoke if raised more than CONTRIBUTE_ALLOWANCE', async function () {
      let contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))

      await dev.spreadForContributor(contributor, new BigNumber(240000000))
        .should.be.fulfilled
      await dev.spreadForContributor(contributor, new BigNumber(1))
        .should.be.rejectedWith(Error)
      await dev.spreadForContributor(contributor, new BigNumber(1))
        .should.be.rejectedWith(Error)
      await dev.spreadForContributor(contributor, new BigNumber(1))
        .should.be.rejectedWith(Error)

      contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(240000000 * 10 ** 18))
    })

    it('cannot invoke if input for spreading more than CONTRIBUTE_ALLOWANCE', async function () {
      let contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))

      await dev.spreadForContributor(contributor, new BigNumber(240000001))
        .should.be.rejectedWith(Error)

      contributorBalance = await dev.balanceOf(contributor)
      contributorBalance.should.be.bignumber.equal(new BigNumber(0))
    })
  })
})