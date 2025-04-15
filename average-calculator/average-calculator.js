const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

const numberStore = {
  windowSize: 10,
  windowPrevState: [],
  windowCurrState: []
};

const API_BASE_URL = 'http://20.244.56.144/evaluation-service';
const ENDPOINTS = {
  p: ${API_BASE_URL}/primes, 
  f: ${API_BASE_URL}/fibo,  
  e: ${API_BASE_URL}/even,   
  r: ${API_BASE_URL}/rand   
};

app.use(express.json());

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

app.get('/numbers/:id', async (req, res) => {
  const startTime = Date.now();
  const id = req.params.id;
  
  if (!ENDPOINTS[id]) {
    return res.status(400).json({ 
      error: "Invalid ID. Use 'p' for prime, 'f' for fibonacci, 'e' for even, or 'r' for random" 
    });
  }
  
  try {
    numberStore.windowPrevState = [...numberStore.windowCurrState];
    
    const response = await axios.get(ENDPOINTS[id]);
    const fetchedNumbers = response.data.numbers || [];
    
    const uniqueNumbers = [...new Set(fetchedNumbers)];
    
    numberStore.windowCurrState = [...uniqueNumbers];
    
    if (numberStore.windowCurrState.length < numberStore.windowSize) {

        const avg = calculateAverage(numberStore.windowCurrState);
      
      const responseData = {
        windowPrevState: numberStore.windowPrevState,
        windowCurrState: numberStore.windowCurrState,
        numbers: uniqueNumbers, 
        avg: parseFloat(avg.toFixed(2))
      };
      
      return res.json(responseData);
    } else {
      if (numberStore.windowCurrState.length > numberStore.windowSize) {
        numberStore.windowCurrState = numberStore.windowCurrState.slice(
          numberStore.windowCurrState.length - numberStore.windowSize
        );
      }
      
      const avg = calculateAverage(numberStore.windowCurrState);
      
      const responseData = {
        windowPrevState: numberStore.windowPrevState,
        windowCurrState: numberStore.windowCurrState,
        numbers: uniqueNumbers, 
        avg: parseFloat(avg.toFixed(2))
      };
      
      const responseTime = Date.now() - startTime;
      if (responseTime > 200) {
        console.warn(Response time exceeded 200ms: ${responseTime}ms);
      }
      
      return res.json(responseData);
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return res.status(500).json({ error: 'Failed to fetch data from external API' });
  }
});

app.listen(port, () => {
  console.log(Average Calculator Microservice running at ${port});
});

module.exports = app;
