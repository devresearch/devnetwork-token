const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('burn', function () {

    const owner = accounts[0]
    const foundation = accounts[1]
    const bounty = accounts[2]

    const now = new Date()
    const nowTimeUnix = Math.floor(now.getTime() / 1000)
    const oneYearLaterTimeUnix = Math.floor(
      new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
    )

    let dev

    beforeEach(async function () {
      dev = await DEVToken.new(foundation, bounty, nowTimeUnix, oneYearLaterTimeUnix)
    })

    it('cannot invoke if not from the owner', async function () {
      await dev.burn(new BigNumber(200000000 * 10 ** 18), { from: foundation })
        .should.be.rejectedWith(Error)
    })

    it('cannot invoke if burn more than balances of owner', async function () {
      await dev.burn(new BigNumber(400000001 * 10 ** 18))
        .should.be.rejectedWith(Error)
    })

    it('spread Burn events if success', async function() {
      const tx = await dev.burn(new BigNumber(200000000 * 10 ** 18))
      tx.logs[0].should.be.ok
      tx.logs[0].event.should.be.equal('Burn')
      tx.logs[0].args.burner.should.be.equal(owner)
      tx.logs[0].args.value.should.be.bignumber.equal(new BigNumber(200000000 * 10 ** 18))
    })

    it('can invoke only via owner', async function () {
      let totalSupply = await dev.totalSupply(),
        ownerBalance = await dev.balanceOf(owner)

      totalSupply.should.be.bignumber.equal(new BigNumber(400000000 * 10 ** 18))
      ownerBalance.should.be.bignumber.equal(new BigNumber(400000000 * 10 ** 18))
      await dev.burn(new BigNumber(200000000 * 10 ** 18)).should.be.fulfilled

      totalSupply = await dev.totalSupply()
      ownerBalance = await dev.balanceOf(owner)

      totalSupply.should.be.bignumber.equal(new BigNumber(200000000 * 10 ** 18))
      ownerBalance.should.be.bignumber.equal(new BigNumber(200000000 * 10 ** 18))
    })
  })
})