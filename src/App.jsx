import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import './App.css';

function App() {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_API_KEY || 'fca_live_mKbqLVsq74fOtutwZBxWk6I01JyyHTfxYl0YruOc';

  const fetchConversion = async (from, to, amount) => {
    const cacheKey = `${from}_${to}`;
    const cachedRate = localStorage.getItem(cacheKey);
    const cacheExpire = localStorage.getItem(`${cacheKey}_timestamp`);

    if (cachedRate && cacheExpire && Date.now() < Number(cacheExpire)) {
      return {
        result: 'success',
        conversion_result: amount * cachedRate,
        fromCache: true
      };
    }

    try {
      const response = await fetch(
        `https://api.freecurrencyapi.com/v1/latest?apikey=${API_KEY}&base_currency=${from}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.data) {
        const rate = data.data[to];
        if (!rate) throw new Error(`Курс для ${to} не найден`);
        
        localStorage.setItem(cacheKey, rate);
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now() + 3600000);
        
        return {
          result: 'success',
          conversion_result: amount * rate
        };
      }
      
      throw new Error(data.message || 'Неизвестная ошибка API');
    } catch (error) {
      console.error('Ошибка запроса:', error);
      throw new Error(`Не удалось получить курс: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setResult('Введите сумму больше 0');
      return;
    }

    setIsLoading(true);
    try {
      const conversion = await fetchConversion(fromCurrency, toCurrency, amount);
      setResult(`${amount} ${fromCurrency} = ${conversion.conversion_result.toFixed(2)} ${toCurrency}`);
    } catch (error) {
      setResult(`Ошибка: ${error.message}. Попробуйте позже`);
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="app">
      <h1>Конвертер валют</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Сумма:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="currency-container">
          <div className="form-group">
            <label>Из:</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              <option value="USD">USD (Доллар США)</option>
              <option value="EUR">EUR (Евро)</option>
              <option value="RUB">RUB (Рубль)</option>
              <option value="GBP">GBP (Фунт стерлингов)</option>
              <option value="JPY">JPY (Иена)</option>
              <option value="CNY">CNY (Юань)</option>
              <option value="TRY">TRY (Турецкая лира)</option>
            </select>
          </div>

          <button 
            type="button" 
            className="swap-btn"
            onClick={swapCurrencies}
            title="Поменять валюты местами"
          >
            ↔
          </button>

          <div className="form-group">
            <label>В:</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              <option value="EUR">EUR (Евро)</option>
              <option value="USD">USD (Доллар США)</option>
              <option value="RUB">RUB (Рубль)</option>
              <option value="GBP">GBP (Фунт стерлингов)</option>
              <option value="JPY">JPY (Иена)</option>
              <option value="CNY">CNY (Юань)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <ClipLoader size={20} color="#fff" /> Загрузка...
            </>
          ) : (
            'Конвертировать'
          )}
        </button>
      </form>

      {result && (
        <div className="result-container">
          <div className="result">{result}</div>
          <button 
            onClick={() => setResult(null)} 
            className="reset-btn"
          >
            Сбросить результат
          </button>
        </div>
      )}
    </div>
  );
}

export default App;