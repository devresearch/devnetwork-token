const DEVToken = artifacts.require('./DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('spreadToken', function () {

    const owner = accounts[0]
    const foundation = accounts[1]

    const contributor = accounts[2]
    const restContributor = accounts.slice(3)
    const restContributorAmount = Array.from(new Array(restContributor.length), (val, index) => new BigNumber(10000 * 10 ** 18))

    const now = new Date()
    const nowTimeUnix = Math.floor(now.getTime() / 1000)
    const oneYearLaterTimeUnix = Math.floor(
      new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
    )

    describe('contributor', async function () {
      let dev

      beforeEach(async function () {
        dev = await DEVToken.new(foundation, nowTimeUnix, oneYearLaterTimeUnix)
      })

      it('cannot invoke if not from the owner', async function () {
        await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18), 0, { from: contributor })
          .should.be.rejectedWith(Error)
      })

      it('can invoke from the owner', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        let raisedContributeAllocate = await dev.raisedContributeAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
        raisedContributeAllocate.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18), 0).should.be.fulfilled
        contributorBalance = await dev.balanceOf(contributor)
        raisedContributeAllocate = await dev.raisedContributeAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
        raisedContributeAllocate.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
      })

      it('spread Transfer event when invoke success', async function () {
        const tx = await dev.spreadToken(contributor, new BigNumber(2.5678 * 10 ** 18), 0)
        tx.logs[0].should.be.ok
        tx.logs[0].event.should.be.equal('Transfer')
        tx.logs[0].args.from.should.be.equal(owner)
        tx.logs[0].args.to.should.be.equal(contributor)
        tx.logs[0].args.value.should.be.bignumber.equal(new BigNumber(2.5678 * 10 ** 18))
      })

      it('cannot invoke with multiple address if not via owner', async function () {
        await dev.spreadTokenAddresses(restContributor, restContributorAmount, 0, { from: contributor })
          .should.be.rejectedWith(Error)
      })

      it('can invoke with multiple address', async function () {
        await dev.spreadTokenAddresses(restContributor, restContributorAmount, 0)
        for (let i = 0; i < restContributor.length; i++) {
          let balanceContributor = await dev.balanceOf(restContributor[i])
          balanceContributor.should.to.bignumber.equal(new BigNumber(restContributorAmount[i]))
        }
      })

      it('cannot invoke if raised more than CONTRIBUTE_ALLOCATE', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        let raisedContributeAllocate = await dev.raisedContributeAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
        raisedContributeAllocate.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(240000000 * 10 ** 18), 0)
          .should.be.fulfilled
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 0)
          .should.be.rejectedWith(Error)
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 0)
          .should.be.rejectedWith(Error)
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 0)
          .should.be.rejectedWith(Error)

        contributorBalance = await dev.balanceOf(contributor)
        raisedContributeAllocate = await dev.raisedContributeAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(240000000 * 10 ** 18))
        raisedContributeAllocate.should.be.bignumber.equal(new BigNumber(240000000 * 10 ** 18))
      })

      it('cannot invoke if input for spreading more than CONTRIBUTE_ALLOCATE', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        contributorBalance.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(240000001 * 10 ** 18), 0)
          .should.be.rejectedWith(Error)

        contributorBalance = await dev.balanceOf(contributor)
        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
      })
    })

    describe('bounty', async function () {
      let dev

      beforeEach(async function () {
        dev = await DEVToken.new(foundation, nowTimeUnix, oneYearLaterTimeUnix)
      })

      it('cannot invoke if not from the owner', async function () {
        await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18), 1, { from: contributor })
          .should.be.rejectedWith(Error)
      })

      it('can invoke from the owner', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        let raisedBountyAllocate = await dev.raisedBountyAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
        raisedBountyAllocate.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(10000 * 10 ** 18), 1).should.be.fulfilled
        contributorBalance = await dev.balanceOf(contributor)
        raisedBountyAllocate = await dev.raisedBountyAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
        raisedBountyAllocate.should.be.bignumber.equal(new BigNumber(10000 * 10 ** 18))
      })

      it('spread Transfer event when invoke success', async function () {
        const tx = await dev.spreadToken(contributor, new BigNumber(2.5678 * 10 ** 18), 1)
        tx.logs[0].should.be.ok
        tx.logs[0].event.should.be.equal('Transfer')
        tx.logs[0].args.from.should.be.equal(owner)
        tx.logs[0].args.to.should.be.equal(contributor)
        tx.logs[0].args.value.should.be.bignumber.equal(new BigNumber(2.5678 * 10 ** 18))
      })

      it('cannot invoke with multiple address if not via owner', async function () {
        await dev.spreadTokenAddresses(restContributor, restContributorAmount, 1, { from: contributor })
          .should.be.rejectedWith(Error)
      })

      it('can invoke with multiple address', async function () {
        await dev.spreadTokenAddresses(restContributor, restContributorAmount, 1)
        for (let i = 0; i < restContributor.length; i++) {
          let balanceContributor = await dev.balanceOf(restContributor[i])
          balanceContributor.should.to.bignumber.equal(new BigNumber(restContributorAmount[i]))
        }
      })

      it('cannot invoke if raised more than BOUNTY_ALLOCATE', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        let raisedBountyAllocate = await dev.raisedBountyAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
        raisedBountyAllocate.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(80000000 * 10 ** 18), 1)
          .should.be.fulfilled
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 1)
          .should.be.rejectedWith(Error)
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 1)
          .should.be.rejectedWith(Error)
        await dev.spreadToken(contributor, new BigNumber(1 * 10 ** 18), 1)
          .should.be.rejectedWith(Error)

        contributorBalance = await dev.balanceOf(contributor)
        raisedBountyAllocate = await dev.raisedBountyAllocate()

        contributorBalance.should.be.bignumber.equal(new BigNumber(80000000 * 10 ** 18))
        raisedBountyAllocate.should.be.bignumber.equal(new BigNumber(80000000 * 10 ** 18))
      })

      it('cannot invoke if input for spreading more than BOUNTY_ALLOCATE', async function () {
        let contributorBalance = await dev.balanceOf(contributor)
        contributorBalance.should.be.bignumber.equal(new BigNumber(0))

        await dev.spreadToken(contributor, new BigNumber(80000001 * 10 ** 18), 1)
          .should.be.rejectedWith(Error)

        contributorBalance = await dev.balanceOf(contributor)
        contributorBalance.should.be.bignumber.equal(new BigNumber(0))
      })
    })
  })
})