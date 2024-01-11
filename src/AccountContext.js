import React, { createContext, useContext, useState } from 'react';
import { web3AccountsSubscribe, web3Enable } from '@polkadot/extension-dapp';
import { Button, Card, Dropdown } from 'react-bootstrap';

const AccountContext = createContext();

const AccountProvider = ({ appName, children }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const connectAccounts = async () => {
    try {
      await web3Enable(appName);
      const unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
        setAccounts(injectedAccounts);
        if (injectedAccounts.length > 0 && !selectedAccount) {
          // Set the first account as the selected account initially
          setSelectedAccount(injectedAccounts[0]);
        }
      });

      setIsConnected(true);
      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleAccountChange = (account) => {
    setSelectedAccount(account);
  };

  return (
    <AccountContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      <Card>
        <Card.Body>
        <Card.Title>Account Selector</Card.Title>
        <div>
          {!isConnected ? (
            <Button onClick={connectAccounts}>
              Connect to Polkadot Extension
            </Button>
          ) : accounts.length > 0 ? (
            <div>
              <Dropdown>
                <Dropdown.Toggle variant="primary">
                  {selectedAccount
                    ? `${selectedAccount.meta.name} - ${selectedAccount.address}`
                    : 'Select Account'}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {accounts.map((account) => (
                    <Dropdown.Item
                      key={account.address}
                      onClick={() => handleAccountChange(account)}
                    >
                      {account.meta.name} - {account.address}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          ) : (
            <p>
              No accounts found. Make sure the Polkadot extension is installed
              and unlocked.
            </p>
          )}
        </div>
        </Card.Body>
      </Card>
      {children}
    </AccountContext.Provider>
  );
};

const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

export { AccountProvider, useAccount };
