const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('mint', function () {

    const owner = accounts[0]
    const receiver = accounts[1]
    const restReceiver = accounts.slice(2)
    const restReceiverAmount = Array.from(new Array(accounts.length - 2), (val, index) => new BigNumber(index + 1))
    let dev
    let amount

    beforeEach(async function () {
      dev = await DEVToken.new()
      amount = new BigNumber(1500)
    })

    it('cannot mint if not from the owner', async function () {
      await dev.mint(receiver, amount, { from: receiver }).should.be.rejectedWith(Error)
    })

    it('cannot mint to the owner of contract', async function () {
      await dev.mint(owner, amount).should.be.rejectedWith(Error)
      const balanceReceiver = await dev.balanceOf(receiver)
      balanceReceiver.should.to.bignumber.equal(new BigNumber(0))
    })

    it("receiver balance should equal to token mint", async function () {
      await dev.mint(receiver, amount)
      const balanceReceiver = await dev.balanceOf(receiver)
      balanceReceiver.should.to.bignumber.equal(amount)
    });

    it("receiver balance should equal to token mint second time", async function () {
      await dev.mint(receiver, amount)
      let balanceReceiver = await dev.balanceOf(receiver)
      balanceReceiver.should.to.bignumber.equal(new BigNumber(1500))

      await dev.mint(receiver, amount)
      balanceReceiver = await dev.balanceOf(receiver)
      balanceReceiver.should.to.bignumber.equal(new BigNumber(3000))
    })

    it("cannot finishMinting after paused", async function () {
      await dev.pause()
      await dev.finishMinting().should.be.rejectedWith(Error)
    })

    it("cannot mint after finishMinting", async function () {
      await dev.finishMinting()
      await dev.mint(receiver, amount).should.be.rejectedWith(Error)
    })

    it('mintToken method cannot invoke except the owner', async function () {
      await dev.mintToken(restReceiver, restReceiverAmount, { from: receiver })
        .should.be.rejectedWith(Error)
    })

    it('mintToken method for many addresses', async function () {
      await dev.mintToken(restReceiver, restReceiverAmount)
      for (let i = 0; i < restReceiver.length; i++) {
        let balanceReceiver = await dev.balanceOf(restReceiver[i])
        balanceReceiver.should.to.bignumber.equal(restReceiverAmount[i])
      }
    })
  })
})
