const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GTRToken contract", function () {

    let GTRToken;
    let gtrToken;
    let owner;
    let address1;
    let address2;
    let totalSupply;

    beforeEach(async function () {
      GTRToken = await ethers.getContractFactory("GTRToken");
      [owner, address1, address2] = await ethers.getSigners();
      gtrToken = await GTRToken.deploy();
    });

    describe("Create token", function () {
      it("Properties", async function () {
        //test token decimals
        const decimals = await gtrToken.decimals();
        expect(decimals).to.equal(18);

        //test token name
        expect(await gtrToken.name()).to.equal('Guitars');

        //test token symbol
        expect(await gtrToken.symbol()).to.equal('GTR');

        //test total supply
        totalSupply = await gtrToken.totalSupply();
        expect(totalSupply).to.equal(
            ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        );
      });
    });

    describe("Test token balances", function () {
      it("Balance of owner should be total supply", async function () {
        expect(await gtrToken.balanceOf(owner.address)).to.equal(totalSupply);
        expect(await gtrToken.balanceOf(address1.address)).to.equal(0);
      });
    });
});
