
      module.exports = {
        solidity: {
          version: "0.8.17",
          settings: {
            optimizer: {
              enabled: false,
              runs: 0
            },
            evmVersion: "london",
            outputSelection: {
              "*": {
                "*": [
                  "abi",
                  "evm.bytecode",
                  "evm.deployedBytecode",
                  "evm.methodIdentifiers"
                ]
              }
            }
          }
        }
      };
    