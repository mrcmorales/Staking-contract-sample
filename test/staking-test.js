const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Staking contract", function () {

    let GTRToken;
    let gtrToken;

    let Staking;
    let stakingContract;

    let owner;
    let address1;
    let address2;
    let address3;


    beforeEach(async function () {
        GTRToken = await ethers.getContractFactory("GTRToken");
        [owner, address1, address2, address3] = await ethers.getSigners();
        gtrToken = await GTRToken.deploy();

        Staking = await ethers.getContractFactory("Staking");
        stakingContract = await Staking.deploy(gtrToken.address);
    });


    describe("Whitelist", function () {

        it("only owner can add/remove whitelist", async function () {

            //reverted because address1 is not the owner
            await expect(stakingContract.connect(address1).addAddressToWhitelist(address2.address)).to.be.revertedWith('Ownable: caller is not the owner');
            await expect(stakingContract.connect(address1).removeAddressFromWhitelist(address2.address)).to.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe("Allow/deny staking", function () {


        it("only owner can allow/deny staking", async function () {
            //reverted because address1 is not the owner
            await expect(stakingContract.connect(address1).allowStaking()).to.be.revertedWith('Ownable: caller is not the owner');
            await expect(stakingContract.connect(address1).denyStaking()).to.be.revertedWith('Ownable: caller is not the owner');
        });


        it("behaviour", async function () {
            stakingContract.connect(owner).allowStaking();
            expect(await stakingContract.connect(owner).stakingFlag()).to.true;
            stakingContract.connect(owner).denyStaking();
            expect(await stakingContract.connect(owner).stakingFlag()).to.false;
        });
    });


    describe("Allow/deny unStaking", function () {


        it("only owner can allow/deny unStaking", async function () {
            //reverted because address1 is not the owner
            await expect(stakingContract.connect(address1).allowUnStaking()).to.be.revertedWith('Ownable: caller is not the owner');
            await expect(stakingContract.connect(address1).denyUnStaking()).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("behaviour", async function () {
            stakingContract.connect(owner).allowUnStaking();
            expect(await stakingContract.connect(owner).unStakingFlag()).to.true;
            stakingContract.connect(owner).denyUnStaking();
            expect(await stakingContract.connect(owner).unStakingFlag()).to.false;
        });
    });


    describe("Stake", function () {

        it("whitelist modifier", async function () {

            //Address not whitelisted
            await expect(stakingContract.connect(address1).stake(1)).to.be.revertedWith('Address is not whitelisted');

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);

            //now address is whitelisted but staking is not allowed yet
            await expect(stakingContract.connect(address1).stake(1)).to.be.revertedWith('Staking is not allowed');

            stakingContract.connect(owner).removeAddressFromWhitelist(address1.address);

            //Address not whitelisted
            await expect(stakingContract.connect(address1).stake(1)).to.be.revertedWith('Address is not whitelisted');
        });

        it("staking allowed modifier", async function () {


            stakingContract.connect(owner).addAddressToWhitelist(address1.address);

            //now address is whitelisted but staking is not allowed yet
            await expect(stakingContract.connect(address1).stake(1)).to.be.revertedWith('Staking is not allowed');
            stakingContract.connect(owner).allowStaking();
            //address1 have not enough tokens to stake
            await expect(stakingContract.connect(address1).stake(200))
                .to.be.revertedWith('Not enough tokens in your wallet');
        });

        it("staking behaviour", async function () {

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);
            stakingContract.connect(owner).allowStaking();

            //transfer 100 tokens from owner to address1
            await expect(() => gtrToken.transfer(address1.address, 100))
                .to.changeTokenBalances(gtrToken, [owner, address1], [-100, 100]);

            //address1 have not enough tokens to stake
            await expect(stakingContract.connect(address1).stake(200))
                .to.be.revertedWith('Not enough tokens in your wallet');

            //it's not possible to stake 0 tokens
            await expect(stakingContract.connect(address1).stake(0))
                .to.be.revertedWith('Stake 0 tokens is not allowed');

            //approve before stake
            gtrToken.connect(address1).approve(stakingContract.address, 100);

            //stake 10 tokens and check balances
            await expect(() => stakingContract.connect(address1).stake(10))
                .to.changeTokenBalances(gtrToken, [address1, stakingContract], [-10, 10]);

            var staker =  await stakingContract.balances(address1.address);
            expect(staker.balance).to.equal(10);

            //check staked event is emitted
            await expect(stakingContract.connect(address1).stake(10))
                .to.emit(stakingContract, 'Staked')
                .withArgs(address1.address, 10);
        });
    });

    describe("UnStake", function () {

        it("whitelist modifier", async function () {

            //Address not whitelisted
            await expect(stakingContract.connect(address1).unStake(1)).to.be.revertedWith('Address is not whitelisted');

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);

            //now address is whitelisted but unSaking is not allowed yet
            await expect(stakingContract.connect(address1).unStake(1)).to.be.revertedWith('UnStaking is not allowed');

            stakingContract.connect(owner).removeAddressFromWhitelist(address1.address);

            //Address not whitelisted
            await expect(stakingContract.connect(address1).unStake(1)).to.be.revertedWith('Address is not whitelisted');
        });

        it("unstaking allowed modifier", async function () {

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);

            //now address is whitelisted but unstaking is not allowed yet
            await expect(stakingContract.connect(address1).unStake(1)).to.be.revertedWith('UnStaking is not allowed');
            stakingContract.connect(owner).allowUnStaking();

            //address1 have not enough tokens to unstake
            await expect(stakingContract.connect(address1).unStake(200))
                .to.be.revertedWith('You have not enough tokens staked to unstake');
        });

        it("unstaking behaviour", async function () {

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);
            stakingContract.connect(owner).allowUnStaking();

            //transfer 100 tokens from owner to address1
            await expect(() => gtrToken.transfer(address1.address, 100))
                .to.changeTokenBalances(gtrToken, [owner, address1], [-100, 100]);

            //it's not possible to unstake 0 tokens
            await expect(stakingContract.connect(address1).unStake(0))
                .to.be.revertedWith('UnStake 0 tokens is not allowed');

            //approve and stake 20 tokens for address1
            gtrToken.connect(address1).approve(stakingContract.address, 100);
            stakingContract.connect(owner).allowStaking();
            await expect(() => stakingContract.connect(address1).stake(20))
                .to.changeTokenBalances(gtrToken, [address1, stakingContract], [-20, 20]);

            var staker =  await stakingContract.balances(address1.address);
            expect(staker.balance).to.equal(20);

            await expect(stakingContract.connect(address1).unStake(1000))
                .to.be.revertedWith('You have not enough tokens staked to unstake');

            //unstake 10 tokens and check balances
            await expect(() => stakingContract.connect(address1).unStake(10))
                .to.changeTokenBalances(gtrToken, [stakingContract, address1], [-10, 10]);

            var staker =  await stakingContract.balances(address1.address);
            expect(staker.balance).to.equal(10);

            //check unstaked event is emitted
            await expect(stakingContract.connect(address1).unStake(10))
                .to.emit(stakingContract, 'UnStaked')
                .withArgs(address1.address, 10);

            var staker =  await stakingContract.balances(address1.address);
            expect(staker.balance).to.equal(0);
        });
    });

    describe("refund", function () {

        it("only owner can refund", async function () {

            //reverted because address1 is not the owner
            await expect(stakingContract.connect(address1).refund()).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("behaviour", async function () {

            stakingContract.connect(owner).addAddressToWhitelist(address1.address);
            stakingContract.connect(owner).addAddressToWhitelist(address2.address);
            stakingContract.connect(owner).addAddressToWhitelist(address3.address);
            stakingContract.connect(owner).allowStaking();

            //transfer 100 tokens to address1, address2 and address3
            await expect(() => gtrToken.transfer(address1.address, 100))
                .to.changeTokenBalances(gtrToken, [owner, address1], [-100, 100]);
            await expect(() => gtrToken.transfer(address2.address, 100))
                .to.changeTokenBalances(gtrToken, [owner, address2], [-100, 100]);
            await expect(() => gtrToken.transfer(address3.address, 100))
                .to.changeTokenBalances(gtrToken, [owner, address3], [-100, 100]);

            //approve before stake
            gtrToken.connect(address1).approve(stakingContract.address, 100);
            gtrToken.connect(address2).approve(stakingContract.address, 100);
            gtrToken.connect(address3).approve(stakingContract.address, 100);

            //stake 10 tokens and check balances
            await expect(() => stakingContract.connect(address1).stake(10))
                .to.changeTokenBalances(gtrToken, [address1, stakingContract], [-10, 10]);
            //stake 10 tokens and check balances
            await expect(() => stakingContract.connect(address2).stake(10))
                .to.changeTokenBalances(gtrToken, [address2, stakingContract], [-10, 10]);
            await expect(() => stakingContract.connect(address3).stake(5))
                //stake 5 tokens twice and check balances
                .to.changeTokenBalances(gtrToken, [address3, stakingContract], [-5, 5]);
            await expect(() => stakingContract.connect(address3).stake(5))
                .to.changeTokenBalances(gtrToken, [address3, stakingContract], [-5, 5]);

            //check balances after stake
            expect(await gtrToken.balanceOf(stakingContract.address)).to.equal(30);
            expect(await gtrToken.balanceOf(address1.address)).to.equal(90);
            expect(await gtrToken.balanceOf(address2.address)).to.equal(90);
            expect(await gtrToken.balanceOf(address3.address)).to.equal(90);

            //call refund function and test refunded event is emitted
            await expect(stakingContract.connect(owner).refund()).to.emit(stakingContract, 'Refunded');

            //check balances after refund
            expect(await gtrToken.balanceOf(stakingContract.address)).to.equal(0);
            expect(await gtrToken.balanceOf(address1.address)).to.equal(100);
            expect(await gtrToken.balanceOf(address2.address)).to.equal(100);
            expect(await gtrToken.balanceOf(address3.address)).to.equal(100);

            //check stake and unstake is stopped
            expect(await stakingContract.connect(owner).stakingFlag()).to.false;
            expect(await stakingContract.connect(owner).unStakingFlag()).to.false;
        });
    });
});
