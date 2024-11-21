// Importing necessary modules and functions from Hardhat and Chai for testing
const {
  loadFixture, time
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describing a test suite for the CollateralizedLoan contract
describe("CollateralizedLoan", function () {
  // A fixture to deploy the contract before each test. This helps in reducing code repetition.
  async function deployCollateralizedLoanFixture() {
    // Deploying the CollateralizedLoan contract and returning necessary variables
    // TODO: Complete the deployment setup
    const [owner, borrower, lender] = await ethers.getSigners();
    const CollateralizedLoan = await ethers.getContractFactory(
      "CollateralizedLoan"
    );
    const collateralizedLoan = await CollateralizedLoan.deploy();
    return { collateralizedLoan, owner, borrower, lender };

  }

  // Test suite for the loan request functionality
  describe("Loan Request", function () {
    it("Should let a borrower deposit collateral and request a loan", async function () {
      
      const { collateralizedLoan, owner, borrower } = await loadFixture(
        deployCollateralizedLoanFixture
      );
      await collateralizedLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(1, 1, { value: ethers.parseEther("0.5") });
      const loan = await collateralizedLoan.getLoan(1);
      
      expect(loan.isRepaid).to.equal(false);

    });
  });

  // Test suite for funding a loan
  describe("Funding a Loan", function () {
    it("Allows a lender to fund a requested loan", async function () {
      // Loading the fixture
      // TODO: Set up test for a lender funding a loan
      // HINT: You'll need to check for an event emission to verify the action
      const { collateralizedLoan, owner, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );


      await collateralizedLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(1, 1, { value: ethers.parseEther("0.5") });
      await expect(collateralizedLoan
        .connect(lender)
        .fundLoan(1, { value: ethers.parseEther("0.5") })).to.emit(collateralizedLoan,"LoanFunded").withArgs(1);

      const loan = await collateralizedLoan.getLoan(1);

      expect(loan.isRepaid).to.equal(false);
      expect(loan.isFunded).to.equal(true);      

    });
  });


  // Test suite for repaying a loan
  describe("Repaying a Loan", function () {
    it("Enables the borrower to repay the loan fully", async function () {
      // Loading the fixture
      // TODO: Set up test for a borrower repaying the loan
      // HINT: Consider including the calculation of the repayment amount

      const { collateralizedLoan, owner, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );

      await collateralizedLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(1, 1, { value: ethers.parseEther("0.5") });
      await expect(collateralizedLoan
        .connect(lender)
        .fundLoan(1, { value: ethers.parseEther("0.5") })).to.emit(collateralizedLoan,"LoanFunded").withArgs(1);
      await expect(collateralizedLoan
        .connect(borrower)
        .repayLoan(1, { value: ethers.parseEther("0.5")})).to.emit(collateralizedLoan,"LoanRepaid").withArgs(1);

      const loan = await collateralizedLoan.getLoan(1);

      expect(loan.isRepaid).to.equal(true);
      expect(loan.isFunded).to.equal(true); 

    });
  });

  // Test suite for repaying a loan
  describe("Repaying an Unfunded Loan", function () {
    it("Enables the borrower to repay an unfunded loan", async function () {
      // Loading the fixture
      // TODO: Set up test for a borrower repaying the loan
      // HINT: Consider including the calculation of the repayment amount

      const { collateralizedLoan, owner, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );

      await collateralizedLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(1, 1, { value: ethers.parseEther("0.5") });
      await expect(collateralizedLoan
        .connect(borrower)
        .repayLoan(1, { value: ethers.parseEther("0.5")})).to.be.revertedWith("Loan not is funded.");
    });
  });



  // Test suite for claiming collateral
  describe("Claiming Collateral", function () {
    it("Permits the lender to claim collateral if the loan isn't repaid on time", async function () {
      // Loading the fixture
      // TODO: Set up test for claiming collateral
      // HINT: Simulate the passage of time if necessary
      const { collateralizedLoan, owner, borrower, lender } = await loadFixture(
        deployCollateralizedLoanFixture
      );

      const newTimestamp = time.latest();
      
      await collateralizedLoan
        .connect(borrower)
        .depositCollateralAndRequestLoan(1, 3600, { value: ethers.parseEther("0.5") });
      await expect(collateralizedLoan
        .connect(lender)
        .fundLoan(1, { value: ethers.parseEther("0.5") })).to.emit(collateralizedLoan,"LoanFunded").withArgs(1);
      
      const loan = await collateralizedLoan.getLoan(1);
      
      expect(loan.isRepaid).to.equal(false);
      
      // advance time by one hour and mine a new block
      await time.increase(36000);
      // advance time to specific timestamp and mine a new block
      //await helpers.time.increaseTo(newTimestamp);
      // set the timestamp of the next block but don't mine a new block
      //await helpers.time.setNextBlockTimestamp(newTimestamp);

      await expect(collateralizedLoan
        .connect(lender)
        .claimCollateral(1)).to.emit(collateralizedLoan,"CollateralClaimed").withArgs(1);

      const afterLoan = await collateralizedLoan.getLoan(1);


      // TODO - display balance

      expect(afterLoan.isRepaid).to.equal(false);
      expect(afterLoan.isFunded).to.equal(true); 
      expect(afterLoan.isDischarged).to.equal(true);



    });
  });

// Test suite for claiming collateral
describe("Claiming Collateral Before Due", function () {
  it("Permits stops the lender reclaiming collateral before the loan repayment is due", async function () {
    // Loading the fixture
    // TODO: Set up test for claiming collateral
    // HINT: Simulate the passage of time if necessary
    const { collateralizedLoan, owner, borrower, lender } = await loadFixture(
      deployCollateralizedLoanFixture
    );

    const newTimestamp = time.latest();
    
    await collateralizedLoan
      .connect(borrower)
      .depositCollateralAndRequestLoan(1, 3600, { value: ethers.parseEther("0.5") });
    await expect(collateralizedLoan
      .connect(lender)
      .fundLoan(1, { value: ethers.parseEther("0.5") })).to.emit(collateralizedLoan,"LoanFunded").withArgs(1);
    
    const loan = await collateralizedLoan.getLoan(1);
    
    expect(loan.isRepaid).to.equal(false);
    
    // advance time by one hour and mine a new block
    await time.increase(360);
    // advance time to specific timestamp and mine a new block
    //await helpers.time.increaseTo(newTimestamp);
    // set the timestamp of the next block but don't mine a new block
    //await helpers.time.setNextBlockTimestamp(newTimestamp);

    await expect(collateralizedLoan
      .connect(lender)
      .claimCollateral(1)).to.be.revertedWith("Loan repayment date not attained.");




  });
});

});
