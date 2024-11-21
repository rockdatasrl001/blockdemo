// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Collateralized Loan Contract
contract CollateralizedLoan {
    // Define the structure of a loan
    struct Loan {
        uint loanId;
        address borrower;
        // Hint: Add a field for the lender's address
        address payable lender;

        uint collateralAmount;
        // Hint: Add fields for loan amount, interest rate, due date, isFunded, isRepaid
        uint amount;
        uint interestRate;
        uint dueDate;
        bool isFunded;
        bool isRepaid;
        bool isDischarged;
        uint createdTimestamp; // when the loan was created
        uint fundedTimestamp; // when the loan was funded
        uint repaidTimestamp; // when the loan was repaid
        uint dischargedTimestamp; // when the loan was discharged
    }

    // Create a mapping to manage the loans
    mapping(uint => Loan) public loans;
    uint public nextLoanId;

    // Hint: Define events for loan requested, funded, repaid, and collateral claimed
    event LoanRequested(uint loanId);
    event LoanFunded(uint loanId);
    event LoanRepaid(uint loanId);
    event CollateralClaimed(uint loanId);
    

    // Custom Modifiers
    // Hint: Write a modifier to check if a loan exists
   modifier loanExists(uint _loanId) {
        require(_loanId > 0, "Invalid loan ID.");
        Loan storage loan = loans[_loanId];
        require(loan.loanId > 0, "Loan does not exist, no loanID configured.");
        _;
    }

    // Hint: Write a modifier to ensure a loan is not already funded
    modifier notAlreadyFunded(uint _loanId) {
        require(_loanId > 0, "Invalid loan ID.");
        Loan storage loan = loans[_loanId];
        require(!loan.isFunded, "Loan already is funded.");
        _;
    }

    // Hint: Write a modifier to ensure a loan is not already funded
    modifier notMustBeFunded(uint _loanId) {
        require(_loanId > 0, "Invalid loan ID.");
        Loan storage loan = loans[_loanId];
        require(loan.isFunded, "Loan not is funded.");
        _;
    }

    // Hint: Write a modifier to ensure a loan is not already funded
    modifier notAlreadyRepaid(uint _loanId) {
        require(_loanId > 0, "Invalid loan ID.");
        Loan storage loan = loans[_loanId];
        require(!loan.isRepaid, "Loan already is repaid.");
        _;
    }


    // Function to deposit collateral and request a loan
    function depositCollateralAndRequestLoan(uint _interestRate, uint _duration) external payable {
        // Hint: Check if the collateral is more than 0
        
        require(msg.value > 0, "Incorrect collateral");

        // Hint: Calculate the loan amount based on the collateralized amount
        uint loanAmount = _interestRate * msg.value;

        // Hint: Increment nextLoanId and create a new loan in the loans mapping
        nextLoanId++;

        loans[nextLoanId] = Loan({
                    loanId: nextLoanId,
                    borrower: payable(msg.sender),
                    lender: payable(address(0)),
                    collateralAmount: msg.value,
                    amount: loanAmount,
                    interestRate: _interestRate,
                    dueDate: _duration + block.timestamp,
                    isFunded: false,
                    isRepaid: false,
                    isDischarged: false,
                    createdTimestamp : block.timestamp,
                    fundedTimestamp : 0,
                    repaidTimestamp: 0,
                    dischargedTimestamp : 0
                });
               
        // Hint: Emit an event for loan request
        emit LoanRequested(nextLoanId);
    }

    // Function to fund a loan
    // Hint: Write the fundLoan function with necessary checks and logic
    function fundLoan(uint _loanId) external payable loanExists(_loanId) notAlreadyFunded(_loanId) {
        // Hint: Check if the collateral is more than 0
        
        Loan storage loan = loans[_loanId];

        require(loan.collateralAmount > 0, "Loan is not spefied with collateral");
        require(msg.value == loan.amount, "Wrong funding amount");

        loan.lender = payable(msg.sender);
        loan.fundedTimestamp = block.timestamp;
        loan.isFunded = true;
        
        // Hint: Emit an event for loan request
        emit LoanFunded(_loanId);

    }


    // Function to repay a loan
    // Hint: Write the repayLoan function with necessary checks and logic
    function repayLoan(uint _loanId) external payable loanExists(_loanId) notAlreadyRepaid(_loanId) notMustBeFunded(_loanId) {
        
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Sender is not borrower");
        require(msg.value == loan.amount, "Wrong repay amount");

        loan.isRepaid = true;
        loan.repaidTimestamp = block.timestamp;

        // Hint: Emit an event for loan request
        emit LoanRepaid(_loanId);
    }


    // Function to claim collateral on default
    // Hint: Write the claimCollateral function with necessary checks and logic
    function claimCollateral(uint _loanId) external payable loanExists(_loanId) notAlreadyRepaid(_loanId) {
        
        Loan storage loan = loans[_loanId];

        require(msg.sender == loan.lender, "Sender is not lender");
        require(!loan.isDischarged, "Collateral already claimed");      
        require(block.timestamp > loan.dueDate,"Loan repayment date not attained.");   

        loan.isDischarged = true;
        loan.dischargedTimestamp = block.timestamp;

        loan.lender.transfer(loan.collateralAmount);

        // Hint: Emit an event for loan request
        emit CollateralClaimed(_loanId);
    }

    function getLoan(uint _loanId) public view returns (Loan memory) {
        return loans[_loanId];
    }


}