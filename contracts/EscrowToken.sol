pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract TokenInterface {
  function transfer(address _to, uint256 _value) public returns (bool);
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);
}

contract EscrowToken is Ownable {
  using SafeMath for uint256;

  uint8 constant STATUS_WAITING  = 0x00;
  uint8 constant STATUS_STAND_BY = 0x01;
  uint8 constant STATUS_FINISHED = 0x02;
  uint8 constant STATUS_CANCELED = 0x03;
  uint8 constant STATUS_REJECTED = 0x04;
  uint8 constant STATUS_REFUNDED = 0x05;

  uint8 constant FLAG_CREATOR    = 0X01;
  uint8 constant FLAG_ACCEPTOR   = 0X02;
  
  TokenInterface token;
  // Set token for escrow 
  function setTokenInterface(address contractAddress) onlyOwner external {
    token = TokenInterface(contractAddress);
  }
  // ---------- For test ----------
  function getTokenAddress() onlyOwner external view returns (address) {
    return address(token);
  }
  // ---------- For test ----------

  address owner;
  uint    tradeFee = 0;
  uint    totalFinishedFee = 0;

  mapping (bytes32 => Escrow)     public escrows;

  struct Escrow {
    address creator;    // creator_address;
    address acceptor;   // acceptor_address;
    uint    balance;    // escrow_balance
    uint    expire;     // start = now; //now is an alias for block.timestamp, not really "now"
    bytes32 detail;     // description text
    uint    feeCreator;
    uint    feeAcceptor;
    uint8   status;
  }
  event Created(bytes32 _tradeHash);
  event Commit(bytes32 _tradeHash, address _acceptor);
  event Request(uint _expire, bytes32 _detail, uint _amount, bytes32 _tradeHash);
  event Release(uint _amount, bytes32 _tradeHash);
  event Cancel(uint _amount, bytes32 _tradeHash);
  event Offer(uint _expire, bytes32 _detail, bytes32 _tradeHash);
  event Accept(bytes32 _tradeHash, address _creator);
  event Reject(bytes32 _tradeHash);
  event Refund(bytes32 _tradeHash);
  event Withdraw(uint256 _amount);

  function createEscrow(
    address _account,
    uint    _balance,
    uint    _expire,
    bytes32 _detail,
    uint    _nonce,
    uint8   _flag
  ) public returns (bytes32) {
    bytes32 _tradeHash = keccak256(_balance, _expire, _nonce);
    escrows[_tradeHash] = Escrow({
      creator: _flag == FLAG_CREATOR ? _account : 0x0,
      acceptor: _flag == FLAG_ACCEPTOR ? _account : 0x0,
      balance: _balance,
      expire: _expire,
      detail: _detail,
      feeCreator: _flag == FLAG_CREATOR ? tradeFee : 0x0,
      feeAcceptor: _flag == FLAG_ACCEPTOR ? tradeFee : 0x0,
      status: STATUS_WAITING
    });
    Created(_tradeHash);
    return _tradeHash;
  }

  // ----- Request set -----

  function request(uint _expire, uint _nonce, bytes32 _detail, uint _amount) external returns (bytes32) {
    require(_expire > now);

    uint totalAmount = _amount.add(tradeFee);
    token.transferFrom(msg.sender,address(this), totalAmount);
    bytes32 _tradeHash = createEscrow(msg.sender,_amount,_expire,_detail,_nonce,FLAG_CREATOR);
    Request(_expire, _detail, _amount, _tradeHash);
    return _tradeHash;
  }

  function commit(bytes32 _tradeHash) external {
    require (
      escrows[_tradeHash].creator != address(0) &&
      escrows[_tradeHash].acceptor == address(0) &&
      escrows[_tradeHash].expire > now &&
      msg.sender != escrows[_tradeHash].creator
    );
    token.transferFrom(msg.sender,address(this), tradeFee);
    escrows[_tradeHash].acceptor = msg.sender;
    escrows[_tradeHash].feeAcceptor = tradeFee;
    escrows[_tradeHash].status = STATUS_STAND_BY;
    Commit(_tradeHash,msg.sender);
  }

  function release(bytes32 _tradeHash) external {
    require(
      msg.sender == escrows[_tradeHash].creator &&
      escrows[_tradeHash].status == STATUS_STAND_BY
    );
    escrows[_tradeHash].status = STATUS_FINISHED;
    totalFinishedFee = totalFinishedFee.add((escrows[_tradeHash].feeCreator).add(escrows[_tradeHash].feeAcceptor));
    token.transfer(escrows[_tradeHash].acceptor, escrows[_tradeHash].balance);
    Release(escrows[_tradeHash].balance, _tradeHash);
  }

  function cancel(bytes32 _tradeHash) external {
    require (
      msg.sender == escrows[_tradeHash].acceptor && 
      escrows[_tradeHash].status == STATUS_STAND_BY
    );
    var totalAmount = (escrows[_tradeHash].balance).add(escrows[_tradeHash].feeCreator);
    token.transfer(escrows[_tradeHash].creator,totalAmount);
    token.transfer(escrows[_tradeHash].acceptor,tradeFee);
    escrows[_tradeHash].status = STATUS_CANCELED;
    Cancel(escrows[_tradeHash].balance, _tradeHash);
  }

  // ----- Request set -----

  // ----- Offer set -----

  function offer(uint _expire, uint _nonce, bytes32 _detail) external returns (bytes32) {
    require(_expire > now);

    token.transferFrom(msg.sender,address(this), tradeFee);
    bytes32 _tradeHash = createEscrow(msg.sender,0x0,_expire,_detail,_nonce,FLAG_ACCEPTOR);
    Offer(_expire, _detail, _tradeHash);
    return _tradeHash;
  }

  function accept(bytes32 _tradeHash, uint _amount) external {
    require(
      escrows[_tradeHash].creator == address(0) &&
      escrows[_tradeHash].acceptor != address(0) &&
      escrows[_tradeHash].expire > now &&
      msg.sender != escrows[_tradeHash].acceptor
    );

    token.transferFrom(msg.sender,address(this), _amount.add(tradeFee));
    escrows[_tradeHash].creator = msg.sender;
    escrows[_tradeHash].feeCreator = tradeFee;
    escrows[_tradeHash].balance = _amount;
    escrows[_tradeHash].status = STATUS_STAND_BY;
    Accept(_tradeHash,msg.sender);
  }

  // ----- Offer set -----

  function reject(bytes32 _tradeHash) external {
    require ((
        msg.sender == escrows[_tradeHash].creator ||
        msg.sender == escrows[_tradeHash].acceptor) &&
        escrows[_tradeHash].status == STATUS_WAITING &&
        escrows[_tradeHash].expire >= now
    );
    if (escrows[_tradeHash].acceptor != address(0))
      token.transfer(msg.sender, escrows[_tradeHash].feeAcceptor);
    else if (escrows[_tradeHash].creator != address(0))
      token.transfer(msg.sender, (escrows[_tradeHash].balance).add(escrows[_tradeHash].feeCreator));
    escrows[_tradeHash].status = STATUS_REJECTED;
    Reject(_tradeHash);
  }

  function refund(bytes32 _tradeHash) external {
    require ((
      msg.sender == escrows[_tradeHash].creator ||
      msg.sender == escrows[_tradeHash].acceptor) &&
      escrows[_tradeHash].status == STATUS_WAITING &&
      escrows[_tradeHash].expire < now
    );
    if (escrows[_tradeHash].acceptor != address(0))
      token.transfer(msg.sender, escrows[_tradeHash].feeAcceptor);
    else if (escrows[_tradeHash].creator != address(0))
      token.transfer(msg.sender, (escrows[_tradeHash].balance).add(escrows[_tradeHash].feeCreator));
    escrows[_tradeHash].status = STATUS_REFUNDED;
    Refund(_tradeHash);
  }

  // Owner
  function setFee(uint _fee) onlyOwner public {
    tradeFee = _fee;
  }

  function getFee() public view returns (uint) {
    return tradeFee;
  }

  function withdrawOwner() onlyOwner external {
    if (token.transfer(msg.sender, totalFinishedFee))
      Withdraw(totalFinishedFee);
      totalFinishedFee = 0;
  }

  function getTotalFinishedFee() onlyOwner view public returns (uint) {
    return totalFinishedFee;
  }

}
