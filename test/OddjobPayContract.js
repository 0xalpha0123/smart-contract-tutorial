const OddjobPayContract = artifacts.require('OddjobPayContract')

const Web3 = require('web3')

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'http://localhost:8545'
  )
)

const getRandomItem = array => (
  array[Math.floor(Math.random() * array.length)]
)

contract('OddjobPayContract', accounts => {
  const deployer = accounts[0]
  const client   = accounts[1]
  const tasker   = accounts[2]

  const unknownAccount = getRandomItem(accounts.slice(3))

  describe('deployer property', () => {
    it('is initialized after deployment', async () => {
      const deployedContract = await OddjobPayContract.deployed()
      expect(await deployedContract.deployer()).to.equal(deployer)
    })
  })

  describe('client property', () => {
    it('is initialized after deployment', async () => {
      const deployedContract = await OddjobPayContract.deployed()
      expect(await deployedContract.client()).to.equal(client)
    })
  })

  describe('tasker property', () => {
    it('is initialized after deployment', async () => {
      const deployedContract = await OddjobPayContract.deployed()
      expect(await deployedContract.tasker()).to.equal(tasker)
    })
  })

  describe('payAmount property', () => {
    it('is initialized with 0 after deployment', async () => {
      const deployedContract = await OddjobPayContract.deployed()
      const payAmount = await deployedContract.payAmount()
      expect(payAmount.toNumber()).to.equal(0)
    })
  })

  describe('payable fallback', () => {
    describe('msg.sender validation', () => {
      it('deployer can not increase prize amount', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendTransaction({
            from: deployer, value: web3.toWei(5, 'ether')
          }).then(() => done('e')).catch(() => done())
        })()
      })

      it('tasker can not increase prize amount', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendTransaction({
            from: tasker, value: web3.toWei(5, 'ether')
          }).then(() => done('e')).catch(() => done())
        })()
      })

      it('unknown account can not increase prize amount', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendTransaction({
            from: unknownAccount, value: web3.toWei(5, 'ether')
          }).then(() => done('e')).catch(() => done())
        })()
      })

      it('only client can increase prize amount', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendTransaction({
            from: client, value: web3.toWei(5, 'ether')
          }).then(() => done()).catch(() => done('e'))
        })()
      })
    })

    it('increases prize amount', async () => {
      const deployedContract = await OddjobPayContract.deployed()

      const prizeAmountWeiBefore = await deployedContract.payAmount()
      const prizeAmountBefore = web3.fromWei(prizeAmountWeiBefore, 'ether')

      await deployedContract.sendTransaction({
        from: client, value: web3.toWei(5, 'ether')
      })

      const prizeAmountWeiAfter = await deployedContract.payAmount()
      const prizeAmountAfter = web3.fromWei(prizeAmountWeiAfter, 'ether')

      expect(prizeAmountAfter - prizeAmountBefore).to.equal(5)
    })
  })

  describe('sendPrizeToImplementer action', () => {
    describe('msg.sender validation', () => {
      it('can be triggered by deployer', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendPrizeToImplementer({ from: deployer })
            .then(() => done())
            .catch(() => done('e'))
        })()
      })

      it('can not be triggered by client', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendPrizeToImplementer({ from: client })
            .then(() => done('e'))
            .catch(() => done())
        })()
      })

      it('can not be triggered by tasker', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendPrizeToImplementer({ from: tasker })
            .then(() => done('e'))
            .catch(() => done())
        })()
      })

      it('can not be triggered by unknown account', done => {
        (async () => {
          const deployedContract = await OddjobPayContract.deployed()

          deployedContract.sendPrizeToImplementer({ from: unknownAccount })
            .then(() => done('e'))
            .catch(() => done())
        })()
      })
    })

    it('nullifies prize amount', async () => {
      const deployedContract = await OddjobPayContract.new(
        client, tasker, { from: deployer }
      )

      await deployedContract.sendTransaction({
        from: client, value: web3.toWei(5, 'ether')
      })

      const prizeAmountWeiBefore = await deployedContract.payAmount()
      const prizeAmountBefore = web3.fromWei(prizeAmountWeiBefore, 'ether')

      await deployedContract.sendPrizeToImplementer({ from: deployer })

      const prizeAmountWeiAfter = await deployedContract.payAmount()
      const prizeAmountAfter = web3.fromWei(prizeAmountWeiAfter, 'ether')

      expect(prizeAmountAfter - prizeAmountBefore).to.equal(-5)
      expect(prizeAmountAfter.toNumber()).to.equal(0)
    })
  })
})