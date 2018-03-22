const EscrowToken = artifacts.require('EscrowToken')
const DEVToken = artifacts.require('DEVToken')
import latestTime from './helpers/latestTime'
import { increaseTimeTo, duration } from './helpers/increaseTime'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('EscrowToken', function (accounts) {
  describe('Escrow accept', function () {

    let escrow
    let devToken

    const amount = new BigNumber(500 * 10 ** 18) // 500 DEV
    const amountFee = new BigNumber(10 * 10 ** 18); // 10 DEV
    const amountMint = new BigNumber(1000 * 10 ** 18) // 1000 DEV
    const totalAmount = amount.add(amountFee)

    const sender = accounts[1]
    const receiver = accounts[2]

    const nowTimeUnix = latestTime()
    const oneDayLaterTimeUnix = nowTimeUnix + duration.days(1)
    const oneYearLaterTimeUnix = nowTimeUnix + duration.years(1)

    beforeEach(async function () {
      escrow = await EscrowToken.new()
      devToken = await DEVToken.new()
      await devToken.enableTransfer()
      escrow.setFee(amountFee)
      escrow.setTokenInterface(devToken.address)
      await devToken.spreadToken(sender, amountMint)
      await devToken.spreadToken(receiver, amountMint)
    })

    it('can accept from another account after offer', async function () {
      // offer
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data" , { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // accept
      await devToken.approve(escrow.address, totalAmount, { from: receiver })
      const commited = await escrow.accept(tradeHash, amount, { from: receiver }).should.be.fulfilled
      const balanceReceiver = await devToken.balanceOf(receiver)
      balanceReceiver.should.be.bignumber.equal(amountMint.minus(totalAmount))
      commited.logs[0].event.should.be.equal('Accept')
      commited.logs[0].args._creator.should.be.equal(receiver)
    })

    it('can not accept from same account after offer', async function () {
      // offer
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // accept
      await devToken.approve(escrow.address, totalAmount, { from: receiver })
      await escrow.accept(tradeHash, amount, { from: sender }).should.be.rejected
    })

    it('twice accept should be rejected', async function () {
      // offer
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // accept
      await devToken.approve(escrow.address, totalAmount, { from: receiver })
      await escrow.accept(tradeHash, amount, { from: receiver }).should.be.fulfilled
      // accept
      await devToken.approve(escrow.address, totalAmount, { from: receiver })
      await escrow.accept(tradeHash, amount, { from: receiver }).should.be.rejected
    })

    it('can not accept after expired', async function () {
      // offer
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      await increaseTimeTo(oneYearLaterTimeUnix)
      // accept
      await devToken.approve(escrow.address, totalAmount, { from: receiver })
      await escrow.accept(tradeHash, amount, { from: receiver }).should.be.rejected
    })

  })
})

