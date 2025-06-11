import bcrypt from 'bcrypt';

const realHash = '$2b$10$/0E4W5VSCEqr6y7hv5quY.bNZmSohdQawWyEm/5GPO/iHqXVKtgF.';
const testPassword = 'Twilight0';

bcrypt.compare(testPassword, realHash)
  .then(result => {
    console.log('Výsledek porovnání:', result);
  })
  .catch(err => {
    console.error('Chyba bcrypt:', err);
  }); 