var GigaCrowdsale = artifacts.require("GigaCrowdsale.sol");

module.exports = function(deployer, network, accounts) {
  return liveDeploy(deployer, accounts);
};

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)} 
};


async function liveDeploy(deployer, accounts) {
//  const BigNumber = web3.BigNumber;
  const RATE = 35;
 //  Friday, December 1, 2017 12:00:01 AM  Epoch timestamp: 1512086401
  //const startTime = latestTime() + duration.minutes(1);
  const startTime = 1512086401;
  const endTime =  startTime + duration.weeks(6);
  const contactInfomation = "info@ipcs.vg";

  var parameters = ['uint256' , 'uint256',  'uint256', 'address','string'];
  var parameterNames = ['startTime uint256' , 'endTime uint256',  'rate uint256', 'wallet address'];
  var MyWeb3 = require('../node_modules/web3');
  var myWeb3 = new MyWeb3('http://localhost:8545');

  var values = [startTime, endTime, RATE, accounts[0], contactInfomation];
  var abiEncodedParameters = myWeb3.eth.abi.encodeParameters(parameters, values);
  var beforeBalance = web3.eth.getBalance(accounts[0]);

  console.log("Parameters:",parameterNames, values);
  // uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) 
  console.log('ABI Encoded Parameters:', abiEncodedParameters);
  return deployer.deploy(GigaCrowdsale, startTime, endTime, RATE, accounts[0], contactInfomation).then( async () => {
    const instance = await GigaCrowdsale.deployed();
    const token = await instance.token.call();
    console.log('Token Address:', token);
    var afterBalance = web3.eth.getBalance(accounts[0]);
    var cost = beforeBalance.sub(afterBalance);
    console.log('Migration Cost:', beforeBalance.toString(), afterBalance.toString(), cost.toString());
    
  })
}