const DEVToken = artifacts.require('./DEVToken')
import { advanceBlock } from './helpers/advanceToBlock'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('initiate value of', function () {

    const owner = accounts[0]
    
    let dev

    beforeEach(async function () {
      await advanceBlock()
      dev = await DEVToken.new()
    })

    it('totalSupply equal to 400,000,000', async function () {
      const totalSupply = await dev.totalSupply()
      totalSupply.should.to.bignumber.equal(new BigNumber(400000000 * 10 ** 18))
    })
  })
})